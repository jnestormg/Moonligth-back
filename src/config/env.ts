import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerida"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET debe tener al menos 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET debe tener al menos 32 caracteres"),
  ACCESS_TOKEN_TTL: z
    .string()
    .regex(/^\d+[smhd]$/, "ACCESS_TOKEN_TTL debe ser un número seguido de s, m, h o d (ej: 15m)")
    .default("15m"),
  REFRESH_TOKEN_TTL: z
    .string()
    .regex(/^\d+[smhd]$/, "REFRESH_TOKEN_TTL debe ser un número seguido de s, m, h o d (ej: 7d)")
    .default("7d"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value, ctx) => {
      const isProduction = process.env.NODE_ENV === "production";
      const list = (value ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

      if (list.length === 0) {
        if (isProduction) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "CORS_ORIGINS es requerido en producción (lista separada por comas)",
          });
          return z.NEVER;
        }
        return ["http://localhost:4200"];
      }

      for (const origin of list) {
        try {
          new URL(origin);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `CORS_ORIGINS contiene un origen inválido: ${origin}`,
          });
          return z.NEVER;
        }
      }

      return list;
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Variables de entorno inválidas:\n${issues}`);
}

export const env = parsed.data;
