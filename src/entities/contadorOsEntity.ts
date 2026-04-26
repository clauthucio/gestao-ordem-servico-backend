import { Column, Entity, PrimaryColumn } from "typeorm";

//Tabela para rastreamento do sequencial diário de números de Ordem de Serviço.

 @Entity("contador_os")
 //Contador no no formato DATE (YYYY-MM-DD)

 export class ContadorOs {
    //Esta PK garante um único registro por dia
    @PrimaryColumn({ type: "date", name: "data" })
    data!: Date;

     //Próximo número sequencial a ser usado a cada novo OS criado
    @Column({ type: "integer", name: "proximo_numero", default: 1 })
    proximoNumero!: number;
}
