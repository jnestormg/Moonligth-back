import cors from "cors";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";

export const corsMiddleware: RequestHandler = cors({
  origin: (origin, callback) => {
    if (!origin) {
      if (env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }
      callback(null, false);
      return;
    }

    if (env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
});