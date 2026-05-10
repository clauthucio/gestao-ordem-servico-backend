import { enumPerfil } from "../types/Perfil";
import { z } from "zod";

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

export const UsuarioUpdateSchema = UsuarioCreateSchema.partial().omit({ senhaUsuario: true });

export type UpdateUsuarioDTO = z.infer<typeof UsuarioUpdateSchema>;

// Schema para alterar senha própria
export const AlterarSenhaSchema = z.object({
  senhaAtual: z
    .string()
    .min(6, "Senha atual deve ter no mínimo 6 caracteres")
    .max(100, "Senha atual não pode ter mais de 100 caracteres"),

  senhaNova: z
    .string()
    .min(6, "Nova senha deve ter no mínimo 6 caracteres")
    .max(100, "Nova senha não pode ter mais de 100 caracteres")
}).refine(
  (data) => data.senhaAtual !== data.senhaNova,
  {
    message: "Nova senha não pode ser igual à senha atual",
    path: ["senhaNova"]
  }
);

export type AlterarSenhaDTO = z.infer<typeof AlterarSenhaSchema>;