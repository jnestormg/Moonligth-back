import type { Request, Response } from "express";
import * as clientesService from "../services/clientes.service.js";
import { idParamsSchema } from "../schemas/business.schema.js";

export async function listClientes(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  res.status(200).json({ clientes: await clientesService.listClientes({ q }) });
}

export async function getCliente(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  res.status(200).json({ cliente: await clientesService.getCliente(id) });
}
