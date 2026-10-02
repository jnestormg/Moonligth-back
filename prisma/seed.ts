import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function atTime(hour: number, minute: number, dayOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const password = await bcrypt.hash("secret123", 10);

  const admin = await prisma.empleados.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: "Administrador Moonlight",
      correo: "admin@moonlight.mx",
      contrasena_hash: password,
      rol: "admin",
      activo: true,
    },
  });

  console.log(`Empleado admin: ${admin.correo} (id ${admin.id})`);

  const salasData = [
    { codigo: "Sala Luna", capacidad: 6, tamano: "mediana", tematica: "Lounge privado", precio_hora: 600, estado: "ocupada" },
    { codigo: "Sala Eclipse", capacidad: 8, tamano: "grande", tematica: "Escenario · Premium", precio_hora: 750, estado: "ocupada" },
    { codigo: "Sala Nova", capacidad: 4, tamano: "pequena", tematica: "Nova · Lounge", precio_hora: 500, estado: "reservada" },
    { codigo: "Sala Aurora", capacidad: 6, tamano: "mediana", tematica: "Aurora · Privada", precio_hora: 700, estado: "limpieza" },
    { codigo: "Sala Vega", capacidad: 10, tamano: "grande", tematica: "Vega · Lounge", precio_hora: 900, estado: "ocupada" },
    { codigo: "Sala Cosmos", capacidad: 14, tamano: "grande", tematica: "Cosmos · Gran formato", precio_hora: 1200, estado: "fuera_de_servicio" },
    { codigo: "Sala Órbita", capacidad: 8, tamano: "mediana", tematica: "Galaxia · Deluxe", precio_hora: 1300, estado: "ocupada" },
    { codigo: "Sala Cometa", capacidad: 6, tamano: "mediana", tematica: "Neón · Retro", precio_hora: 925, estado: "ocupada" },
  ];

  const salas = [];
  for (const s of salasData) {
    salas.push(
      await prisma.salas.upsert({
        where: { codigo: s.codigo },
        update: { estado: s.estado, precio_hora: s.precio_hora, capacidad: s.capacidad },
        create: s,
      }),
    );
  }
  const salaPorCodigo = Object.fromEntries(salas.map((s) => [s.codigo, s]));

  const clientesData = [
    { nombre: "Carlos Hernández", telefono: "246 123 4567", correo: "carlos@example.com" },
    { nombre: "Mariana López", telefono: "55 2401 7654", correo: "mariana@example.com" },
    { nombre: "Luis Martínez", telefono: "222 514 8032", correo: "luis@example.com" },
    { nombre: "Renata Flores", telefono: "55 8440 1926", correo: "renata@example.com" },
    { nombre: "Pedro Gómez", telefono: "246 601 3384", correo: "pedro@example.com" },
    { nombre: "Ana Sofía Ruiz", telefono: "55 0098 7643", correo: "ana@example.com" },
  ];

  const clientes = [];
  for (const c of clientesData) {
    const existente = await prisma.clientes.findFirst({ where: { telefono: c.telefono } });
    clientes.push(existente ?? (await prisma.clientes.create({ data: c })));
  }
  const clientePorNombre = Object.fromEntries(clientes.map((c) => [c.nombre, c]));

  const reservasData = [
    { folio: "ML-00125", cliente: "Carlos Hernández", sala: "Sala Luna", inicio: atTime(19, 0), horas: 2, asistentes: 6, estado: "confirmada", anticipo: 500 },
    { folio: "ML-00124", cliente: "Mariana López", sala: "Sala Eclipse", inicio: atTime(18, 30), horas: 3, asistentes: 8, estado: "en-sala", anticipo: 750 },
    { folio: "ML-00123", cliente: "Luis Martínez", sala: "Sala Nova", inicio: atTime(20, 30), horas: 2, asistentes: 4, estado: "pendiente", anticipo: 500 },
    { folio: "ML-00122", cliente: "Renata Flores", sala: "Sala Aurora", inicio: atTime(21, 0), horas: 2, asistentes: 5, estado: "confirmada", anticipo: 0 },
    { folio: "ML-00121", cliente: "Pedro Gómez", sala: "Sala Luna", inicio: atTime(17, 0), horas: 2, asistentes: 3, estado: "finalizada", anticipo: 1200 },
    { folio: "ML-00120", cliente: "Ana Sofía Ruiz", sala: "Sala Vega", inicio: atTime(22, 0), horas: 3, asistentes: 7, estado: "cancelada", anticipo: 0 },
  ];

  for (const r of reservasData) {
    const vigente = await prisma.reservaciones.findUnique({ where: { folio: r.folio } });

    if (vigente) {
      continue;
    }

    const sala = salaPorCodigo[r.sala];
    const cliente = clientePorNombre[r.cliente];
    const inicio = r.inicio;
    const fin = new Date(inicio.getTime() + r.horas * 3_600_000);
    const costo = Number(sala.precio_hora) * r.horas;

    const reservacion = await prisma.reservaciones.create({
      data: {
        folio: r.folio,
        cliente_id: cliente.id,
        sala_id: sala.id,
        inicio,
        fin,
        fin_bloqueo: fin,
        asistentes: r.asistentes,
        costo_total: costo,
        anticipo_requerido: 0,
        estado: r.estado,
        cancelada_en: r.estado === "cancelada" ? new Date() : null,
      },
    });

    await prisma.historial_reservaciones.create({
      data: {
        reservacion_id: reservacion.id,
        estado_anterior: null,
        estado_nuevo: r.estado,
        descripcion: "Reservación creada (seed)",
      },
    });

    if (r.anticipo > 0) {
      await prisma.pagos.create({
        data: {
          reservacion_id: reservacion.id,
          tipo: "anticipo",
          monto: r.anticipo,
          metodo: "efectivo",
          anticipo_unico: reservacion.id,
        },
      });
    }

    if (r.estado === "finalizada") {
      await prisma.pagos.create({
        data: { reservacion_id: reservacion.id, tipo: "pago", monto: costo - r.anticipo, metodo: "tarjeta" },
      });
    }
  }

  const luna = await prisma.reservaciones.findUnique({
    where: { folio: "ML-00125" },
  });
  const eclipse = await prisma.reservaciones.findUnique({ where: { folio: "ML-00124" } });
  const nova = await prisma.reservaciones.findUnique({ where: { folio: "ML-00123" } });
  const aurora = await prisma.reservaciones.findUnique({ where: { folio: "ML-00122" } });

  const pedidosData = [
    {
      reservacion: luna,
      estado: "preparando",
      nota: "Sin cebolla en una hamburguesa.",
      items: [
        { nombre: "Hamburguesa Moonlight", descripcion: "Carne, queso cheddar, cebolla caramelizada", cantidad: 2, precio: 280 },
        { nombre: "Nachos clásicos", descripcion: "Queso fundido, jalapeño, guacamole", cantidad: 1, precio: 120 },
        { nombre: "Refresco", descripcion: "355 ml · surtido", cantidad: 3, precio: 180 },
      ],
    },
    {
      reservacion: eclipse,
      estado: "pendiente",
      nota: null,
      items: [
        { nombre: "Tabla de quesos", descripcion: "Selección de quesos y frutos secos", cantidad: 1, precio: 320 },
        { nombre: "Limonada mineral", descripcion: "Jarra de 1 L", cantidad: 2, precio: 140 },
      ],
    },
    {
      reservacion: nova,
      estado: "listo",
      nota: null,
      items: [
        { nombre: "Papas trufadas", descripcion: "Papas fritas con trufa", cantidad: 1, precio: 160 },
        { nombre: "Agua mineral", descripcion: "Botella 500 ml", cantidad: 2, precio: 100 },
      ],
    },
    {
      reservacion: aurora,
      estado: "preparando",
      nota: null,
      items: [
        { nombre: "Alitas BBQ", descripcion: "Orden de 10 piezas", cantidad: 1, precio: 240 },
        { nombre: "Moonlight spritz", descripcion: "Cóctel de la casa", cantidad: 2, precio: 320 },
        { nombre: "Papas clásicas", descripcion: "Orden grande", cantidad: 1, precio: 120 },
      ],
    },
  ];

  for (const p of pedidosData) {
    if (!p.reservacion) continue;
    const existente = await prisma.pedidos.findFirst({ where: { reservacion_id: p.reservacion.id } });
    if (existente) continue;

    const total = p.items.reduce((sum, i) => sum + i.precio, 0);
    await prisma.pedidos.create({
      data: {
        reservacion_id: p.reservacion.id,
        estado: p.estado,
        total,
        nota_cocina: p.nota,
        items: { create: p.items },
      },
    });
  }

  console.log("Seed completado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
