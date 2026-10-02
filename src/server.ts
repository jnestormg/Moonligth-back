import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main(): Promise<void> {
  await prisma.$connect();

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`API escuchando en http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} recibido, cerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch(async (error) => {
  console.error("No se pudo iniciar la API:", error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
