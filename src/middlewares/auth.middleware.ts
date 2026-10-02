import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "./error.middleware.js";
import { verifyAccessToken } from "../services/auth.service.js";
import { getUserById } from "../services/user.service.js";

export const requireAuth: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Token de acceso no proporcionado", 401);
    }

    const payload = verifyAccessToken(header.slice("Bearer ".length));

    if (!payload.sub) {
      throw new AppError("Token de acceso inválido", 401);
    }

    req.user = await getUserById(payload.sub);
    next();
  } catch (error) {
    next(error);
  }
};
