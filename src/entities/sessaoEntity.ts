import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Usuarios } from "./usuarioEntity";

@Entity("sessao")
export class Sessao {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Usuarios, (usuario) => usuario.sessoes, {onDelete: "CASCADE"})
    usuario!: Usuarios;

    @Column({ type: "text", nullable: false})
    refreshTokenHash!: string;

    @Column({ type: "timestamptz", nullable: false})
    expiresAt!: Date;

    @Column({ type: "timestamptz", nullable: true})
    revokedAt?: Date;

    @Column({type: "text", nullable: true})
    ip?: string | null;

    @Column({ type: "text", nullable: true})
    userAgent?: string | null;

    @CreateDateColumn({type: "timestamptz" })
    createdAt!: Date;
}