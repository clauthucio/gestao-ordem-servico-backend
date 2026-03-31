import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"
import {Tipo} from "../types/Tipo"

@Entity("equipamentos")
export class Equipamento {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type:"varchar", nullable:false, unique:true})
    codigo!: string;

    @Column({type:"varchar", nullable:false})
    nome!: string;

    @Column({type:"enum", enum: Tipo, nullable:false})
    tipo!: Tipo;

    @Column({type:"varchar", nullable:false})
    localizacao!: string;

    @Column({type:"varchar", nullable:true})
    fabricante!: string;

    @Column({type:"varchar", nullable:true})
    modelo!: string;

    @Column({type:"boolean", nullable:true})
    ativo!: boolean;

}