import { DataSource, Repository, Between, MoreThanOrEqual } from "typeorm";
import { appDataSource } from "../database/appDataSource";
import { OrdemServico } from "../entities/ordemServicoEntity";
import { enumPrioridade } from '../types/Prioridade';   
import { enumStatus } from '../types/Status';

export class DashboardService {
    private ordemRepository: Repository <OrdemServico>
    constructor(){
        this.ordemRepository = appDataSource.getRepository(OrdemServico);
    }
    public async getIndicadores(){
        const totalAbertasHoje = await this.obterTotalAbertasHoje();
            return {
                indicadores: {totalAbertasHoje},ordemRecentes:[]
            };
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