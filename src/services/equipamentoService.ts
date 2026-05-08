import { appDataSource } from "../database/appDataSource";
import { AppError } from "../errors/AppError";
import { CreateEquipamentoDTO, UpdateEquipamentoDTO } from "../schemas/equipamentoSchema";
import { Equipamento } from "../entities/equipamentoEntity";
import { OrdemServico } from "../entities/ordemServicoEntity";
import { Usuarios } from "../entities/usuarioEntity";
import { enumStatus } from "../types/Status";
import { enumTipoEquipamento } from "../types/TipoEquipamento";
import { In, Repository } from "typeorm";

/** Resposta da listagem/detalhe com contagem de OS e nomes de usuário. */
export interface EquipamentoListItem {
    id: string;
    codigo: string;
    nome: string;
    tipo: enumTipoEquipamento;
    localizacao: string;
    fabricante: string | null;
    modelo: string | null;
    ativo: boolean;
    dataCriacao: Date;
    dataAtualizacao: Date;
    ordensAbertasCount: number;
    nomeUsuarioCriacao: string | null;
    nomeUsuarioUltimaModificacao: string | null;
    idUsuarioCriacao: string | null;
    idUsuarioUltimaModificacao: string | null;
}

export class EquipamentoService {
    private equipamentoRepository: Repository<Equipamento>;
    private ordemRepository: Repository<OrdemServico>;
    private usuarioRepository: Repository<Usuarios>;

    constructor() {
        this.equipamentoRepository = appDataSource.getRepository(Equipamento);
        this.ordemRepository = appDataSource.getRepository(OrdemServico);
        this.usuarioRepository = appDataSource.getRepository(Usuarios);
    }

    private async findEntityById(id: string): Promise<Equipamento> {
        const equipamento = await this.equipamentoRepository.findOne({
            where: { id },
        });

        if (!equipamento) {
            throw new AppError("Equipamento não encontrado", 404);
        }

        return equipamento;
    }

    public async findById(id: string): Promise<EquipamentoListItem> {
        const equipamento = await this.findEntityById(id);
        return this.toListItem(equipamento);
    }

    public async findAll(): Promise<EquipamentoListItem[]> {
        const equipamentos = await this.equipamentoRepository.find({
            order: { nome: "ASC" },
        });

        return Promise.all(equipamentos.map((e) => this.toListItem(e)));
    }

    private async contarOrdensAbertas(idEquipamento: string): Promise<number> {
        return this.ordemRepository.count({
            where: {
                idEquipamento,
                statusOrdemServico: In([
                    enumStatus.ABERTO,
                    enumStatus.EM_ANDAMENTO,
                    enumStatus.AGUARDANDO_PECA,
                ]),
            },
        });
    }

    private async nomeUsuario(idUsuario: string | null | undefined): Promise<string | null> {
        if (!idUsuario) {
            return null;
        }
        const u = await this.usuarioRepository.findOne({
            where: { idUsuario },
        });
        return u?.nomeUsuario ?? null;
    }

    private async toListItem(e: Equipamento): Promise<EquipamentoListItem> {
        const [ordensAbertasCount, nomeUsuarioCriacao, nomeUsuarioUltimaModificacao] = await Promise.all([
            this.contarOrdensAbertas(e.id),
            this.nomeUsuario(e.idUsuarioCriacao ?? undefined),
            this.nomeUsuario(e.idUsuarioUltimaModificacao ?? undefined),
        ]);

        return {
            id: e.id,
            codigo: e.codigo,
            nome: e.nome,
            tipo: e.tipo,
            localizacao: e.localizacao,
            fabricante: e.fabricante ?? null,
            modelo: e.modelo ?? null,
            ativo: e.ativo,
            dataCriacao: e.dataCriacao,
            dataAtualizacao: e.dataAtualizacao,
            ordensAbertasCount,
            nomeUsuarioCriacao,
            nomeUsuarioUltimaModificacao,
            idUsuarioCriacao: e.idUsuarioCriacao ?? null,
            idUsuarioUltimaModificacao: e.idUsuarioUltimaModificacao ?? null,
        };
    }

    public async CreateEquipamento(data: CreateEquipamentoDTO, idUsuario: string): Promise<EquipamentoListItem> {
        const equipamentoExistente = await this.equipamentoRepository.findOne({
            where: { codigo: data.codigo },
        });

        if (equipamentoExistente) {
            throw new AppError("Já existe um equipamento com esse código", 409);
        }

        const novoEquipamento = this.equipamentoRepository.create({
            ...data,
            idUsuarioCriacao: idUsuario,
            idUsuarioUltimaModificacao: idUsuario,
        });
        const equipamentoSalvo = await this.equipamentoRepository.save(novoEquipamento);

        return this.toListItem(equipamentoSalvo);
    }

    public async updateEquipamento(
        id: string,
        data: UpdateEquipamentoDTO,
        idUsuario: string
    ): Promise<EquipamentoListItem> {
        const equipamento = await this.findEntityById(id);

        if (data.codigo && data.codigo !== equipamento.codigo) {
            const codigoExistente = await this.equipamentoRepository.findOne({
                where: { codigo: data.codigo },
            });

            if (codigoExistente) {
                throw new AppError(`Já existe um equipamento com o código: ${data.codigo}`, 409);
            }
        }

        Object.assign(equipamento, data);
        equipamento.idUsuarioUltimaModificacao = idUsuario;
        const equipamentoSalvo = await this.equipamentoRepository.save(equipamento);

        return this.toListItem(equipamentoSalvo);
    }

    public async deleteEquipamento(id: string): Promise<void> {
        const equipamento = await this.findEntityById(id);
        await this.equipamentoRepository.remove(equipamento);
    }
}
