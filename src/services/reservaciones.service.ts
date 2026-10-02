import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { CreateReservacionInput, UpdateReservacionInput } from "../schemas/business.schema.js";

const ACTIVE_ESTADOS = ["pendiente", "confirmada", "en-sala"];

export function dayRange(fecha: string): { start: Date; end: Date } {
  const [y, m, d] = fecha.split("-").map(Number) as [number, number, number];
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { start, end };
}

export function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return { start, end };
}

function toDate(fecha: string, hora: string): Date {
  const [y, m, d] = fecha.split("-").map(Number) as [number, number, number];
  const [hh, mm] = hora.split(":").map(Number) as [number, number];
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export async function listReservaciones(query: { fecha?: string; estado?: string; q?: string }) {
  const where: Record<string, unknown> = {};

  if (query.fecha) {
    const { start, end } = dayRange(query.fecha);
    where.inicio = { gte: start, lt: end };
  }

  if (query.estado) {
    where.estado = query.estado;
  }

  if (query.q) {
    where.OR = [
      { folio: { contains: query.q } },
      { clientes: { nombre: { contains: query.q } } },
      { clientes: { telefono: { contains: query.q } } },
    ];
  }

  return prisma.reservaciones.findMany({
    where,
    include: { clientes: true, salas: true },
    orderBy: { inicio: "asc" },
  });
}

export async function getReservacion(id: number) {
  const reservacion = await prisma.reservaciones.findUnique({
    where: { id: BigInt(id) },
    include: {
      clientes: true,
      salas: true,
      pagos: { orderBy: { registrado_en: "asc" } },
      historial_reservaciones: {
        orderBy: { registrado_en: "desc" },
        take: 20,
      },
      pedidos: { include: { items: true } },
    },
  });

  if (!reservacion) {
    throw new AppError("Reservación no encontrada", 404);
  }

  return reservacion;
}

async function ensureCliente(input: { nombre: string; telefono: string; correo?: string }) {
  const existente = await prisma.clientes.findFirst({ where: { telefono: input.telefono } });

  if (existente) {
    return prisma.clientes.update({
      where: { id: existente.id },
      data: { nombre: input.nombre, correo: input.correo ?? existente.correo },
    });
  }

  return prisma.clientes.create({
    data: { nombre: input.nombre, telefono: input.telefono, correo: input.correo },
  });
}

async function assertSalaDisponible(salaId: number, inicio: Date, fin: Date, excludeId?: bigint) {
  const solape = await prisma.reservaciones.findFirst({
    where: {
      sala_id: salaId,
      estado: { in: ACTIVE_ESTADOS },
      id: excludeId ? { not: excludeId } : undefined,
      inicio: { lt: fin },
      fin: { gt: inicio },
    },
  });

  if (solape) {
    throw new AppError("La sala ya está reservada en ese horario", 409);
  }
}

export async function createReservacion(input: CreateReservacionInput) {
  const sala = await prisma.salas.findUnique({ where: { id: input.salaId } });

  if (!sala) {
    throw new AppError("Sala no encontrada", 404);
  }

  if (input.asistentes > sala.capacidad) {
    throw new AppError(`La sala tiene capacidad para ${sala.capacidad} personas`, 400);
  }

  const inicio = toDate(input.fecha, input.hora);
  const fin = new Date(inicio.getTime() + input.duracionHoras * 60 * 60 * 1000);

  await assertSalaDisponible(sala.id, inicio, fin);

  const cliente = await ensureCliente(input);
  const costoTotal = Number(sala.precio_hora) * input.duracionHoras;

  const reservacion = await prisma.reservaciones.create({
    data: {
      cliente_id: cliente.id,
      sala_id: sala.id,
      inicio,
      fin,
      fin_bloqueo: fin,
      asistentes: input.asistentes,
      costo_total: costoTotal,
      anticipo_requerido: 0,
      estado: "pendiente",
    },
  });

  const folio = `ML-${String(reservacion.id).padStart(5, "0")}`;

  await prisma.reservaciones.update({ where: { id: reservacion.id }, data: { folio } });

  await prisma.historial_reservaciones.create({
    data: {
      reservacion_id: reservacion.id,
      estado_anterior: null,
      estado_nuevo: "pendiente",
      descripcion: "Reservación creada",
    },
  });

  if (input.anticipo && input.anticipo > 0) {
    await prisma.pagos.create({
      data: {
        reservacion_id: reservacion.id,
        tipo: "anticipo",
        monto: input.anticipo,
        metodo: input.metodoAnticipo ?? "efectivo",
        anticipo_unico: reservacion.id,
      },
    });
  }

  return getReservacion(Number(reservacion.id));
}

export async function updateReservacion(id: number, input: UpdateReservacionInput) {
  const actual = await prisma.reservaciones.findUnique({
    where: { id: BigInt(id) },
    include: { clientes: true },
  });

  if (!actual) {
    throw new AppError("Reservación no encontrada", 404);
  }

  if (input.nombre || input.telefono || input.correo) {
    await prisma.clientes.update({
      where: { id: actual.cliente_id },
      data: {
        nombre: input.nombre ?? actual.clientes.nombre,
        telefono: input.telefono ?? actual.clientes.telefono,
        correo: input.correo ?? actual.clientes.correo,
      },
    });
  }

  const salaId = input.salaId ?? actual.sala_id;
  const sala = await prisma.salas.findUnique({ where: { id: salaId } });

  if (!sala) {
    throw new AppError("Sala no encontrada", 404);
  }

  const asistentes = input.asistentes ?? actual.asistentes;

  if (asistentes > sala.capacidad) {
    throw new AppError(`La sala tiene capacidad para ${sala.capacidad} personas`, 400);
  }

  const fechaActual = `${actual.inicio.getFullYear()}-${String(actual.inicio.getMonth() + 1).padStart(2, "0")}-${String(actual.inicio.getDate()).padStart(2, "0")}`;
  const horaActual = `${String(actual.inicio.getHours()).padStart(2, "0")}:${String(actual.inicio.getMinutes()).padStart(2, "0")}`;

  const inicio = input.fecha || input.hora
    ? toDate(input.fecha ?? fechaActual, input.hora ?? horaActual)
    : actual.inicio;

  const duracionHoras = input.duracionHoras
    ?? Math.max(1, Math.round((actual.fin.getTime() - actual.inicio.getTime()) / 3_600_000));

  const fin = new Date(inicio.getTime() + duracionHoras * 60 * 60 * 1000);

  if (input.fecha || input.hora || input.duracionHoras || input.salaId) {
    await assertSalaDisponible(salaId, inicio, fin, actual.id);
  }

  const estadoNuevo = input.estado ?? actual.estado;

  await prisma.reservaciones.update({
    where: { id: actual.id },
    data: {
      sala_id: salaId,
      inicio,
      fin,
      fin_bloqueo: fin,
      asistentes,
      costo_total: Number(sala.precio_hora) * duracionHoras,
      estado: estadoNuevo,
      cancelada_en: estadoNuevo === "cancelada" ? new Date() : actual.cancelada_en,
    },
  });

  if (input.estado && input.estado !== actual.estado) {
    await prisma.historial_reservaciones.create({
      data: {
        reservacion_id: actual.id,
        estado_anterior: actual.estado,
        estado_nuevo: input.estado,
        descripcion: "Estado actualizado",
      },
    });
  }

  return getReservacion(id);
}

export async function cancelReservacion(id: number) {
  const actual = await prisma.reservaciones.findUnique({ where: { id: BigInt(id) } });

  if (!actual) {
    throw new AppError("Reservación no encontrada", 404);
  }

  if (actual.estado === "cancelada") {
    throw new AppError("La reservación ya está cancelada", 409);
  }

  await prisma.reservaciones.update({
    where: { id: actual.id },
    data: { estado: "cancelada", cancelada_en: new Date() },
  });

  await prisma.historial_reservaciones.create({
    data: {
      reservacion_id: actual.id,
      estado_anterior: actual.estado,
      estado_nuevo: "cancelada",
      descripcion: "Reservación cancelada",
    },
  });

  return getReservacion(id);
}

export async function registrarLlegada(id: number) {
  const actual = await prisma.reservaciones.findUnique({ where: { id: BigInt(id) } });

  if (!actual) {
    throw new AppError("Reservación no encontrada", 404);
  }

  await prisma.reservaciones.update({
    where: { id: actual.id },
    data: { estado: "en-sala" },
  });

  await prisma.historial_reservaciones.create({
    data: {
      reservacion_id: actual.id,
      estado_anterior: actual.estado,
      estado_nuevo: "en-sala",
      descripcion: "Registro de llegada",
    },
  });

  return getReservacion(id);
}
