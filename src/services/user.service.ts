import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { AuthenticatedUser } from "../types/auth.types.js";

export async function getUserById(id: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return user;
}
