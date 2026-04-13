import {DashboardService} from "../services/dashboardService";
import {Request, Response} from "express";

export class DashboardController {

    constructor (private dashboardService: DashboardService) {}
    
    public async getDashboard (req: Request, res: Response) {
        const dados = await this.dashboardService.getIndicadores();
        res.status(200).json(dados);
    };
}
    