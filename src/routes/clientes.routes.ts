import { Router } from "express";
import * as clientesController from "../controllers/clientes.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const clientesRoutes = Router();

clientesRoutes.get("/", requireAuth, clientesController.listClientes);
clientesRoutes.get("/:id", requireAuth, clientesController.getCliente);
