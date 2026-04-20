import type OrdemServicoService from "../services/ordemServicoService";
import type { Request, Response } from "express";
import { CreateOrdemServicoDTO } from "../schemas/ordemServicoSchema";
import { UpdateOrdemServicoDTO } from './../schemas/ordemServicoSchema';

export default class OrdemServicoController {
    private ordemServicoService: OrdemServicoService;

    constructor(ordemServicoService: OrdemServicoService){
        this.ordemServicoService = ordemServicoService;
    }

    //GET
    public async findAll (req: Request, res: Response){
        const OrdemServico = await this.ordemServicoService.findAll();
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

    //DELETE
    public async delete (req: Request, res: Response){
        await this.ordemServicoService.deleteOrdemServico(req.params.id as string);
        return res.status(204).send();
    }
        
}