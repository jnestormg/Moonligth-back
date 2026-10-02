import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";

export async function listClientes(query: { q?: string }) {
  const clientes = await prisma.clientes.findMany({
    where: query.q
      ? {
          OR: [
            { nombre: { contains: query.q } },
            { telefono: { contains: query.q } },
            { correo: { contains: query.q } },
          ],
        }
      : undefined,
    include: {
      reservaciones: {
        include: { pagos: true },
        orderBy: { inicio: "desc" },
      },
    },
    orderBy: { id: "asc" },
  });

  return clientes.map((c) => {
    const vigentes = c.reservaciones.filter((r) => r.estado !== "cancelada");
    const totalGastado = c.reservaciones
      .flatMap((r) => r.pagos)
      .reduce((sum, p) => sum + Number(p.monto), 0);

    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      correo: c.correo,
      visitas: vigentes.length,
      ultimaVisita: vigentes[0]?.inicio ?? null,
      totalGastado,
    };
  });
}

export async function getCliente(id: number) {
  const cliente = await prisma.clientes.findUnique({
    where: { id },
    include: {
      reservaciones: {
        include: { salas: true, pagos: true },
        orderBy: { inicio: "desc" },
      },
    },
  });

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  const vigentes = cliente.reservaciones.filter((r) => r.estado !== "cancelada");
  const totalGastado = cliente.reservaciones
    .flatMap((r) => r.pagos)
    .reduce((sum, p) => sum + Number(p.monto), 0);

  return {
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    correo: cliente.correo,
    creado_en: cliente.creado_en,
    visitas: vigentes.length,
    totalGastado,
    historial: cliente.reservaciones,
  };
}
