import { Router, Request, Response } from "express";
import OrdemServicoController from "./../controllers/ordemServicoController";
import OrdemServicoService from "./../services/ordemServicoService";
import { OrdemServicoCreateSchema, OrdemServicoUpdateSchema } from "../schemas/ordemServicoSchema";
import { validateBody } from "../middlewares/validateBody";
import { AuthenticateToken, AuthorizeRoles } from "../middlewares/authMiddleware";

const ordemServicoRoute = Router();
const ordemServicoService = new OrdemServicoService();
const ordemServicoController = new OrdemServicoController(ordemServicoService);

// GET: Lista todas as ordens de serviço (qualquer usuário autenticado - controller filtra por papel)
ordemServicoRoute.get(
  "/app/os",
  AuthenticateToken,
  async (req: Request, res: Response) => {
    await ordemServicoController.findAll(req, res);
  }
);

// GET: Retorna ordem de serviço por ID (qualquer usuário autenticado - controller filtra por papel)
ordemServicoRoute.get(
  "/app/os/:id",
  AuthenticateToken,
  async (req: Request, res: Response) => {
    await ordemServicoController.findById(req, res);
  }
);

// POST: Cadastra ordem de serviço (SOLICITANTE, SUPERVISOR_DE_MANUTENCAO, ADMIN)
ordemServicoRoute.post(
  "/app/os",
  AuthenticateToken,
  validateBody(OrdemServicoCreateSchema),
  AuthorizeRoles(["SOLICITANTE", "SUPERVISOR_DE_MANUTENCAO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.create(req, res);
  }
);

// PUT: Atualiza ordem de serviço (SUPERVISOR_DE_MANUTENCAO, TECNICO, ADMIN)
ordemServicoRoute.put(
  "/app/os/:id",
  AuthenticateToken,
  validateBody(OrdemServicoUpdateSchema),
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "TECNICO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.update(req, res);
  }
);

// DELETE: Deleta ordem de serviço (SUPERVISOR_DE_MANUTENCAO, ADMIN)
ordemServicoRoute.delete(
  "/app/os/:id",
  AuthenticateToken,
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.delete(req, res);
  }
);

export { ordemServicoRoute };

