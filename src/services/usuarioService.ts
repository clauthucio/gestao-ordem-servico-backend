import {Repository } from "typeorm";
import { hash, compare } from "bcryptjs";
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

export interface AlterarSenhaDTO {
    senhaAtual: string;
    senhaNova: string;
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

        // Bloqueia tentativas de alterar senha via PUT
        if (data.senhaUsuario || data.senhaHash) {
            throw new AppError(
                "Não é permitido alterar senha através deste endpoint. Use PATCH /app/usuarios/:id/senha",
                400
            );
        }

        if (data.emailUsuario && data.emailUsuario !== usuario.emailUsuario){
            const emailExistente = await this.usuarioRepository.findOne({
                where: { emailUsuario: data.emailUsuario},
            });
            if (emailExistente){
                throw new AppError("Já existe um usuário com esse e-mail",409);
            }
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

    //ALTERAR PRÓPRIA SENHA
    public async alterarPropriasSenha(idUsuario: string, data: AlterarSenhaDTO): Promise<Usuarios> {
        const usuario = await this.findById(idUsuario);

        // Valida se a senha atual está correta
        const senhaCorreta = await compare(data.senhaAtual, usuario.senhaHash);
        if (!senhaCorreta) {
            throw new AppError("Senha atual incorreta", 400);
        }

        // Atualiza para a nova senha
        usuario.senhaUsuario = data.senhaNova;
        usuario.senhaHash = await hash(data.senhaNova, 10);

        return this.usuarioRepository.save(usuario);
    }

    //DELETE
    public async deleteUsuario (idUsuario: string): Promise <void>{
        const usuario = await this.findById(idUsuario);
        await this.usuarioRepository.remove(usuario);
    }
}














































        
    
