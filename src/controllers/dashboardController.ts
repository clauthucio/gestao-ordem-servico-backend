import {Request, Response} from "express";
import {DashboardService} from "../services/dashboardService";

export class DashboardController {

    constructor (private dashboardService: DashboardService) {}
    
    async getDashboard (req: Request, res: Response){
        try {
            //Chama o service para buscar os dados
            const dados = await this.dashboardService.getIndicadores();

            //Retorna sucesso
            res.status(200).json(dados);

        } catch (error){
            //Tratamento de erro
            console.error(error);
            res.status(500).json({
                erro: "Erro ao buscar dasboard",
                mensagem: error instanceof Error ? error.message: "Erro desconhecido"
            }
            )
        }
    }
}