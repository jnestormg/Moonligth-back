import type { JwtPayload } from "jsonwebtoken";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  rol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
