import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Usuarios } from "./usuarioEntity";

@Entity("sessao")
export class Sessao {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Usuarios, (usuario) => usuario.sessoes, {onDelete: "CASCADE"})
    @JoinColumn({name: "id_usuario", referencedColumnName: "idUsuario"})
    usuario!: Usuarios;

    @Column({ type: "text", nullable: false, name: "refresh_token_hash"})
    refreshTokenHash!: string;

    @Column({ type: "timestamptz", nullable: false, name: "expires_at"})
    expiresAt!: Date;

    @Column({ type: "timestamptz", nullable: true, name: "revoked_at"})
    revokedAt?: Date;

    @Column({type: "text", nullable: true, name: "ip"})
    ip?: string | null;

    @Column({ type: "text", nullable: true, name: "user_agent"})
    userAgent?: string | null;

    @CreateDateColumn({type: "timestamptz", name: "data_criacao"})
    createdAt!: Date;
}