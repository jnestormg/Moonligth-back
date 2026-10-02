import type { Request, Response } from "express";
import * as salasService from "../services/salas.service.js";
import { idParamsSchema } from "../schemas/business.schema.js";

export async function listSalas(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ salas: await salasService.listSalas() });
}

export async function getSala(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  res.status(200).json({ sala: await salasService.getSala(id) });
}
