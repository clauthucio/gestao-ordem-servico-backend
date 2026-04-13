import { UsuarioUpdateSchema, UsuarioCreateSchema } from './../schemas/usuarioSchema';
import { validateBody } from "../middlewares/validateBody";
import { UsuarioController } from './../controllers/usuarioController';
import { UsuarioService } from './../services/usuarioService';
import { Router } from "express";

const usuarioRoute = Router();

const usuarioService = new UsuarioService();
const usuarioController = new UsuarioController(usuarioService)

usuarioRoute.get("/app/usuarios", usuarioController.findAll.bind(usuarioController));
usuarioRoute.get("/app/usuarios/:id", usuarioController.findById.bind(usuarioController));
usuarioRoute.post("/app/usuarios", validateBody(UsuarioCreateSchema), usuarioController.create.bind(usuarioController));
usuarioRoute.put("/app/usuarios/:id", validateBody(UsuarioUpdateSchema), usuarioController.update.bind(usuarioController));
usuarioRoute.delete("/app/usuarios/:id",usuarioController.delete.bind(usuarioController));

export { usuarioRoute };

