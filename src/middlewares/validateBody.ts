import { AppError } from "../errors/AppError";
import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema): RequestHandler => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success){
            return next(new AppError ("Dados Inválidos", 400, result.error.flatten()));
        }

        req.body = result.data;
        return next();
    }
}