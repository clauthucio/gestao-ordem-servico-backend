import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { enumPrioridade } from "../types/Prioridade";
import { enumStatus } from "../types/Status";
import { enumTipoManutencao } from "../types/TipoManutencao";
import { Usuarios } from "./usuarioEntity";
import { Equipamento } from "./equipamentoEntity";

@Entity("ordem_servico")
export class OrdemServico {
    constructor(dto?: any) {
        if (dto) {
            this.numeroOrdemServico = dto.numeroOrdemServico;
            this.idEquipamento = dto.idEquipamento;
            (this as any).idSolicitante = dto.idSolicitante;
            (this as any).idTecnico = dto.idTecnico;
            this.tipoManutencao = dto.tipoManutencao;
            this.prioridadeOrdemServico = dto.prioridadeOrdemServico;
            this.statusOrdemServico = dto.statusOrdemServico;
            this.descricaoFalha = dto.descricaoFalha;
            this.descricaoServico = dto.descricaoServico;
            this.pecasUtilizadas = dto.pecasUtilizadas;
            this.horasTrabalhadas = dto.horasTrabalhadas;
            this.inicioEm = dto.inicioEm;
            this.conclusaoEm = dto.conclusaoEm;
            this.aberturaEm = dto.aberturaEm;
        }
    }
    
    @PrimaryGeneratedColumn("uuid")
    idOrdemServico!: string;
    
    @ManyToOne(() => Usuarios)
    @JoinColumn({name: "id_usuario_tecnico", referencedColumnName: "idUsuario"})
    tecnico!: Usuarios;

    @ManyToOne(() => Usuarios)
    @JoinColumn({name: "id_usuario_solicitante", referencedColumnName: "idUsuario"})
    solicitante!: Usuarios;

    @ManyToOne(() => Equipamento)
    @JoinColumn({name: "id_equipamento", referencedColumnName: "id"})
    equipamento!: Equipamento;
    
    @Column({type:"varchar", unique:true, nullable:false, name: "numero_os"})
    numeroOrdemServico!: string;

    @Column({type:"varchar", nullable:false, name: "id_equipamento"})
    idEquipamento!: string;

    @Column({type:"enum", enum: enumTipoManutencao, nullable:false, name: "tipo_manutencao"})
    tipoManutencao!: enumTipoManutencao;
    
    @Column({type:"enum", enum: enumPrioridade, nullable:false, name: "prioridade"})
    prioridadeOrdemServico!: enumPrioridade;
    
    @Column({type:"enum", enum: enumStatus, nullable:false, name: "status"})
    statusOrdemServico!: enumStatus;

    @Column({type:"text", nullable:false, name: "descricao"})
    descricaoFalha!: string;

    @Column({type:"varchar", nullable:false, name: "id_usuario_tecnico"})
    idTecnico!: string;

    @Column({type:"varchar", nullable:true, name: "id_usuario_solicitante"})
    idSolicitante!: string;

    @Column({type:"timestamptz", default: () => "now()", nullable:false, name: "data_abertura"})
    aberturaEm!: Date;

    @Column({type:"timestamptz", nullable:true, name: "data_inicio"})
    inicioEm!: Date;

    @Column({type:"timestamptz", nullable:true, name: "data_conclusao"})
    conclusaoEm!: Date;

    @Column({type:"text", nullable:true, name: "descricao_servico"})
    descricaoServico!: string;

    @Column({type:"text", nullable:true, name: "pecas_utilizadas"})
    pecasUtilizadas!: string;

    @Column({type:"numeric", nullable:true, name: "horas_trabalhadas"})
    horasTrabalhadas!: number;

    @CreateDateColumn({type:"timestamptz", name: "data_criacao"})
    dataCriacao!: Date;

    @UpdateDateColumn({type:"timestamptz", name: "data_atualizacao"})
    dataAtualizacao!: Date;
}