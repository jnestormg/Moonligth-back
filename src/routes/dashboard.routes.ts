import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/resumen", requireAuth, dashboardController.getDashboardResumen);
