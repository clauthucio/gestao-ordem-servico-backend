import { Router, Request, Response } from "express";
import OrdemServicoController from "./../controllers/ordemServicoController";
import OrdemServicoService from "./../services/ordemServicoService";
import {
  OrdemServicoCreateSchema,
  OrdemServicoPatchSchema,
  OrdemServicoUpdateSchema,
} from "../schemas/ordemServicoSchema";
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

// GET (alias): Lista todas as ordens de serviço (compatibilidade com contrato /app/ordens)
ordemServicoRoute.get(
  "/app/ordens",
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

// GET (alias): Retorna ordem de serviço por ID (compatibilidade com contrato /app/ordens)
ordemServicoRoute.get(
  "/app/ordens/:id",
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

// POST (alias): Cadastra ordem de serviço (compatibilidade com contrato /app/ordens)
ordemServicoRoute.post(
  "/app/ordens",
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

// PUT (alias): Atualiza ordem de serviço (compatibilidade com contrato /app/ordens)
ordemServicoRoute.put(
  "/app/ordens/:id",
  AuthenticateToken,
  validateBody(OrdemServicoUpdateSchema),
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "TECNICO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.update(req, res);
  }
);

// PATCH: Atualiza parcialmente ordem de serviço (status/atribuição) sem substituir o PUT
ordemServicoRoute.patch(
  "/app/os/:id",
  AuthenticateToken,
  validateBody(OrdemServicoPatchSchema),
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "TECNICO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.patch(req, res);
  }
);

// PATCH (alias): Atualiza parcialmente ordem de serviço (compatibilidade com contrato /app/ordens)
ordemServicoRoute.patch(
  "/app/ordens/:id",
  AuthenticateToken,
  validateBody(OrdemServicoPatchSchema),
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "TECNICO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.patch(req, res);
  }
);

// PATCH (alias): Fluxo de atualização rápida de status (rota compatível com /app/ordens/:id/atualizar)
ordemServicoRoute.patch(
  "/app/ordens/:id/atualizar",
  AuthenticateToken,
  validateBody(OrdemServicoPatchSchema),
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "TECNICO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.patch(req, res);
  }
);

// PATCH (alias): Mantém simetria com caminho legado em /app/os/:id/atualizar
ordemServicoRoute.patch(
  "/app/os/:id/atualizar",
  AuthenticateToken,
  validateBody(OrdemServicoPatchSchema),
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "TECNICO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.patch(req, res);
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

// DELETE (alias): Deleta ordem de serviço (compatibilidade com contrato /app/ordens)
ordemServicoRoute.delete(
  "/app/ordens/:id",
  AuthenticateToken,
  AuthorizeRoles(["SUPERVISOR_DE_MANUTENCAO", "ADMIN"]),
  async (req: Request, res: Response) => {
    await ordemServicoController.delete(req, res);
  }
);

export { ordemServicoRoute };

