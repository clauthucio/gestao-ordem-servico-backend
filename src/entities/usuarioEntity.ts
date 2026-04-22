import { Column, Entity, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { enumPerfil } from "../types/Perfil"
import { Sessao } from "./sessaoEntity";

@Entity("usuarios")
export class Usuarios {
    @PrimaryGeneratedColumn("uuid")
    idUsuario!: string;
    
    @OneToMany(() => Sessao, (sessao) => sessao.usuario)
    sessoes!: Sessao[];

    @Column({type:"varchar", nullable:false, name: "nome"})
    nomeUsuario!: string;

    @Column({type:"varchar", unique:true, nullable:false, name: "email"})
    emailUsuario!: string;

    @Column({type:"varchar", nullable:false, name: "senha"})
    senhaUsuario!: string;

    @Column({type:"varchar", nullable:false, name: "senha_hash"})
    senhaHash!: string;

    @Column({type:"enum", enum: enumPerfil, nullable:false, name: "perfil"})
    perfilUsuario!: enumPerfil;

    @Column({type:"boolean", default:true, name: "status"})
    statusUsuario!: boolean;

    @CreateDateColumn({type:"timestamptz", name: "data_criacao"})
    dataCriacao!: Date;

    @UpdateDateColumn({type:"timestamptz", name: "data_atualizacao"})
    dataAtualizacao!: Date;
}