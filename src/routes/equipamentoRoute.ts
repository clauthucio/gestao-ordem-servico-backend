import { Router, Request, Response } from "express";
import { EquipamentoService } from "../services/equipamentoService";
import { EquipamentoController } from "../controllers/equipamentoController";
import { AuthenticateToken, AuthorizeRoles } from "../middlewares/authMiddleware";
import { validateBody } from "../middlewares/validateBody";
import { EquipamentoCreateSchema, EquipamentoUpdateSchema } from "../schemas/equipamentoSchema";

const equipamentoRoute = Router();
const equipamentoService = new EquipamentoService();
const equipamentoController = new EquipamentoController(equipamentoService);

// GET: Lista todos equipamentos (Todos autenticados - leitura)
equipamentoRoute.get(
  "/app/equipamentos",
  AuthenticateToken,
  AuthorizeRoles(["ADMIN", "TECNICO", "SUPERVISOR_DE_MANUTENCAO", "SOLICITANTE"]),
  async (req: Request, res: Response) => {
    await equipamentoController.findAll(req, res);
  }
);

// GET: Retorna equipamentos por ID (Todos autenticados - leitura)
equipamentoRoute.get(
  "/app/equipamentos/:id",
  AuthenticateToken,
  AuthorizeRoles(["ADMIN", "TECNICO", "SUPERVISOR_DE_MANUTENCAO", "SOLICITANTE"]),
  async (req: Request<{ id: string }>, res: Response) => {
    await equipamentoController.findById(req, res);
  }
);

// POST: Cadastra equipamentos (ADMIN e SUPERVISOR)
equipamentoRoute.post(
  "/app/equipamentos",
  AuthenticateToken,
  validateBody(EquipamentoCreateSchema),
  AuthorizeRoles(["ADMIN", "SUPERVISOR_DE_MANUTENCAO"]),
  async (req: Request, res: Response) => {
    await equipamentoController.create(req, res);
  }
);

// PUT: Atualiza equipamentos (ADMIN e SUPERVISOR)
equipamentoRoute.put(
  "/app/equipamentos/:id",
  AuthenticateToken,
  validateBody(EquipamentoUpdateSchema),
  AuthorizeRoles(["ADMIN", "SUPERVISOR_DE_MANUTENCAO"]),
  async (req: Request<{ id: string }>, res: Response) => {
    await equipamentoController.update(req, res);
  }
);

// DELETE: Deleta equipamentos (ADMIN e SUPERVISOR)
equipamentoRoute.delete(
  "/app/equipamentos/:id",
  AuthenticateToken,
  AuthorizeRoles(["ADMIN", "SUPERVISOR_DE_MANUTENCAO"]),
  async (req: Request<{ id: string }>, res: Response) => {
    await equipamentoController.delete(req, res);
  }
);

export { equipamentoRoute };
