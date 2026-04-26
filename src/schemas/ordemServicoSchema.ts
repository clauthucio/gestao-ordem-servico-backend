import { enumTipoManutencao } from "../types/TipoManutencao";
import { enumPrioridade } from "../types/Prioridade";
import { enumStatus } from "../types/Status";
import { z } from "zod";

export const OrdemServicoCreateSchema = z.object({
  numeroOrdemServico: z
    .string()
    .min(1, "Número da ordem é obrigatória")
    .max(50, "Quantidade máxima de 50 caracteres atingido")
    .optional(), // Agora é opcional - será gerado automaticamente se não fornecido

  idEquipamento: z.string().uuid("O ID do Equipamento deve ser UUID válido"),
  idSolicitante: z.string().uuid("O ID do Solicitante deve ser UUID válido"),
  idTecnico: z.string().uuid("O ID do Técnico deve ser UUID valido").optional(),

  tipoManutencao: z.nativeEnum(enumTipoManutencao),
  prioridadeOrdemServico: z.nativeEnum(enumPrioridade),
  statusOrdemServico: z.nativeEnum(enumStatus),

  descricaoFalha: z
    .string()
    .min(1, "Descrição da falha é obrigatória")
    .max(2000, "Quantidade máxima de 2000 atingido"),

  descricaoServico: z.string().max(2000, "Quantidade máxima de 2000 caracteres atingido").optional(),
  pecasUtilizadas: z.string().max(2000,"Quantidade máxima de 2000 caracteres atingido").optional(),
  horasTrabalhadas: z.number().nonnegative().optional(),

  inicioEm: z.coerce.date().optional(),
  conclusaoEm: z.coerce.date().optional(),
  aberturaEm: z.coerce.date().optional()
});


// Valida PATCH que permite enviar apenas alguns campos, obriga descricaoServico + horasTrabalhadas ao mudar status para CONCLUIDO
export const OrdemServicoUpdateSchema = OrdemServicoCreateSchema.partial();

export const OrdemServicoPatchSchema = z
  .object({
    statusOrdemServico: z.nativeEnum(enumStatus).optional(),
    idTecnico: z.string().uuid("O ID do Técnico deve ser UUID valido").optional(),
    descricaoServico: z
      .string()
      .max(2000, "Quantidade máxima de 2000 caracteres atingido")
      .optional(),
    pecasUtilizadas: z
      .string()
      .max(2000, "Quantidade máxima de 2000 caracteres atingido")
      .optional(),
    horasTrabalhadas: z.number().nonnegative().optional(),
    inicioEm: z.coerce.date().optional(),
    conclusaoEm: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualização parcial",
  })
  .refine(
    (data) => {
      if (data.statusOrdemServico !== enumStatus.CONCLUIDO) return true;
      return Boolean(data.descricaoServico && data.horasTrabalhadas !== undefined);
    },
    {
      message: "Para concluir uma OS, informe descrição do serviço e horas trabalhadas",
      path: ["statusOrdemServico"],
    }
  );

export type CreateOrdemServicoDTO = z.infer<typeof OrdemServicoCreateSchema>;
export type UpdateOrdemServicoDTO = z.infer<typeof OrdemServicoUpdateSchema>;
export type PatchOrdemServicoDTO = z.infer<typeof OrdemServicoPatchSchema>;