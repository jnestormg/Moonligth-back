import { Router } from "express";
import * as salasController from "../controllers/salas.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const salasRoutes = Router();

salasRoutes.get("/", requireAuth, salasController.listSalas);
salasRoutes.get("/:id", requireAuth, salasController.getSala);
