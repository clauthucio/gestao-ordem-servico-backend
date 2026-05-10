import type OrdemServicoService from "../services/ordemServicoService";
import type { Request, Response } from "express";
import { CreateOrdemServicoDTO } from "../schemas/ordemServicoSchema";
import { UpdateOrdemServicoDTO } from './../schemas/ordemServicoSchema';
import { PatchOrdemServicoDTO } from "../schemas/ordemServicoSchema";
import { enumStatus } from "../types/Status";
import { enumPrioridade } from "../types/Prioridade";

export default class OrdemServicoController {
    private ordemServicoService: OrdemServicoService;

    constructor(ordemServicoService: OrdemServicoService){
        this.ordemServicoService = ordemServicoService;
    }

    //GET
    public async findAll (req: Request, res: Response){
        // Lê filtros opcionais da query e repassa para o service aplicar AND.
        const status = req.query.status as enumStatus | undefined;
        const prioridade = req.query.prioridade as enumPrioridade | undefined;
        const OrdemServico = await this.ordemServicoService.findAll({ status, prioridade });
        return res.status(200).json(OrdemServico);
    }

    public async findById (req: Request, res: Response){
        const OrdemServico = await this.ordemServicoService.findById(req.params.id as string);
        return res.status(200).json(OrdemServico);
    }

    //CREATE
    public async create (req: Request, res: Response){
        const OrdemServico = await this.ordemServicoService.createOrdemServico(req.body as CreateOrdemServicoDTO);
        return res.status(201).json(OrdemServico);
    }

    //UPDATE
    public async update (req: Request, res: Response){
        const OrdemServico = await this.ordemServicoService.updateOrdemServico(
            req.params.id as string,
            req.body as UpdateOrdemServicoDTO
        );
        return res.status(200).json(OrdemServico);
    }

    //PATCH
    public async patch (req: Request, res: Response){
        try {
            console.log("[PATCH Controller] Iniciando patch com id:", req.params.id);
            console.log("[PATCH Controller] Body:", req.body);
            
            // Atualização parcial: status/atribuição sem substituir o payload completo da OS.
            const OrdemServico = await this.ordemServicoService.patchOrdemServico(
                req.params.id as string,
                req.body as PatchOrdemServicoDTO
            );
            console.log("[PATCH Controller] Patch concluído com sucesso");
            return res.status(200).json(OrdemServico);
        } catch (error) {
            console.error("[PATCH Controller] ERRO:", error);
            throw error;
        }
    }

    //GET Aguardo de Peça Log
    public async getAguardandoPecaLog (req: Request, res: Response){
        const log = await this.ordemServicoService.getAguardandoPecaLog(req.params.id as string);
        return res.status(200).json(log);
    }

    //DELETE
    public async delete (req: Request, res: Response){
        await this.ordemServicoService.deleteOrdemServico(req.params.id as string);
        return res.status(204).send();
    }
        
}