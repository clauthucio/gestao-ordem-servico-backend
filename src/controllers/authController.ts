import { errorHandler } from './../middlewares/errorHandler';
import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { DataSource } from "typeorm";
import { AppError } from "../errors/AppError";

interface LoginRequest {
    emailUsuario: string;
    senhaUsuario: string;
}

interface RefreshToken {
    refreshToken: string;
    }
    
    interface LogoutRequest {
    refreshToken: string;
}

export class AuthController {
    private authService: AuthService;

    constructor (dataSource: DataSource) {
        this.authService = new AuthService(dataSource);
    }

    //LOGIN
    public async login(req: Request, res: Response): Promise<void> {
        
        // Com destruturação (forma moderna)
        const {emailUsuario, senhaUsuario } = req.body as LoginRequest;
        
        // Sem destruturação (forma antiga)
        //const body = req.body;
        //const emailUsuario = body.emailUsuario;
        //const senhaUsuario = body.senhaUsuario;
            
        //Validação básica, em produção, usar Zod validar completamente
        if (!emailUsuario || !senhaUsuario){
            throw new AppError("Email e senha são obrigatórios", 400);
        }

        const resultado = await this.authService.login(
            emailUsuario,
            senhaUsuario,
            {
                ip: req.ip,
                userAgent: req. get("user-agent"),
            }
            );
        res.status(200).json({
            mensagem: "Login realizado com sucesso",
            dados: resultado, // Contém: accessToken, refreshToken, usuario
            });
    };

    public async refresh(req: Request, res: Response): Promise<void> {
        //Extrai token do body
        const { refreshToken } = req.body as RefreshToken;

        if(!refreshToken) {
           throw new AppError("Refresh token é obrigatório", 400); 
        }

        const resultado = await this.authService.refresh(refreshToken);
        res.status(200).json({
            mensagem: "Token renovado com sucesso",
            dados: resultado,
        });
    };

    public async logout(req: Request, res: Response): Promise<void> {
        const { refreshToken } = req.body as LogoutRequest;

        if (!refreshToken) {
            throw new AppError("Refresh token é obrigatório", 400);
        }
        await this.authService.logout(refreshToken);
        res.status(200).json({
            mensagem: "Logout realizado com sucesso",
        });

    }
}