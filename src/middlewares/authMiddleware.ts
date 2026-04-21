import { AuthController } from './../controllers/authController';
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../errors/AppError";

// Adiciona propriedade "user" ao Request. Dessa forma é possível acessar req.user em qualquer lugar
declare global {
    namespace Express {
        interface Request {
            user?: {
                idUsuario: string;
                perfil: string;
            };
        }
    }
}

export const AuthenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
    ): void => {
    //Extrai o token do header ("Bearer eyJhbGciOiJIUzI1NiIs...")
    const AuthHeader = req.get("Authorization");

    if(!AuthHeader) {
        throw new AppError("Token não fornecido", 401);
    }

    const token = AuthHeader.replace("Bearer ", "");

    try {
        const payload =jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET!
        ) as JwtPayload;
        
        // Anexa dados ao request
        req.user = {
            idUsuario: payload.sub as string,
            perfil: payload.perfil as string,
        };
        //Passa para o próximo middleware
        next();
    } catch (erro) {
        throw new AppError("Token inválido ou expirado", 401);
    }
};

export const AuthorizeRoles = (allowedRoles: string[]) => {   //allowedRoles é uma lista tipo: ["ADMIN", "SOLICITANTE"]
    return (req: Request, res: Response, next: NextFunction): void => {

        // Passo 1- Verificar se usuário está na lista permitida
        if(!req.user){
            throw new AppError("Usuário não autenticado", 401);
        }

        // Passo 2: Verificar se perfil do usuário está na lista permitida
        if(!allowedRoles.includes(req.user.perfil)) {
            throw new AppError(
            `Acesso negado. Perfis permitidos: ${allowedRoles.join(", ")}`,
            403  // Forbidden 
        );
        }

        //Passo 03 - Liberar acesso
    next();
    };     
}