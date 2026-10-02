import { Router } from "express";
import * as pedidosController from "../controllers/pedidos.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const pedidosRoutes = Router();

pedidosRoutes.get("/", requireAuth, pedidosController.listPedidos);
pedidosRoutes.get("/:id", requireAuth, pedidosController.getPedido);
pedidosRoutes.patch("/:id/estado", requireAuth, pedidosController.updatePedidoEstado);
