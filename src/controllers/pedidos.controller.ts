import type { Request, Response } from "express";
import * as pedidosService from "../services/pedidos.service.js";
import {
  idParamsSchema,
  listPedidosQuerySchema,
  updatePedidoEstadoSchema,
} from "../schemas/business.schema.js";

export async function listPedidos(req: Request, res: Response): Promise<void> {
  const query = listPedidosQuerySchema.parse(req.query);
  res.status(200).json({ pedidos: await pedidosService.listPedidos(query) });
}

export async function getPedido(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  res.status(200).json({ pedido: await pedidosService.getPedido(id) });
}

export async function updatePedidoEstado(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const { estado } = updatePedidoEstadoSchema.parse(req.body);
  res.status(200).json({ pedido: await pedidosService.updatePedidoEstado(id, estado) });
}
