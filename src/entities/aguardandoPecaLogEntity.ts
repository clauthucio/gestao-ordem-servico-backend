import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { OrdemServico } from "./ordemServicoEntity";

@Entity("aguardando_peca_log")
export class AguardandoPecaLog {
    @PrimaryGeneratedColumn("uuid")
    idLog!: string;

    @ManyToOne(() => OrdemServico, { onDelete: "CASCADE" })
    @JoinColumn({ name: "id_ordem_servico", referencedColumnName: "idOrdemServico" })
    ordemServico!: OrdemServico;

    @Column({ type: "timestamptz", nullable: false, name: "aguardando_peca_inicio" })
    aguardandoPecaInicio!: Date;

    @Column({ type: "timestamptz", nullable: true, name: "aguardando_peca_fim" })
    aguardandoPecaFim?: Date;

    @Column({ type: "numeric", nullable: true, name: "horas_aguardando_peca" })
    horasAguardandoPeca?: number;

    @CreateDateColumn({ type: "timestamptz", name: "data_criacao" })
    dataCriacao!: Date;
}
