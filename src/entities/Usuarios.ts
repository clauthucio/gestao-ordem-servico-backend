import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"
import {Perfil} from "../types/Perfil"

@Entity("usuarios")
export class Usuarios {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type:"varchar", nullable:false})
    nomeUsuario!: string;

    @Column({type:"varchar", unique:true, nullable:false})
    emailUsuario!: string;

    @Column({type:"varchar", nullable:false})
    senhaUsuario!: string;

    @Column({type:"varchar", nullable:false})
    senhaHash!: string;

    @Column({type:"enum", enum: Perfil, nullable:true})
    perfilUsuario!: Perfil;

    @Column({type:"boolean", default:true})
    statusUsuario!: boolean;
}