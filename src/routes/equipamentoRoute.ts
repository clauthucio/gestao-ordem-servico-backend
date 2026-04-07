import { Router, Request, Response } from "express";
import { EquipamentoService } from "../services/equipamentoService";
import { EquipamentoController } from "../controllers/equipamentoController";

const equipamentoRoute = Router();
const equipamentoService = new EquipamentoService();
const equipamentoController = new EquipamentoController(equipamentoService);

equipamentoRoute.get("/equipamentos", async (req: Request, res: Response) => {
  await equipamentoController.findAll(req, res);
});

equipamentoRoute.get("/equipamentos/:id", async (req: Request<{ id: string }>, res: Response) => {
  await equipamentoController.findById(req, res);
});

equipamentoRoute.post("/equipamentos", async (req: Request, res: Response) => {
  await equipamentoController.create(req, res);
});

equipamentoRoute.put("/equipamentos/:id", async (req: Request<{ id: string }>, res: Response) => {
  await equipamentoController.update(req, res);
});

equipamentoRoute.delete("/equipamentos/:id", async (req: Request<{ id: string }>, res: Response) => {
  await equipamentoController.delete(req, res);
});

export { equipamentoRoute };
