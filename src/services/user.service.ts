import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { AuthenticatedUser } from "../types/auth.types.js";

export async function getUserById(id: number): Promise<AuthenticatedUser> {
  const user = await prisma.empleados.findUnique({
    where: { id },
    select: { id: true, correo: true, nombre: true, rol: true, activo: true },
  });

  if (!user || !user.activo) {
    throw new AppError("Empleado no encontrado", 404);
  }

  return { id: user.id, email: user.correo, name: user.nombre, rol: user.rol };
}
