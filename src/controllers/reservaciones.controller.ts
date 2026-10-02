import type { Request, Response } from "express";
import * as reservacionesService from "../services/reservaciones.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
  createReservacionSchema,
  idParamsSchema,
  listReservacionesQuerySchema,
  updateReservacionSchema,
} from "../schemas/business.schema.js";

function parseQuery<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } }, query: unknown): T {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new AppError("Parámetros de consulta inválidos", 400);
  }

  return result.data as T;
}

export async function listReservaciones(req: Request, res: Response): Promise<void> {
  const query = parseQuery(listReservacionesQuerySchema, req.query);
  res.status(200).json({ reservaciones: await reservacionesService.listReservaciones(query) });
}

export async function getReservacion(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  res.status(200).json({ reservacion: await reservacionesService.getReservacion(id) });
}

export async function createReservacion(req: Request, res: Response): Promise<void> {
  const input = createReservacionSchema.parse(req.body);
  res.status(201).json({ reservacion: await reservacionesService.createReservacion(input) });
}

export async function updateReservacion(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateReservacionSchema.parse(req.body);
  res.status(200).json({ reservacion: await reservacionesService.updateReservacion(id, input) });
}

export async function cancelReservacion(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  res.status(200).json({ reservacion: await reservacionesService.cancelReservacion(id) });
}

export async function registrarLlegada(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  res.status(200).json({ reservacion: await reservacionesService.registrarLlegada(id) });
}
