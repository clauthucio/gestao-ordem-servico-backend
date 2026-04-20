import { Router, Request, Response } from "express";
import OrdemServicoController from "./../controllers/ordemServicoController";
import OrdemServicoService from "./../services/ordemServicoService";
import { OrdemServicoCreateSchema, OrdemServicoUpdateSchema } from "../schemas/ordemServicoSchema";
import { validateBody } from "../middlewares/validateBody";

const ordemServicoRoute = Router();
const ordemServicoService = new OrdemServicoService();
const ordemServicoController = new OrdemServicoController(ordemServicoService);

ordemServicoRoute.get("/app/os", async (req: Request, res: Response) => {
  await ordemServicoController.findAll(req, res);
});

ordemServicoRoute.get("/app/os/:id", async (req: Request, res: Response) => {
  await ordemServicoController.findById(req, res);
});

ordemServicoRoute.post("/app/os", validateBody(OrdemServicoCreateSchema), async (req: Request, res: Response) => {
  await ordemServicoController.create(req, res);
});

ordemServicoRoute.put("/app/os/:id", validateBody(OrdemServicoUpdateSchema), async (req: Request, res: Response) => {
  await ordemServicoController.update(req, res);
});

ordemServicoRoute.delete("/app/os/:id", async (req: Request, res: Response) => {
  await ordemServicoController.delete(req, res);
});

export { ordemServicoRoute };

