import { DataSource, Repository, Between, MoreThanOrEqual, In, Not } from "typeorm";
import { appDataSource } from "../database/appDataSource";
import { OrdemServico } from "../entities/ordemServicoEntity";
import { enumPrioridade } from '../types/Prioridade';   
import { enumStatus } from '../types/Status';

export class DashboardService {
    private ordemRepository: Repository <OrdemServico>
    constructor(){
        this.ordemRepository = appDataSource.getRepository(OrdemServico);
    }

    //Retorna os 04 indicadores do dashboard
    public async getIndicadores(){
        const totalAbertasHoje = await this.obterTotalAbertasHoje();
        const emAndamento = await this.obterOSEmAndamento();
        const críticas = await this.obterOSCríticas();
        const tempoMédio = await this.obterTempoMédio();

        return {
            indicadores: {
                totalAbertasHoje,
                emAndamento,
                críticas,
                tempoMédio
            },
            ordemRecentes: []
        };
    }
    
    //Conta OS abertas no dia de hoje (aberturaEm entre 00:00 e 23:59)
     
    private async obterTotalAbertasHoje(): Promise<number> {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        const amanha = new Date (hoje);
        amanha.setDate(amanha.getDate()+1);
        
        return await this.ordemRepository.count({
            where:{
                aberturaEm: Between(hoje, amanha),
                statusOrdemServico: enumStatus.ABERTO
            }
        });
    }

    //Conta OS em status EM_ANDAMENTO (independente da data)
    private async obterOSEmAndamento(): Promise<number> {
        return await this.ordemRepository.count({
            where: {
                statusOrdemServico: enumStatus.EM_ANDAMENTO
            }
        });
    }

    //Conta OSs com prioridade ALTA que NÃO estão em estado final (CONCLUIDO/CANCELADO)
    //Estados bloqueados = ABERTO, EM_ANDAMENTO, AGUARDANDO_PECA

    private async obterOSCríticas(): Promise<number> {
        return await this.ordemRepository.count({
            where: {
                prioridadeOrdemServico: enumPrioridade.ALTA,
                statusOrdemServico: In([
                    enumStatus.ABERTO,
                    enumStatus.EM_ANDAMENTO,
                    enumStatus.AGUARDANDO_PECA
                ])
            }
        });
    }

    //Calcula tempo médio em horas para OS concluídas no dia de hoje
    private async obterTempoMédio(): Promise<number | string> {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // Busca OS concluídas hoje
        const osConcluidasHoje = await this.ordemRepository.find({
            where: {
                statusOrdemServico: enumStatus.CONCLUIDO,
                conclusaoEm: Between(hoje, amanha)
            }
        });

        if (osConcluidasHoje.length === 0) {
            return "Nenhuma OS concluída hoje";
        }

        // Calcula tempo total
        let tempoTotal = 0;
        for (const os of osConcluidasHoje) {
            if (os.horasTrabalhadas !== null && os.horasTrabalhadas !== undefined) {
                // Se horasTrabalhadas está preenchido, usa
                tempoTotal += os.horasTrabalhadas;
            } else if (os.inicioEm && os.conclusaoEm) {
                // Senão, calcula em horas (conclusaoEm - inicioEm) / 3600000 ms
                const diferencaMs = os.conclusaoEm.getTime() - os.inicioEm.getTime();
                const diferencaHoras = diferencaMs / (1000 * 60 * 60);
                tempoTotal += diferencaHoras;
            }
        }

        // Calcula média arredondada a 2 casas decimais
        const tempoMédio = parseFloat((tempoTotal / osConcluidasHoje.length).toFixed(2));
        return tempoMédio;
    }
}