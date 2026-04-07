import { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { EquipamentoService } from "../services/equipamentoService";
import {
  equipamentoCreateSchema,
  equipamentoUpdateSchema,
} from "../schemas/equipamentoSchema";

export class EquipamentoController {
  constructor(private equipamentoService: EquipamentoService) {}

  async findAll(_req: Request, res: Response): Promise<void> {
    try {
      const equipamentos = await this.equipamentoService.findAll();
      res.status(200).json(equipamentos);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async findById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const equipamento = await this.equipamentoService.findById(id);
      res.status(200).json(equipamento);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = equipamentoCreateSchema.parse(req.body);
      const equipamento = await this.equipamentoService.create(data);
      res.status(201).json(equipamento);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = equipamentoUpdateSchema.parse(req.body);
      const equipamento = await this.equipamentoService.update(id, data);
      res.status(200).json(equipamento);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.equipamentoService.delete(id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      res.status(400).json({
        erro: "Dados inválidos",
        detalhes: error.issues,
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        erro: error.message,
        detalhes: error.details,
      });
      return;
    }

    console.error(error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      mensagem: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}