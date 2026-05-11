import { CreateOrdemServicoDTO, PatchOrdemServicoDTO, UpdateOrdemServicoDTO } from './../schemas/ordemServicoSchema';
import { appDataSource } from "../database/appDataSource";
import { AppError } from "../errors/AppError"
import { Repository, In, IsNull } from "typeorm";
import { OrdemServico } from "../entities/ordemServicoEntity";
import { AguardandoPecaLog } from "../entities/aguardandoPecaLogEntity";
import { ContadorOs } from "../entities/contadorOsEntity";
import { Usuarios } from "../entities/usuarioEntity";
import { enumStatus } from "../types/Status";
import { enumPerfil } from "../types/Perfil";
import { enumPrioridade } from "../types/Prioridade";

interface FindAllOrdemServicoFilters {
    status?: enumStatus;
    prioridade?: enumPrioridade;
}

export default class OrdemServicoService {
    private ordemServicoRepository: Repository <OrdemServico>;
    private aguardandoPecaLogRepository: Repository<AguardandoPecaLog>;
    private usuarioRepository: Repository<Usuarios>;
    private contadorOsRepository: Repository<ContadorOs>;

    constructor(){
        this.ordemServicoRepository = appDataSource.getRepository(OrdemServico);
        this.aguardandoPecaLogRepository = appDataSource.getRepository(AguardandoPecaLog);
        this.usuarioRepository = appDataSource.getRepository(Usuarios);
        this.contadorOsRepository = appDataSource.getRepository(ContadorOs);
    }

    private isStatusTransitionAllowed(currentStatus: enumStatus, nextStatus: enumStatus): boolean {
        // Permite manter o mesmo status sem erro.
        if (currentStatus === nextStatus) return true;

        // Mapa central das transições válidas de status.
        const allowedTransitions: Record<enumStatus, enumStatus[]> = {
            [enumStatus.ABERTO]: [enumStatus.EM_ANDAMENTO],
            [enumStatus.EM_ANDAMENTO]: [
                enumStatus.AGUARDANDO_PECA,
                enumStatus.CONCLUIDO,
                enumStatus.CANCELADO,
            ],
            [enumStatus.AGUARDANDO_PECA]: [enumStatus.EM_ANDAMENTO, enumStatus.CANCELADO],
            [enumStatus.CONCLUIDO]: [],
            [enumStatus.CANCELADO]: [],
        };

        return allowedTransitions[currentStatus].includes(nextStatus);
    }

    /**
     * Valida que inicioEm não pode ser alterado após ser setado.
     * Uma vez preenchido (primeira transição para EM_ANDAMENTO), é imutável.
     */
    private validateInicioEmImmutability(currentOS: OrdemServico, newData: any): void {
        if (currentOS.inicioEm && newData.inicioEm && currentOS.inicioEm !== newData.inicioEm) {
            throw new AppError(
                "Data de início não pode ser alterada após ser definida",
                400
            );
        }
    }

    /**
     * Calcula horas trabalhadas baseado no status final.
     * - CONCLUIDO: subtrai tempo de AGUARDANDO_PECA
     * - CANCELADO: inclui tempo de AGUARDANDO_PECA
     */
    private async calculateHorasTrabalhadas(
        initialHours: number,
        inicioEm: Date,
        conclusaoEm: Date,
        statusFinal: enumStatus,
        idOrdemServico: string
    ): Promise<number> {
        // Calcula diferença de tempo em horas
        const inicio = inicioEm instanceof Date ? inicioEm : new Date(inicioEm);
        const conclusao = conclusaoEm instanceof Date ? conclusaoEm : new Date(conclusaoEm);
        const diffMs = conclusao.getTime() - inicio.getTime();
        const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

        // Buscar tempo total de aguardando peça
        let totalHorasAguardando = 0;
        try {
            const logsResult = await this.aguardandoPecaLogRepository.query(
                `SELECT COALESCE(SUM(CAST("horas_aguardando_peca" AS NUMERIC)), 0) as total
                 FROM "aguardando_peca_log"
                 WHERE "id_ordem_servico" = $1 AND "aguardando_peca_fim" IS NOT NULL`,
                [idOrdemServico]
            );
            totalHorasAguardando = logsResult[0]?.total ? Number(logsResult[0].total) : 0;
        } catch (error) {
            console.error("[ERROR] ao calcular horas de aguardo:", error);
        }

        // Aplicar lógica diferenciada por status
        if (statusFinal === enumStatus.CONCLUIDO) {
            // OS CONCLUIDA: subtrai tempo de aguardo de peça
            return Math.max(0, Number((totalHours - totalHorasAguardando).toFixed(2)));
        } else if (statusFinal === enumStatus.CANCELADO) {
            // OS CANCELADA: inclui todo tempo (mesmo aguardando) como trabalhado
            return Number(totalHours.toFixed(2));
        }

        return totalHours;
    }

    /**
     * Aplicar lógica compartilhada de logs para aguardando peça.
     * Válida para PUT e PATCH: cria log ao entrar em AGUARDANDO_PECA,
     * fecha e calcula horas ao sair.
     */
    private async applyAguardandoPecaLogic(
        idOrdemServico: string,
        currentStatus: enumStatus,
        nextStatus: enumStatus
    ): Promise<void> {
        console.log("[DEBUG] applyAguardandoPecaLogic chamado:", { idOrdemServico, currentStatus, nextStatus });
        
        // Entrada em AGUARDANDO_PECA: cria novo log
        if (nextStatus === enumStatus.AGUARDANDO_PECA) {
            try {
                // Usar raw INSERT em vez de save() que não está funcionando
                await this.aguardandoPecaLogRepository.query(
                    `INSERT INTO "aguardando_peca_log" ("idLog", "id_ordem_servico", "aguardando_peca_inicio", "data_criacao")
                     VALUES (gen_random_uuid(), $1, $2, NOW())`,
                    [idOrdemServico, new Date()]
                );
                console.log("[LOG CREATE] Novo log criado com INSERT");
            } catch (error) {
                console.error("[ERROR] Erro ao criar log:", error);
                throw error;
            }
        }

        // Saída de AGUARDANDO_PECA: finaliza o log aberto e calcula horas
        if (currentStatus === enumStatus.AGUARDANDO_PECA && nextStatus !== enumStatus.AGUARDANDO_PECA) {
            console.log("[DEBUG] [SAÍDA] Fechando log - currentStatus:", currentStatus, "nextStatus:", nextStatus);
            try {
                // Busca o log aberto (sem fim) mais recente usando raw SQL
                const logResult = await this.aguardandoPecaLogRepository.query(
                    `SELECT "idLog", "aguardando_peca_inicio" 
                     FROM "aguardando_peca_log" 
                     WHERE "id_ordem_servico" = $1 AND "aguardando_peca_fim" IS NULL
                     ORDER BY "data_criacao" DESC 
                     LIMIT 1`,
                    [idOrdemServico]
                );

                if (logResult && logResult.length > 0) {
                    const logId = logResult[0].idLog;
                    const inicioTime = new Date(logResult[0].aguardando_peca_inicio);
                    const agora = new Date();
                    const horasAguardando = (agora.getTime() - inicioTime.getTime()) / (1000 * 60 * 60);
                    const horas = Number(horasAguardando.toFixed(2));
                    
                    await this.aguardandoPecaLogRepository.query(
                        `UPDATE "aguardando_peca_log" 
                         SET "aguardando_peca_fim" = $1, "horas_aguardando_peca" = $2 
                         WHERE "idLog" = $3`,
                        [agora, horas, logId]
                    );
                }
            } catch (error) {
                console.error("[ERROR] Erro ao fechar log de aguardando peça:", error);
                throw error;
            }
        }
    }

    /**
     * Gera automaticamente o número sequencial da Ordem de Serviço.
     * 
     * Formato: OS-YYYYMMDD-XXXX   (Exemplo: OS-20250426-0001)
     * 
     * Lógica:
     * 1. Obtém a data de hoje (YYYYMMDD)
     * 2. Busca registro em contador_os para essa data
     * 3. Se não existe, cria novo com proxNum=1
     * 4. Se existe, incrementa proxNum de forma atômica
     * 5. Retorna número formatado com zero-padding (4 dígitos)
     * 
     * Thread-safety: A PRIMARY KEY da tabela contador_os por data + UPDATE atômico garante
     * que múltiplas requisições simultâneas gerem números sequenciais sem duplicatas.
     */
    private async generateOSNumber(): Promise<string> {
        // Formata data de hoje como YYYYMMDD
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        const dataFormatada = `${ano}${mes}${dia}`;
        
        // Cria objeto Date para usar como chave primária (DATE type)
        const dataPK = new Date(ano, hoje.getMonth(), hoje.getDate());

        // Busca ou cria registro de contador para hoje
        let contador = await this.contadorOsRepository.findOne({
            where: { data: dataPK }
        });

        if (!contador) {
            // Primeiro OS do dia: cria registro
            contador = new ContadorOs();
            contador.data = dataPK;
            contador.proximoNumero = 1;
            await this.contadorOsRepository.save(contador);
        } else {
            // Incrementa atomicamente (nextval padrão de banco)
            contador.proximoNumero++;
            await this.contadorOsRepository.save(contador);
        }

        // Formata o número com zero-padding (4 dígitos)
        const numeroFormatado = contador.proximoNumero.toString().padStart(3, '0');
        
        return `OS${dataFormatada}-${numeroFormatado}`;
    }

    //GET
    public async findAll(filters?: FindAllOrdemServicoFilters): Promise<OrdemServico[]> {
        // where dinâmico: sem filtros retorna a listagem completa.
        const where: Partial<OrdemServico> = {};

        if (filters?.status) {
            // Valida enum para retornar erro 400 previsível antes da consulta.
            const validStatus = Object.values(enumStatus).includes(filters.status);
            if (!validStatus) {
                throw new AppError("Filtro de status inválido", 400);
            }
            where.statusOrdemServico = filters.status;
        }

        if (filters?.prioridade) {
            // Valida enum para prioridade e evita filtro inválido silencioso.
            const validPrioridade = Object.values(enumPrioridade).includes(filters.prioridade);
            if (!validPrioridade) {
                throw new AppError("Filtro de prioridade inválido", 400);
            }
            where.prioridadeOrdemServico = filters.prioridade;
        }

        // AND automático do TypeORM quando status e prioridade coexistem no mesmo where.
        const ordens = await this.ordemServicoRepository.find({
            where,
            relations: ['aguardandoPecaLogs'],
            order: { dataCriacao: "DESC" },
        });

        // Calcular totalHorasAguardando para cada OS
        return ordens.map(ordem => ({
            ...ordem,
            totalHorasAguardando: ordem.aguardandoPecaLogs
                .filter(log => log.aguardandoPecaFim !== null)
                .reduce((sum, log) => sum + (log.horasAguardandoPeca || 0), 0)
        })) as any;
    }

    public async findById (idOrdemServico: string): Promise<OrdemServico> {
        const ordemServico = await this.ordemServicoRepository.findOne({
            where: { idOrdemServico},
            relations: ['aguardandoPecaLogs']
        });
        if (!ordemServico){
            throw new AppError ("Ordem de Serviço não encontrada", 404);
        }

        // Calcular totalHorasAguardando
        const totalHorasAguardando = ordemServico.aguardandoPecaLogs
            .filter(log => log.aguardandoPecaFim !== null)
            .reduce((sum, log) => sum + (log.horasAguardandoPeca || 0), 0);

        return {
            ...ordemServico,
            totalHorasAguardando
        } as any;
    }

    //CREATE
    public async createOrdemServico(data: CreateOrdemServicoDTO): Promise<OrdemServico> {
        
        //Valida não criação de  2+ OS, utilizando o mesmo equipamento (IDequipamento)
        const osEmProgresso = await this.ordemServicoRepository.findOne({
            where: {
                idEquipamento: data.idEquipamento,
                statusOrdemServico: In([
                    enumStatus.ABERTO,
                    enumStatus.EM_ANDAMENTO,
                    enumStatus.AGUARDANDO_PECA
                ])
            }
        });

        if (osEmProgresso) {
            throw new AppError(
                `Equipamento já possui OS em progresso: ${osEmProgresso.numeroOrdemServico}. Finalize ou cancele antes de abrir uma nova.`,
                409
            );
        }

        // Se numeroOrdemServico não foi fornecido, gera automaticamente
        if (!data.numeroOrdemServico) {
            data.numeroOrdemServico = await this.generateOSNumber();
        } else {
            // Se foi fornecido, valida se já existe (backward compatibility)
            const numeroOSExistente = await this.ordemServicoRepository.findOne({
                where: { numeroOrdemServico: data.numeroOrdemServico}
            });
            if (numeroOSExistente){
                throw new AppError(`Já existe uma Ordem de Serviço com o número: ${data.numeroOrdemServico}`, 409);
            }
        }
        
        // NOVO
        const novaOrdemServico = new OrdemServico(data);
        
        /* ANTES
        const novaOrdemServico = this.ordemServicoRepository.create({
            numeroOrdemServico: data.numeroOrdemServico,
            idEquipamento: data.idEquipamento,
            idSolicitante: data.idSolicitante,
            idTecnico: data.idTecnico,
            tipoManutencao: data.tipoManutencao,
            prioridadeOrdemServico: data.prioridadeOrdemServico,
            statusOrdemServico: data.statusOrdemServico,
            descricaoFalha: data.descricaoFalha,
            descricaoServico: data.descricaoServico,
            pecasUtilizadas: data.pecasUtilizadas,
            horasTrabalhadas: data.horasTrabalhadas,
            inicioEm: data.inicioEm,
            conclusaoEm: data.conclusaoEm,
            aberturaEm: data.aberturaEm
        });
        */
        
        return await this.ordemServicoRepository.save(novaOrdemServico);
    }

    //UPDATE
    public async updateOrdemServico(idOrdemServico: string, data: UpdateOrdemServicoDTO): Promise<OrdemServico> {
        console.log("[DEBUG] updateOrdemServico chamado com idOrdemServico:", idOrdemServico);
        console.log("[DEBUG] data.statusOrdemServico:", data.statusOrdemServico);
        
        const ordemServico = await this.findById(idOrdemServico);
        console.log("[DEBUG] OrdemServico encontrada, statusAtual:", ordemServico.statusOrdemServico);

        if(data.numeroOrdemServico && data.numeroOrdemServico !== ordemServico.numeroOrdemServico){
            const numeroExistente = await this.ordemServicoRepository.findOne({
                where: { numeroOrdemServico: data.numeroOrdemServico }
            });

            if (numeroExistente){
                throw new AppError (`Já existe uma Ordem de Serviço com o número: ${data.numeroOrdemServico}`, 409);
            }
        }
        
        // Validar imutabilidade de inicioEm
        this.validateInicioEmImmutability(ordemServico, data);
        
        // ✅ Capturar status anterior ANTES do merge
        const previousStatus = ordemServico.statusOrdemServico as enumStatus;
        console.log("[DEBUG] previousStatus capturado:", previousStatus);

        // Merge seletivo: apenas campos do payload (evita sobrescrever com undefined)
        Object.keys(data).forEach(key => {
            if ((data as any)[key] !== undefined) {
                (ordemServico as any)[key] = (data as any)[key];
            }
        });

        // Aplicar lógica de logs aguardando peça se status está sendo alterado
        // ✅ Usar previousStatus na comparação (não o merge já alterado)
        if (data.statusOrdemServico && data.statusOrdemServico !== previousStatus) {
            const currentStatus = previousStatus;
            const nextStatus = data.statusOrdemServico as enumStatus;

            console.log("[DEBUG] Status mudando de", currentStatus, "para", nextStatus);

            // Bloqueia transições fora do fluxo definido no domínio
            if (!this.isStatusTransitionAllowed(currentStatus, nextStatus)) {
                throw new AppError(
                    `Transição de status inválida: ${currentStatus} -> ${nextStatus}`,
                    400
                );
            }

            // Aplicar lógica compartilhada de logs
            console.log("[DEBUG] Chamando applyAguardandoPecaLogic com idOrdemServico:", idOrdemServico);
            await this.applyAguardandoPecaLogic(idOrdemServico, currentStatus, nextStatus);
        }

        // Se concluir, SEMPRE registra timestamp automático (ignora conclusaoEm do payload para evitar datas incorretas)
        if (ordemServico.statusOrdemServico === enumStatus.CONCLUIDO) {
            ordemServico.conclusaoEm = new Date();
            console.log("[UPDATE] Data de conclusão FORÇADA para CONCLUIDO:", ordemServico.conclusaoEm);
        }

        // Se cancelar, SEMPRE registra timestamp automático
        if (ordemServico.statusOrdemServico === enumStatus.CANCELADO) {
            ordemServico.conclusaoEm = new Date();
            console.log("[UPDATE] Data de conclusão FORÇADA para CANCELADO:", ordemServico.conclusaoEm);
        }

        // Calcular horas trabalhadas automaticamente ao finalizar (CONCLUIDO ou CANCELADO)
        if (
            (ordemServico.statusOrdemServico === enumStatus.CONCLUIDO || 
             ordemServico.statusOrdemServico === enumStatus.CANCELADO) &&
            ordemServico.inicioEm &&
            ordemServico.conclusaoEm &&
            !data.horasTrabalhadas
        ) {
            const calculatedHours = await this.calculateHorasTrabalhadas(
                ordemServico.horasTrabalhadas || 0,
                ordemServico.inicioEm,
                ordemServico.conclusaoEm,
                ordemServico.statusOrdemServico,
                idOrdemServico
            );
            ordemServico.horasTrabalhadas = calculatedHours;
            console.log("[UPDATE] Horas trabalhadas calculadas:", ordemServico.horasTrabalhadas);
        }

        return await this.ordemServicoRepository.save(ordemServico);
    }

    //PATCH
    public async patchOrdemServico(idOrdemServico: string, data: PatchOrdemServicoDTO): Promise<any> {
        const ordemServico = await this.findById(idOrdemServico);

        // PATCH precisa de ao menos um campo para atualizar.
        if (Object.keys(data).length === 0) {
            throw new AppError("Informe ao menos um campo para atualização parcial", 400);
        }

        // Validar imutabilidade de inicioEm
        this.validateInicioEmImmutability(ordemServico, data);

        let debugInfo = {
            statusMudou: false,
            aguardandoPecaLogicChamada: false,
            currentStatus: ordemServico.statusOrdemServico,
            nextStatus: data.statusOrdemServico
        };

        // Mapear campos básicos que podem vir do PATCH
        if (data.tipoManutencao !== undefined) {
            ordemServico.tipoManutencao = data.tipoManutencao;
        }
        
        if (data.prioridadeOrdemServico !== undefined) {
            ordemServico.prioridadeOrdemServico = data.prioridadeOrdemServico;
        }
        
        if (data.descricaoFalha !== undefined) {
            ordemServico.descricaoFalha = data.descricaoFalha;
        }

        if (data.idTecnico) {
            // Garante que o técnico informado existe e possui perfil válido.
            const tecnico = await this.usuarioRepository.findOne({ where: { idUsuario: data.idTecnico } });
            if (!tecnico) {
                throw new AppError("Técnico não encontrado", 404);
            }
            if (tecnico.perfilUsuario !== enumPerfil.TECNICO) {
                throw new AppError("O usuário informado não possui perfil técnico", 400);
            }
            ordemServico.idTecnico = data.idTecnico;
        }

        if (data.statusOrdemServico) {
            const currentStatus = ordemServico.statusOrdemServico as enumStatus;
            const nextStatus = data.statusOrdemServico as enumStatus;

            debugInfo.statusMudou = true;
            debugInfo.currentStatus = currentStatus;
            debugInfo.nextStatus = nextStatus;

            // Bloqueia transições fora do fluxo definido no domínio.
            if (!this.isStatusTransitionAllowed(currentStatus, nextStatus)) {
                throw new AppError(
                    `Transição de status inválida: ${currentStatus} -> ${nextStatus}`,
                    400
                );
            }

            // Conclusão exige dados mínimos para rastreabilidade.
            if (
                nextStatus === enumStatus.CONCLUIDO &&
                !data.descricaoServico
            ) {
                throw new AppError(
                    "Para concluir uma OS, informe descrição do serviço",
                    400
                );
            }

            // Contar logs ANTES
            const countBeforeResult = await this.aguardandoPecaLogRepository.query(
                `SELECT COUNT(*) FROM "aguardando_peca_log" WHERE "id_ordem_servico" = $1`,
                [idOrdemServico]
            );
            const logCountBefore = parseInt(countBeforeResult[0].count || 0);
            
            // Aplicar lógica compartilhada de logs aguardando peça
            debugInfo.aguardandoPecaLogicChamada = true;
            await this.applyAguardandoPecaLogic(idOrdemServico, currentStatus, nextStatus);

            ordemServico.statusOrdemServico = nextStatus;
        }

        if (data.descricaoServico !== undefined) ordemServico.descricaoServico = data.descricaoServico;
        if (data.pecasUtilizadas !== undefined) ordemServico.pecasUtilizadas = data.pecasUtilizadas;
        if (data.horasTrabalhadas !== undefined) ordemServico.horasTrabalhadas = data.horasTrabalhadas;
        if (data.inicioEm !== undefined) ordemServico.inicioEm = data.inicioEm;
        if (data.dataPrevistaConclusao !== undefined) ordemServico.dataPrevistaConclusao = data.dataPrevistaConclusao;

        // Se entrar em andamento sem início informado, registra timestamp automático.
        if (data.statusOrdemServico === enumStatus.EM_ANDAMENTO && !ordemServico.inicioEm) {
            ordemServico.inicioEm = new Date();
        }

        // Se concluir, SEMPRE registra timestamp automático (ignora conclusaoEm do payload para evitar datas incorretas)
        if (data.statusOrdemServico === enumStatus.CONCLUIDO) {
            ordemServico.conclusaoEm = new Date();
            console.log("[PATCH] Data de conclusão FORÇADA para CONCLUIDO:", ordemServico.conclusaoEm);
        }

        // Se cancelar, SEMPRE registra timestamp automático
        if (data.statusOrdemServico === enumStatus.CANCELADO) {
            ordemServico.conclusaoEm = new Date();
            console.log("[PATCH] Data de conclusão FORÇADA para CANCELADO:", ordemServico.conclusaoEm);
        }

        // Calcular horas trabalhadas automaticamente ao finalizar (CONCLUIDO ou CANCELADO)
        if (
            (data.statusOrdemServico === enumStatus.CONCLUIDO || 
             data.statusOrdemServico === enumStatus.CANCELADO) &&
            ordemServico.inicioEm &&
            ordemServico.conclusaoEm &&
            !data.horasTrabalhadas
        ) {
            const calculatedHours = await this.calculateHorasTrabalhadas(
                ordemServico.horasTrabalhadas || 0,
                ordemServico.inicioEm,
                ordemServico.conclusaoEm,
                ordemServico.statusOrdemServico,
                idOrdemServico
            );
            ordemServico.horasTrabalhadas = calculatedHours;
            console.log("[PATCH] Horas trabalhadas calculadas:", ordemServico.horasTrabalhadas);
        }
        const result = await this.ordemServicoRepository.save(ordemServico);
        console.log("[DEBUG HORAS DEPOIS SAVE] resultado retornado:", result.horasTrabalhadas);
        return { ...result, _debugInfo: debugInfo } as any;
    }

    //NOVO: Obter histórico de aguardo de peça
    public async getAguardandoPecaLog(idOrdemServico: string) {
        // Verifica se OS existe
        await this.findById(idOrdemServico);

        // Busca todos os logs de aguardo usando raw SQL
        const logs = await this.aguardandoPecaLogRepository.query(
            `SELECT "idLog", "aguardando_peca_inicio", "aguardando_peca_fim", "horas_aguardando_peca", "data_criacao"
             FROM "aguardando_peca_log"
             WHERE "id_ordem_servico" = $1
             ORDER BY "data_criacao" ASC`,
            [idOrdemServico]
        );

        // Converte resultado da query para o formato esperado
        const logsFormatted = logs.map((log: any) => ({
            idLog: log.idLog,
            aguardandoPecaInicio: log.aguardando_peca_inicio,
            aguardandoPecaFim: log.aguardando_peca_fim,
            horasAguardandoPeca: log.horas_aguardando_peca ? Number(log.horas_aguardando_peca) : null,
            dataCriacao: log.data_criacao
        }));

        // Calcula total de horas (apenas logs finalizados)
        const totalHorasAguardando = logsFormatted.reduce((sum: number, log: any) => {
            return sum + (log.horasAguardandoPeca || 0);
        }, 0);

        return {
            idOrdemServico,
            totalHorasAguardando: Number(totalHorasAguardando.toFixed(2)),
            logs: logsFormatted
        };
    }

    //DELETE
    public async deleteOrdemServico(idOrdemServico: string): Promise<void> {
        const ordemServico = await this.findById(idOrdemServico);
        await this.ordemServicoRepository.remove(ordemServico);
    };
}
