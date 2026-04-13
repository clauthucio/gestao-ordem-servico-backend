import OrdemServicoController from './../controllers/ordemServicoController';
import OrdemServicoService from './../services/ordemServicoService';
import { OrdemServicoCreateSchema, OrdemServicoUpdateSchema } from '../schemas/ordemServicoSchema';
import { validateBody } from "../middlewares/validateBody";
import { Router } from "express";

const ordemServicoRoute = Router();

const ordemServicoService = new OrdemServicoService();
const ordemServicoController = new OrdemServicoController(ordemServicoService)

ordemServicoRoute.get("/app/os", ordemServicoController.findAll.bind(ordemServicoController));
ordemServicoRoute.get("/app/os/:id", ordemServicoController.findById.bind(ordemServicoController));
ordemServicoRoute.post("/app/os", validateBody(OrdemServicoCreateSchema), ordemServicoController.createOrdemServico.bind(ordemServicoController));
ordemServicoRoute.put("/app/os/:id", validateBody(OrdemServicoUpdateSchema), ordemServicoController.updateOrdemServico.bind(ordemServicoController));
ordemServicoRoute.delete("/app/os/:id",ordemServicoController.deleteOrdemServico.bind(ordemServicoController));

export { ordemServicoRoute };

