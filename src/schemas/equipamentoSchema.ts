import { z } from 'zod';
import { enumTipoEquipamento } from '../types/TipoEquipamento';

export const equipamentoCreateSchema = z.object({
    codigo: z
    .string()
    .min(1,"Código é obrigatório")
    .max(50,"Código não pode ter mais de 50 caracteres"),

    nome:z
    .string()
    .min(1,"Nome é obrigatório")
    .max(100, "Nome não pode ter mais que 100 caracteres"),

    tipo:z
    .nativeEnum(enumTipoEquipamento), //Tachado pois .nativeEnum() é a forma antiga do Zod para trabalhar com enums TypeScript.

    localizacao:z
    .string()
    .min(1,"Localização é obrigatória"),

    fabricante: z
    .string()
    .max(100,"Fabricante não pode ter mais de 100 caracteres")
    .optional(),

    modelo: z
    .string()
    .max(100,"Modelo não pode ter mais de 100 caracteres")
    .optional(),

    ativo: z
    .boolean()
    .default(true)
});

//Cria um tipo TypeScript automaticamente a partir do schema do Zod
export type CreateEquipamentoDTO = z.infer<typeof equipamentoCreateSchema>;

//Schema para ATUALIZAR equipamento (opcional)

//"Partial" transforma todos os campos em opcionais. Isso combina com atualização parcial, por exemplo enviar só nome e localizacao.
export const equipamentoUpdateSchema = equipamentoCreateSchema.partial();
export type UpdateEquipamentoDTO = z.infer<typeof equipamentoUpdateSchema>;