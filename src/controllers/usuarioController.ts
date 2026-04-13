import {Request, Response} from "express"
import{ UsuarioService, CreateUsuarioDTO,UpdateUsuarioDTO} from './../services/usuarioService';

export class UsuarioController {
    private usuarioService: UsuarioService;

    constructor (usuarioService: UsuarioService) {
        this.usuarioService = usuarioService;
    }

    //GET
    public async findAll(req: Request, res: Response){
        const usuarios = await this.usuarioService.findAll();
        res.status(200).json(usuarios);
    }

    public async findById(req: Request, res: Response){
        const {id} = req.params
            const usuario = await this.usuarioService.findById(id as string);
            res.status(200).json(usuario)
    }

    //CREATE
    public async create(req: Request, res: Response){
        const usuario = await this.usuarioService.createUsuario(req.body);
        res.status(201).json(usuario);
    }

    //UPDATE
    public async update (req: Request,res: Response){
        const{ id } = req.params;
        const usuario = await this.usuarioService.updateUsuario(id as string, req.body);
        res.status(200).json(usuario);
    }

    //DELETE
    public async delete (req: Request, res: Response){
        const { id } = req.params;
        await this.usuarioService.deleteUsuario(id as string);
        res.status(204).send();
    }
}