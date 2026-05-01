import { CreateOrdemServicoDTO, PatchOrdemServicoDTO, UpdateOrdemServicoDTO } from './../schemas/ordemServicoSchema';
import { appDataSource } from "../database/appDataSource";
import { AppError } from "../errors/AppError"
import { Repository, In } from "typeorm";
import { OrdemServico } from "../entities/ordemServicoEntity";
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
    private usuarioRepository: Repository<Usuarios>;
    private contadorOsRepository: Repository<ContadorOs>;

    constructor(){
        this.ordemServicoRepository = appDataSource.getRepository(OrdemServico);
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
        const numeroFormatado = contador.proximoNumero.toString().padStart(4, '0');
        
        return `OS-${dataFormatada}-${numeroFormatado}`;
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
        return await this.ordemServicoRepository.find({
            where,
            order: { aberturaEm: "DESC" },
        });
    }

    public async findById (idOrdemServico: string): Promise<OrdemServico> {
        const ordemServico = await this.ordemServicoRepository.findOne({
            where: { idOrdemServico}
        });
        if (!ordemServico){
            throw new AppError ("Ordem de Serviço não encontrada", 404);
        }
        return ordemServico;
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
        const ordemServico = await this.findById(idOrdemServico);

        if(data.numeroOrdemServico && data.numeroOrdemServico !== ordemServico.numeroOrdemServico){
            const numeroExistente = await this.ordemServicoRepository.findOne({
                where: { numeroOrdemServico: data.numeroOrdemServico }
            });

            if (numeroExistente){
                throw new AppError (`Já existe uma Ordem de Serviço com o número: ${data.numeroOrdemServico}`, 409);
            }
        }
        
        // Merge seletivo: apenas campos do payload (evita sobrescrever com undefined)
        Object.keys(data).forEach(key => {
            if ((data as any)[key] !== undefined) {
                (ordemServico as any)[key] = (data as any)[key];
            }
        });

        return await this.ordemServicoRepository.save(ordemServico);
    }

    //PATCH
    public async patchOrdemServico(idOrdemServico: string, data: PatchOrdemServicoDTO): Promise<OrdemServico> {
        const ordemServico = await this.findById(idOrdemServico);

        // PATCH precisa de ao menos um campo para atualizar.
        if (Object.keys(data).length === 0) {
            throw new AppError("Informe ao menos um campo para atualização parcial", 400);
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
                (!data.descricaoServico || data.horasTrabalhadas === undefined)
            ) {
                throw new AppError(
                    "Para concluir uma OS, informe descrição do serviço e horas trabalhadas",
                    400
                );
            }

            ordemServico.statusOrdemServico = nextStatus;
        }

        if (data.descricaoServico !== undefined) ordemServico.descricaoServico = data.descricaoServico;
        if (data.pecasUtilizadas !== undefined) ordemServico.pecasUtilizadas = data.pecasUtilizadas;
        if (data.horasTrabalhadas !== undefined) ordemServico.horasTrabalhadas = data.horasTrabalhadas;
        if (data.inicioEm !== undefined) ordemServico.inicioEm = data.inicioEm;
        if (data.conclusaoEm !== undefined) ordemServico.conclusaoEm = data.conclusaoEm;

        // Se entrar em andamento sem início informado, registra timestamp automático.
        if (data.statusOrdemServico === enumStatus.EM_ANDAMENTO && !ordemServico.inicioEm) {
            ordemServico.inicioEm = new Date();
        }

        // Se concluir sem conclusão informada, registra timestamp automático.
        if (data.statusOrdemServico === enumStatus.CONCLUIDO && !ordemServico.conclusaoEm) {
            ordemServico.conclusaoEm = new Date();
        }

        return await this.ordemServicoRepository.save(ordemServico);
    }

    //DELETE
    public async deleteOrdemServico(idOrdemServico: string): Promise<void> {
        const ordemServico = await this.findById(idOrdemServico);
        await this.ordemServicoRepository.remove(ordemServico);
    };
}
