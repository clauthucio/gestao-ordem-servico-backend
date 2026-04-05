import { DataSource, Repository, Between, MoreThanOrEqual } from "typeorm";
import { appDataSource } from "../database/appDataSource";
import { OrdemServico } from "../entities/OrdemServico";
import { enumPrioridade } from '../types/Prioridade';   
import { enumStatus } from '../types/Status';
import { AppError } from "../errors/AppError"; //ESTUDAR

export class DashboardService {
    private ordemRepository: Repository <OrdemServico>
    constructor(){
        this.ordemRepository = appDataSource.getRepository(OrdemServico);
    }
    async getIndicadores(){
        try{
            const totalAbertasHoje = await this.obterTotalAbertasHoje();
            return {
                indicadores: {
                    totalAbertasHoje
                 },
                 ordemRecentes:[]

                };

                }   catch (error){
                throw new Error(`Erro ao buscar indicadores: ${error}` )
            } 
        }
    private async obterTotalAbertasHoje(): Promise<number> {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        const amanha = new Date (hoje);
        amanha.setDate(amanha.getDate()+1);
        
        return await this.ordemRepository.count({
            where:{
                aberturaEm:Between(hoje,amanha),statusOrdemServico: enumStatus.ABERTO
            }
        });
    }
}