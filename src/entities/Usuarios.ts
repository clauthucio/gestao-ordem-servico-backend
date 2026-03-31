import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"
import {enumPerfil} from "../types/Perfil"

@Entity("usuarios")
export class Usuarios {
    @PrimaryGeneratedColumn("uuid")
    idUsuario!: string;

    @Column({type:"varchar", nullable:false})
    nome_Usuario!: string;

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