import type { Request, Response } from "express";
import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";

const REFRESH_COOKIE = "refresh_token";
const REFRESH_COOKIE_MAX_AGE = authService.parseTtlToMs(env.REFRESH_TOKEN_TTL);

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/auth",
  });
}

function getRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[REFRESH_COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const { user, accessToken, refreshToken } = await authService.register(input);

  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const { user, accessToken, refreshToken } = await authService.login(input);

  setRefreshCookie(res, refreshToken);
  res.status(200).json({ user, accessToken });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = getRefreshCookie(req);

  if (!token) {
    res.status(401).json({ message: "Refresh token no proporcionado" });
    return;
  }

  const { accessToken, refreshToken } = await authService.refresh(token);

  setRefreshCookie(res, refreshToken);
  res.status(200).json({ accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(getRefreshCookie(req));

  clearRefreshCookie(res);
  res.status(200).json({ message: "Sesión cerrada" });
}
