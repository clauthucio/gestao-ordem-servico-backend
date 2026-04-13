import {Repository } from "typeorm";
import { hash } from "bcryptjs";
import { appDataSource } from "../database/appDataSource";
import { AppError } from "../errors/AppError";
import { Usuarios } from "../entities/usuarioEntity";
import { enumPerfil } from "../types/Perfil";

export interface CreateUsuarioDTO {
    nomeUsuario: string;
    emailUsuario: string;
    senhaUsuario: string;
    senhaHash?: string;
    perfilUsuario:enumPerfil;
    statusUsuario: boolean;
}

// A "?" informa que o campo pode ou não existir
// A "? tira a obrigatoriedade de enviar update para os campos
export interface UpdateUsuarioDTO{
    nomeUsuario?: string;
    emailUsuario?: string;
    senhaUsuario?: string;
    senhaHash?: string;
    perfilUsuario?: enumPerfil;
    statusUsuario?: boolean;
}

export class UsuarioService {
    private usuarioRepository: Repository<Usuarios>;

    constructor(){
        this.usuarioRepository = appDataSource.getRepository(Usuarios);
    }

    public async findById(idUsuario: string): Promise<Usuarios>{
        const usuario = await this.usuarioRepository.findOne({
            where: {idUsuario},
        });

        if(!usuario){
            throw new AppError("Usuário não encontrado",404);
        }
        return usuario;
    }

    public async findAll(): Promise<Usuarios[]>{
        return this.usuarioRepository.find({
            order: {nomeUsuario: "ASC"},
        });
    }

    //CREATE
    public async createUsuario (data: CreateUsuarioDTO): Promise<Usuarios>{ 
        const usuarioExistente = await this.usuarioRepository.findOne({
            where: { emailUsuario: data.emailUsuario},
        });
        if (usuarioExistente){
            throw new AppError ("Já existe um usuário com esse e-mail", 409);
        }
        /* Os dois pontos de interrogação são o operador de coalescência nula, em TS e JS. Ele significa:
        -se o valor da esquerda não for null nem undefined, use ele
        -se for null ou undefined, use o valor da direita */
        const senhaHash = data.senhaHash ?? (await hash(data.senhaUsuario, 10));
        const novoUsuario = this.usuarioRepository.create({
            nomeUsuario: data.nomeUsuario,
            emailUsuario: data.emailUsuario,
            senhaUsuario: data.senhaUsuario,
            senhaHash,
            perfilUsuario: data.perfilUsuario,
            statusUsuario: data.statusUsuario ?? true,
        });
        return this.usuarioRepository.save(novoUsuario)
    }
    
    //UPDATE
    public async updateUsuario (idUsuario: string, data: UpdateUsuarioDTO) : Promise<Usuarios> {
        const usuario = await this.findById(idUsuario);

        if (data.emailUsuario && data.emailUsuario !== usuario.emailUsuario){
            const emailExistente = await this.usuarioRepository.findOne({
                where: { emailUsuario: data.emailUsuario},
            });
            if (emailExistente){
                throw new AppError("Já existe um usuário com esse e-mail",409);
            }
        }
        if (data.senhaUsuario){
            usuario.senhaUsuario = data.senhaUsuario;
            usuario.senhaHash = await hash(data.senhaUsuario,10)
        }
        if (data.nomeUsuario !== undefined){
            usuario.nomeUsuario = data.nomeUsuario;
        }
        if (data.emailUsuario !== undefined){
            usuario.emailUsuario = data.emailUsuario;
        }
        if (data.perfilUsuario !== undefined){
            usuario.perfilUsuario = data.perfilUsuario;
        }
        return this.usuarioRepository.save(usuario);
    }

    //DELETE
    public async deleteUsuario (idUsuario: string): Promise <void>{
        const usuario = await this.findById(idUsuario);
        await this.usuarioRepository.remove(usuario);
    }
}














































        
    
