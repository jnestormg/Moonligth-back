import { Router } from "express";
import * as cajaController from "../controllers/caja.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPagoSchema } from "../schemas/business.schema.js";

export const cajaRoutes = Router();

cajaRoutes.get("/resumen", requireAuth, cajaController.getCajaResumen);
cajaRoutes.get("/movimientos", requireAuth, cajaController.getCajaMovimientos);
cajaRoutes.post("/reservaciones/:id/pagos", requireAuth, validate(createPagoSchema), cajaController.registrarPago);
