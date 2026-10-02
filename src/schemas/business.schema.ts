import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Id inválido").transform((v) => Number(v)),
});

export const listReservacionesQuerySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida").optional(),
  estado: z.string().max(30).optional(),
  q: z.string().trim().max(100).optional(),
});

export const createReservacionSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  telefono: z.string().trim().min(7).max(30),
  correo: z.string().trim().toLowerCase().email().max(255).optional(),
  salaId: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida"),
  duracionHoras: z.number().int().min(1).max(12),
  asistentes: z.number().int().min(1).max(50),
  anticipo: z.number().min(0).max(1_000_000).optional(),
  metodoAnticipo: z.enum(["efectivo", "tarjeta", "transferencia"]).optional(),
});

export const updateReservacionSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  telefono: z.string().trim().min(7).max(30).optional(),
  correo: z.string().trim().toLowerCase().email().max(255).optional(),
  salaId: z.number().int().positive().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  duracionHoras: z.number().int().min(1).max(12).optional(),
  asistentes: z.number().int().min(1).max(50).optional(),
  estado: z.enum(["pendiente", "confirmada", "en-sala", "finalizada", "cancelada"]).optional(),
});

export const createPagoSchema = z.object({
  tipo: z.enum(["anticipo", "pago"]).default("pago"),
  monto: z.number().positive("El monto debe ser mayor a 0").max(1_000_000),
  metodo: z.enum(["efectivo", "tarjeta", "transferencia"]),
  referencia: z.string().trim().max(100).optional(),
});

export const updatePedidoEstadoSchema = z.object({
  estado: z.enum(["pendiente", "preparando", "listo", "entregado"]),
});

export const listPedidosQuerySchema = z.object({
  estado: z.enum(["pendiente", "preparando", "listo", "entregado"]).optional(),
});

export type CreateReservacionInput = z.infer<typeof createReservacionSchema>;
export type UpdateReservacionInput = z.infer<typeof updateReservacionSchema>;
export type CreatePagoInput = z.infer<typeof createPagoSchema>;
