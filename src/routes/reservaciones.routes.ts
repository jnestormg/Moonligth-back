import { Router } from "express";
import * as reservacionesController from "../controllers/reservaciones.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createReservacionSchema, updateReservacionSchema } from "../schemas/business.schema.js";

export const reservacionesRoutes = Router();

reservacionesRoutes.get("/", requireAuth, reservacionesController.listReservaciones);
reservacionesRoutes.post("/", requireAuth, validate(createReservacionSchema), reservacionesController.createReservacion);
reservacionesRoutes.get("/:id", requireAuth, reservacionesController.getReservacion);
reservacionesRoutes.patch("/:id", requireAuth, validate(updateReservacionSchema), reservacionesController.updateReservacion);
reservacionesRoutes.post("/:id/cancelar", requireAuth, reservacionesController.cancelReservacion);
reservacionesRoutes.post("/:id/llegada", requireAuth, reservacionesController.registrarLlegada);
