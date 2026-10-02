import { prisma } from "../lib/prisma.js";
import { todayRange } from "./reservaciones.service.js";

export async function getDashboardResumen() {
  const { start, end } = todayRange();

  const [reservacionesHoy, salas, pedidosAbiertos] = await Promise.all([
    prisma.reservaciones.findMany({
      where: { inicio: { gte: start, lt: end }, estado: { not: "cancelada" } },
      include: { clientes: true, salas: true },
      orderBy: { inicio: "asc" },
    }),
    prisma.salas.findMany({ orderBy: { id: "asc" } }),
    prisma.pedidos.count({ where: { estado: { in: ["pendiente", "preparando"] } } }),
  ]);

  const ventaEstimada = reservacionesHoy.reduce((sum, r) => sum + Number(r.costo_total), 0);
  const salasOcupadas = salas.filter((s) => s.estado === "ocupada").length;

  const agenda = reservacionesHoy.map((r) => ({
    id: r.id,
    folio: r.folio,
    hora: r.inicio,
    sala: r.salas.codigo,
    cliente: r.clientes.nombre,
    asistentes: r.asistentes,
    estado: r.estado,
    total: Number(r.costo_total),
  }));

  const ocupacion = salas.map((s) => {
    const vigente = reservacionesHoy.find(
      (r) => r.sala_id === s.id && (r.estado === "en-sala" || r.estado === "confirmada"),
    );

    return {
      id: s.id,
      nombre: s.codigo,
      capacidad: s.capacidad,
      tarifa: Number(s.precio_hora),
      estado: s.estado,
      reservacionVigente: vigente
        ? {
            folio: vigente.folio,
            cliente: vigente.clientes.nombre,
            inicio: vigente.inicio,
            fin: vigente.fin,
            asistentes: vigente.asistentes,
          }
        : null,
    };
  });

  const ahora = new Date();
  const proxima = reservacionesHoy.find((r) => r.inicio.getTime() > ahora.getTime());

  return {
    fecha: start,
    reservacionesHoy: reservacionesHoy.length,
    salasOcupadas,
    totalSalas: salas.length,
    ventaEstimada,
    pedidosAbiertos,
    agenda,
    ocupacion,
    proximaLlegada: proxima
      ? { folio: proxima.folio, cliente: proxima.clientes.nombre, inicio: proxima.inicio }
      : null,
  };
}
