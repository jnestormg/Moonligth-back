import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const usersRoutes = Router();

usersRoutes.get("/me", requireAuth, usersController.getMe);
