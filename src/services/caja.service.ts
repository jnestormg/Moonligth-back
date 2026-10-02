import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { CreatePagoInput } from "../schemas/business.schema.js";
import { todayRange } from "./reservaciones.service.js";

export async function getCajaResumen() {
  const { start, end } = todayRange();

  const pagosHoy = await prisma.pagos.findMany({
    where: { registrado_en: { gte: start, lt: end } },
  });

  const ingresosTurno = pagosHoy.reduce((sum, p) => sum + Number(p.monto), 0);
  const anticipos = pagosHoy
    .filter((p) => p.tipo === "anticipo")
    .reduce((sum, p) => sum + Number(p.monto), 0);

  const reservacionesHoy = await prisma.reservaciones.findMany({
    where: { inicio: { gte: start, lt: end }, estado: { not: "cancelada" } },
    include: { pagos: true },
  });

  let saldosPendientes = 0;
  let reservacionesPagadas = 0;
  let pagosPendientes = 0;

  for (const r of reservacionesHoy) {
    const pagado = r.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    const saldo = Number(r.costo_total) - pagado;

    if (saldo <= 0) {
      reservacionesPagadas += 1;
    } else {
      saldosPendientes += saldo;
      pagosPendientes += 1;
    }
  }

  return {
    ingresosTurno,
    anticipos,
    saldosPendientes,
    pagosPendientes,
    reservacionesPagadas,
    reservacionesHoy: reservacionesHoy.length,
  };
}

export async function getCajaMovimientos() {
  const { start, end } = todayRange();

  const reservaciones = await prisma.reservaciones.findMany({
    where: { inicio: { gte: start, lt: end } },
    include: { clientes: true, salas: true, pagos: true },
    orderBy: { inicio: "asc" },
  });

  return reservaciones.map((r) => {
    const pagado = r.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    const anticipo = r.pagos
      .filter((p) => p.tipo === "anticipo")
      .reduce((sum, p) => sum + Number(p.monto), 0);
    const saldo = Math.max(0, Number(r.costo_total) - pagado);

    return {
      id: r.id,
      folio: r.folio,
      cliente: r.clientes.nombre,
      sala: r.salas.codigo,
      total: Number(r.costo_total),
      anticipo,
      saldo,
      estadoPago: saldo <= 0 ? "pagado" : "pendiente",
      estado: r.estado,
    };
  });
}

export async function registrarPago(reservacionId: number, input: CreatePagoInput) {
  const reservacion = await prisma.reservaciones.findUnique({
    where: { id: BigInt(reservacionId) },
    include: { pagos: true },
  });

  if (!reservacion) {
    throw new AppError("Reservación no encontrada", 404);
  }

  if (reservacion.estado === "cancelada") {
    throw new AppError("No se pueden registrar pagos en una reservación cancelada", 409);
  }

  if (input.tipo === "anticipo") {
    const existente = reservacion.pagos.find((p) => p.tipo === "anticipo");

    if (existente) {
      throw new AppError("Ya existe un anticipo para esta reservación", 409);
    }
  }

  const pago = await prisma.pagos.create({
    data: {
      reservacion_id: reservacion.id,
      tipo: input.tipo,
      monto: input.monto,
      metodo: input.metodo,
      referencia: input.referencia,
      anticipo_unico: input.tipo === "anticipo" ? reservacion.id : null,
    },
  });

  return pago;
}
