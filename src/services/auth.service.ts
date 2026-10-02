import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import type { AccessTokenPayload, AuthenticatedUser } from "../types/auth.types.js";

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_BYTES = 48;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) {
    throw new Error(`TTL inválido: ${ttl}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      return value * 24 * 60 * 60 * 1000;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function signAccessToken(user: AuthenticatedUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
}

async function issueTokens(user: AuthenticatedUser): Promise<TokenPair> {
  const accessToken = signAccessToken(user);
  const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + parseTtlToMs(env.REFRESH_TOKEN_TTL));

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

async function toAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return user;
}

export async function register(input: RegisterInput): Promise<TokenPair & { user: AuthenticatedUser }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new AppError("El email ya está registrado", 409);
  }

  const password = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password,
    },
    select: { id: true, email: true, name: true },
  });

  const tokens = await issueTokens(user);

  return { ...tokens, user };
}

export async function login(input: LoginInput): Promise<TokenPair & { user: AuthenticatedUser }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const valid = await bcrypt.compare(input.password, user.password);

  if (!valid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  const tokens = await issueTokens(authenticatedUser);

  return { ...tokens, user: authenticatedUser };
}

export async function refresh(rawToken: string): Promise<TokenPair> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!stored) {
    throw new AppError("Refresh token inválido", 401);
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
    throw new AppError("Refresh token expirado", 401);
  }

  const user = await toAuthenticatedUser(stored.userId);

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  return issueTokens(user);
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) {
    return;
  }

  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(rawToken) },
  });
}

export async function getMe(userId: string): Promise<AuthenticatedUser> {
  return toAuthenticatedUser(userId);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new AppError("Token de acceso inválido o expirado", 401);
  }
}
