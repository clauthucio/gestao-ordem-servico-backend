import { z } from "zod";
import { enumPerfil } from "../types/Perfil";

export const UsuarioCreateSchema = z.object({
  nomeUsuario: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome não pode ter mais de 100 caracteres"),

  emailUsuario: z
    .email("E-mail inválido")
    .max(150, "E-mail não pode ter mais de 150 caracteres"),

  senhaUsuario: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha não pode ter mais de 100 caracteres"),

  perfilUsuario: z.nativeEnum(enumPerfil),

  statusUsuario: z.boolean().optional().default(true)
});

export type CreateUsuarioDTO = z.infer<typeof UsuarioCreateSchema>;

export const UsuarioUpdateSchema = UsuarioCreateSchema.partial();

export type UpdateUsuarioDTO = z.infer<typeof UsuarioUpdateSchema>;