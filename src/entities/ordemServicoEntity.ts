import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from "typeorm"
import { enumPrioridade } from "../types/Prioridade";
import { enumStatus } from "../types/Status";
import { enumTipoManutencao } from "../types/TipoManutencao";
import { Usuarios } from "./usuarioEntity";

@Entity("ordemServico")
export class OrdemServico {
    @PrimaryGeneratedColumn("uuid")
    idOrdemServico!: string;
    
    @ManyToOne(() => Usuarios)
    @JoinColumn({name: "idTecnico"})
    tecnico!: Usuarios;

    @ManyToOne(() => Usuarios)
    @JoinColumn({name: "idSolicitante"})
    solicitante!: Usuarios;
    
    @Column({type:"varchar", unique:true, nullable:false})
    numeroOrdemServico!: string;

    @Column({type:"varchar", nullable:false})
    idEquipamento!: string;

    @Column({type:"enum", enum: enumTipoManutencao, nullable:false})
    tipoManutencao!: enumTipoManutencao;
    
    @Column({type:"enum", enum: enumPrioridade, nullable:false})
    prioridadeOrdemServico!: enumPrioridade;
    
    @Column({type:"enum", enum: enumStatus, nullable:false})
    statusOrdemServico!: enumStatus;

    @Column({type:"text", nullable:false})
    descricaoFalha!: string;

    @Column({type:"varchar", nullable:true})
    idTecnico!: string;

    @Column({type:"timestamptz", default: () => "now()", nullable:false})
    aberturaEm!: Date;

    @Column({type:"timestamptz", nullable:true})
    inicioEm!: Date;

    @Column({type:"timestamptz", nullable:true})
    conclusaoEm!: Date;

    @Column({type:"text", nullable:true})
    descricaoServico!: string;

    @Column({type:"text", nullable:true})
    pecasUtilizadas!: string;

    @Column({type:"numeric", nullable:true})
    horasTrabalhadas!: number;
}