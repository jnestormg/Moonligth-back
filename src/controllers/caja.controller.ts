import type { Request, Response } from "express";
import * as cajaService from "../services/caja.service.js";
import { createPagoSchema, idParamsSchema } from "../schemas/business.schema.js";

export async function getCajaResumen(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await cajaService.getCajaResumen());
}

export async function getCajaMovimientos(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ movimientos: await cajaService.getCajaMovimientos() });
}

export async function registrarPago(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = createPagoSchema.parse(req.body);
  res.status(201).json({ pago: await cajaService.registrarPago(id, input) });
}
