import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { appDataSource } from "../database/appDataSource";

const authRoute = Router();
const authController = new AuthController(appDataSource);

authRoute.post("/auth/login", (req,res) => authController.login(req,res));
authRoute.post("/auth/refresh", (req,res) => authController.refresh(req,res));
authRoute.post("/auth/logout", (req,res) => authController.logout(req,res));

export { authRoute }