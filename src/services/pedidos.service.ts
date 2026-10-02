import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";

export async function listPedidos(query: { estado?: string }) {
  return prisma.pedidos.findMany({
    where: query.estado ? { estado: query.estado } : undefined,
    include: {
      reservaciones: { include: { clientes: true, salas: true } },
      items: true,
    },
    orderBy: { creado_en: "desc" },
  });
}

export async function getPedido(id: number) {
  const pedido = await prisma.pedidos.findUnique({
    where: { id: BigInt(id) },
    include: {
      reservaciones: { include: { clientes: true, salas: true } },
      items: true,
    },
  });

  if (!pedido) {
    throw new AppError("Pedido no encontrado", 404);
  }

  return pedido;
}

export async function updatePedidoEstado(id: number, estado: string) {
  const pedido = await prisma.pedidos.findUnique({ where: { id: BigInt(id) } });

  if (!pedido) {
    throw new AppError("Pedido no encontrado", 404);
  }

  return prisma.pedidos.update({
    where: { id: pedido.id },
    data: { estado },
    include: {
      reservaciones: { include: { clientes: true, salas: true } },
      items: true,
    },
  });
}
