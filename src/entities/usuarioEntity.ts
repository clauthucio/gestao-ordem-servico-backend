import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne} from "typeorm"
import { Equipamento } from "./equipamentoEntity";
import { enumPerfil} from "../types/Perfil"

@Entity("usuario")
export class Usuarios {
    @PrimaryGeneratedColumn("uuid")
    idUsuario!: string;
    
    @ManyToOne(() => Equipamento, { nullable: true })
    @JoinColumn({name: "idEquipamento"})
    equipamento?: Equipamento;

    @Column({type:"varchar", nullable:false})
    nomeUsuario!: string;

    @Column({type:"varchar", unique:true, nullable:false})
    emailUsuario!: string;

    @Column({type:"varchar", nullable:false})
    senhaUsuario!: string;

    @Column({type:"varchar", nullable:false})
    senhaHash!: string;

    @Column({type:"enum", enum: enumPerfil, nullable:true})
    perfilUsuario!: enumPerfil;

    @Column({type:"boolean", default:true})
    statusUsuario!: boolean;
}