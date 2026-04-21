import { DashboardService } from "../services/dashboardService";
import { DashboardController } from "../controllers/dashboardController";
import { Router, Request, Response } from "express";
import { AuthenticateToken } from "../middlewares/authMiddleware";

const dashboardRoute = Router();
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

// GET: Retorna dados do dashboard (todos usuários autenticados)
dashboardRoute.get(
  "/app/dashboard",
  AuthenticateToken,
  async (req: Request, res: Response) => {
    await dashboardController.getDashboard(req, res);
  }
);

export { dashboardRoute };