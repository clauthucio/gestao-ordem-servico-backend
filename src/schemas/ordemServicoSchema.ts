import { enumTipoManutencao } from "../types/TipoManutencao";
import { enumPrioridade } from "../types/Prioridade";
import { enumStatus } from "../types/Status";
import { z } from "zod";

export const OrdemServicoCreateSchema = z.object({
  numeroOrdemServico: z
    .string()
    .min(1, "Número da ordem é obrigatória")
    .max(50, "Quantidade máxima de 50 caracteres atingido"),

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

export const OrdemServicoUpdateSchema = OrdemServicoCreateSchema.partial();

export type CreateOrdemServicoDTO = z.infer<typeof OrdemServicoCreateSchema>;
export type UpdateOrdemServicoDTO = z.infer<typeof OrdemServicoUpdateSchema>;