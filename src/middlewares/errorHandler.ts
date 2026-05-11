import { AppError } from "../errors/AppError";
import { ZodError } from "zod";
import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error("[ERROR HANDLER] Erro capturado:", err);
    console.error("[ERROR HANDLER] Stack:", err?.stack);
    
    if (err instanceof AppError) {
        console.log("[ERROR HANDLER] AppError:", err.message);
        return res.status(err.statusCode).json({
            message: err.message,
            details: err.details
        });
    }

    if (err instanceof ZodError){
        console.log("[ERROR HANDLER] ZodError:", err.flatten());
        return res.status(400).json({
            message: "Dados invalidos",
            details: err.flatten()
        });
    }
    console.error("[ERROR HANDLER] Erro desconhecido:", err);
    
    // Retornar erro completo em desenvolvimento
    return res.status(500).json({ 
        message: "Erro Interno",
        error: err?.message || String(err),
        stack: err?.stack || "",
        type: err?.constructor?.name || "Unknown"
    });
}