import { UsuarioUpdateSchema, UsuarioCreateSchema } from './../schemas/usuarioSchema';
import { UsuarioController } from './../controllers/usuarioController';
import { UsuarioService } from './../services/usuarioService';
import { validateBody } from "../middlewares/validateBody";
import { Request, Response } from 'express';
import { Router } from "express";
import { AuthenticateToken, AuthorizeRoles } from '../middlewares/authMiddleware';

const usuarioRoute = Router();
const usuarioService = new UsuarioService();
const usuarioController = new UsuarioController(usuarioService)

// GET - Listar usuários (Todos usuários autenticados podem)
usuarioRoute.get(
  "/app/usuarios",
  AuthenticateToken,
  AuthorizeRoles([
    "SOLICITANTE",
    "SUPERVISOR_DE_MANUTENCAO",
    "TECNICO",
    "ADMIN"
  ]),
  async (req: Request, res: Response) => {
    await usuarioController.findAll(req, res);
  }
);

// POST - Criar usuário (Apenas ADMIM)
usuarioRoute.post(
  "/app/usuarios",
  AuthenticateToken,
  validateBody(UsuarioCreateSchema),
  AuthorizeRoles(["ADMIN"]),
  async (req: Request, res: Response) => {
    await usuarioController.create(req, res);
  }
);


// PUT: Atualizar usuário (Apenas ADMIM ou próprio usuário)   
usuarioRoute.put(
  "/app/usuarios/:id",
  AuthenticateToken,
  validateBody(UsuarioUpdateSchema),
  AuthorizeRoles([
    "ADMIN"  
  ]),
  async (req: Request, res: Response) => {
    // Controller verifica se usuário está editando a si mesmo
    await usuarioController.update(req, res);
});

// DELETE: Deletar usuário (Apenas ADMIM)
usuarioRoute.delete(
  "/app/usuarios/:id",
  AuthenticateToken,
  AuthorizeRoles(["ADMIN"]),
  async (req: Request, res: Response) => {
    await usuarioController.delete(req, res);
});

export { usuarioRoute };





