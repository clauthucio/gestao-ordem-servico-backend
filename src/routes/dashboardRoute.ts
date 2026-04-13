import { DashboardService } from "../services/dashboardService";
import { DashboardController } from "../controllers/dashboardController";
import { Router, Request, Response } from "express";

const dashboardRoute = Router();
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

dashboardRoute.get("/app/dashboard", async (req: Request, res: Response) => {
    await dashboardController.getDashboard(req, res);
});

export { dashboardRoute };