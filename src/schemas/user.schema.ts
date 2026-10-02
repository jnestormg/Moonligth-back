import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.string().uuid("Id inválido"),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
