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

    const userId = Number(payload.sub);

    if (!payload.sub || !Number.isInteger(userId)) {
      throw new AppError("Token de acceso inválido", 401);
    }

    req.user = await getUserById(userId);
    next();
  } catch (error) {
    next(error);
  }
};
