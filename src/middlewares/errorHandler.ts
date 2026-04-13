import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
            details: err.details
        });
    }

    if (err instanceof ZodError){
        return res.status(400).json({
            message: "Dados invalidos",
            details: err.flatten()
        });
    }
    console.error(err);
    return res.status(500).json({ message: "Erro Interno"});
}