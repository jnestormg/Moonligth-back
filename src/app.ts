import cookieParser from "cookie-parser";
import express from "express";
import { bigIntDecimalReplacer } from "./lib/serialize.js";
import { corsMiddleware } from "./middlewares/cors.middleware.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { authRoutes } from "./routes/auth.routes.js";
import { usersRoutes } from "./routes/users.routes.js";
import { salasRoutes } from "./routes/salas.routes.js";
import { reservacionesRoutes } from "./routes/reservaciones.routes.js";
import { clientesRoutes } from "./routes/clientes.routes.js";
import { pedidosRoutes } from "./routes/pedidos.routes.js";
import { cajaRoutes } from "./routes/caja.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";

export const app = express();

app.disable("x-powered-by");
app.set("json replacer", bigIntDecimalReplacer);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/salas", salasRoutes);
app.use("/reservaciones", reservacionesRoutes);
app.use("/clientes", clientesRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/caja", cajaRoutes);
app.use("/dashboard", dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
