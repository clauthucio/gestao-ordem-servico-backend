import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { enumTipoEquipamento } from "../types/TipoEquipamento"

@Entity("equipamentos")
export class Equipamento {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type:"varchar", nullable:false, unique:true, name: "codigo"})
    codigo!: string;

    @Column({type:"varchar", nullable:false, name: "nome"})
    nome!: string;

    @Column({type:"enum", enum: enumTipoEquipamento, nullable:false, name: "tipo"})
    tipo!: enumTipoEquipamento;

    @Column({type:"varchar", nullable:false, name: "localizacao"})
    localizacao!: string;

    @Column({type:"varchar", nullable:true, name: "fabricante"})
    fabricante!: string;

    @Column({type:"varchar", nullable:true, name: "modelo"})
    modelo!: string;

    @Column({type:"boolean", nullable:true, default:true, name: "ativo"})
    ativo!: boolean;

    @CreateDateColumn({type:"timestamptz", name: "data_criacao"})
    dataCriacao!: Date;

    @UpdateDateColumn({type:"timestamptz", name: "data_atualizacao"})
    dataAtualizacao!: Date;
}