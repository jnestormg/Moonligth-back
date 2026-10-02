import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";

export async function listSalas() {
  return prisma.salas.findMany({ orderBy: { id: "asc" } });
}

export async function getSala(id: number) {
  const sala = await prisma.salas.findUnique({
    where: { id },
    include: {
      reservaciones: {
        where: {
          estado: { in: ["confirmada", "en-sala", "pendiente"] },
          inicio: { gte: new Date() },
        },
        include: { clientes: true },
        orderBy: { inicio: "asc" },
        take: 5,
      },
    },
  });

  if (!sala) {
    throw new AppError("Sala no encontrada", 404);
  }

  return sala;
}
