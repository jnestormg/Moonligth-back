# Teo API

API REST de autenticación con JWT (Access Token + Refresh Token) construida con Node.js 22, TypeScript, Express 5, Prisma ORM y MySQL 8, ejecutándose en Docker.

---

## Stack

| Tecnología | Uso |
|---|---|
| Node.js 22 LTS | Runtime |
| TypeScript | Lenguaje |
| Express 5 | Framework HTTP |
| Prisma | ORM |
| MySQL 8 | Base de datos |
| Zod | Validación de entradas y variables de entorno |
| jsonwebtoken | Firma/verificación de Access Token |
| bcrypt | Hash de contraseñas |
| cookie-parser | Cookie httpOnly del Refresh Token |
| Docker / Docker Compose | Contenedores de la API y MySQL |

---

## Estructura

```text
project/
├── src/
│   ├── config/env.ts          # Variables de entorno validadas con Zod
│   ├── controllers/           # auth, users, salas, reservaciones, clientes, pedidos, caja, dashboard
│   ├── middlewares/           # auth (Bearer), validate (Zod), error (central), cors
│   ├── routes/                # auth, users + rutas de negocio
│   ├── schemas/               # auth.schema, user.schema, business.schema
│   ├── services/              # auth.service, user.service + servicios de negocio
│   ├── types/auth.types.ts    # Payloads JWT y tipos de usuario
│   ├── lib/prisma.ts          # Cliente Prisma (singleton)
│   ├── lib/serialize.ts       # BigInt/Decimal → number en JSON
│   ├── app.ts                 # Express: middlewares + rutas
│   └── server.ts              # Arranque y graceful shutdown
├── prisma/
│   ├── schema.prisma          # Modelos de auth y de negocio (salas, clientes, reservaciones, pagos, pedidos…)
│   ├── seed.ts                # Datos de ejemplo (npm run prisma:seed)
│   └── migrations/            # Migraciones
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── spec.md
```

---

## Requisitos

- Docker + Docker Compose
- Node.js 22 (solo para desarrollo local)

---

## Puesta en marcha

### 1. Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `PORT` | Puerto del contenedor | `3000` |
| `API_PORT` | Puerto publicado en el host | `3001` |
| `DATABASE_URL` | Conexión MySQL | `mysql://teo:teo_secret@localhost:3307/teo_db` |
| `JWT_ACCESS_SECRET` | Secreto del Access Token (mín. 32 chars) | — |
| `JWT_REFRESH_SECRET` | Secreto de respaldo (mín. 32 chars) | — |
| `ACCESS_TOKEN_TTL` | Duración del Access Token | `15m` |
| `REFRESH_TOKEN_TTL` | Duración del Refresh Token | `7d` |
| `COOKIE_SECURE` | `true` solo bajo HTTPS | `false` |
| `CORS_ORIGINS` | Lista separada por comas de orígenes permitidos | `http://localhost:4200` |

> Los secretos de ejemplo sirven para desarrollo. En producción genera valores aleatorios largos.

### 2. Levantar con Docker (recomendado)

```bash
docker compose up -d --build
```

- API: `http://localhost:3001`
- MySQL: `localhost:3307` (usuario `teo`, password `teo_secret`, DB `teo_db`)

Al arrancar, el contenedor ejecuta automáticamente `prisma migrate deploy` y luego inicia el servidor.

### 3. Desarrollo local

```bash
npm install
npm run prisma:generate
npm run prisma:migrate   # crea/aplica migraciones (usa el MySQL de compose en :3307)
npm run dev              # tsx watch en http://localhost:3000
```

### Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor en modo watch |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta `dist/src/server.js` |
| `npm run typecheck` | Verificación de tipos sin emitir |
| `npm run prisma:migrate` | Migración en desarrollo |
| `npm run prisma:deploy` | Aplica migraciones pendientes |

---

## Flujo de autenticación

1. **Register / Login** → la API devuelve el `accessToken` (JWT) en el cuerpo de la respuesta y guarda el `refreshToken` (token opaco aleatorio) en una cookie httpOnly con `path=/auth`.
2. **Peticiones autenticadas** → envía `Authorization: Bearer <accessToken>`.
3. **Refresh** → `POST /auth/refresh` con la cookie: devuelve un `accessToken` nuevo y rota el `refreshToken` (el anterior queda invalidado; reutilizarlo devuelve 401).
4. **Logout** → `POST /auth/logout` elimina el refresh token de la BD y borra la cookie.

El refresh token se almacena únicamente como hash SHA-256 en la tabla `refresh_tokens`.

---

## Endpoints

Base URL: `http://localhost:3001`

### `GET /health`

Comprobación de vida.

```bash
curl http://localhost:3001/health
```

```json
{ "status": "ok" }
```

---

### `POST /auth/register`

Registra un usuario y lo autentica.

**Body**

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | string | 2–80 caracteres |
| `email` | string | email válido, único |
| `password` | string | 8–72 caracteres |

```bash
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"name":"Teo","email":"teo@example.com","password":"secret123"}'
```

**Respuesta `201`**

```json
{
  "user": { "id": "uuid", "email": "teo@example.com", "name": "Teo" },
  "accessToken": "eyJhbGciOi..."
}
```

**Errores:** `400` validación · `409` email ya registrado.

---

### `POST /auth/login`

Inicia sesión.

```bash
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"email":"teo@example.com","password":"secret123"}'
```

**Respuesta `200`:** misma forma que `register` (`user` + `accessToken`).

**Errores:** `400` validación · `401` credenciales inválidas.

---

### `POST /auth/refresh`

Renueva el Access Token usando el Refresh Token de la cookie (`-b` envía la cookie, `-c` guarda la nueva).

```bash
curl -X POST http://localhost:3001/auth/refresh -b cookies.txt -c cookies.txt
```

**Respuesta `200`**

```json
{ "accessToken": "eyJhbGciOi..." }
```

**Errores:** `401` cookie ausente, refresh token inválido o expirado.

---

### `POST /auth/logout`

Cierra la sesión (revoca el refresh token y limpia la cookie).

```bash
curl -X POST http://localhost:3001/auth/logout -b cookies.txt -c cookies.txt
```

**Respuesta `200`**

```json
{ "message": "Sesión cerrada" }
```

---

### `GET /users/me`

Devuelve los datos del usuario autenticado. Requiere `Authorization: Bearer <accessToken>`.

```bash
curl http://localhost:3001/users/me -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Respuesta `200`**

```json
{
  "user": { "id": "uuid", "email": "teo@example.com", "name": "Teo" }
}
```

**Errores:** `401` sin token, token inválido o expirado · `404` usuario eliminado.

---

## Respuestas de error

Todas las fallas devuelven JSON con la forma `{ "message": string }`. Las de validación incluyen el detalle por campo:

```json
{
  "message": "Datos de entrada inválidos",
  "errors": [
    { "path": "email", "message": "Email inválido" }
  ]
}
```

| Código | Significado |
|---|---|
| `400` | Datos de entrada inválidos |
| `401` | No autenticado / token inválido |
| `404` | Recurso no encontrado |
| `409` | Conflicto (email duplicado) |
| `500` | Error interno |

---

## Ejemplo completo del flujo

```bash
BASE=http://localhost:3001
J=cookies.txt

# 1. Registro (guarda la cookie de refresh y la respuesta en res.json)
curl -s -c $J -X POST $BASE/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Teo","email":"teo@example.com","password":"secret123"}' \
  -o res.json

# 2. Consultar el usuario autenticado
AT=$(jq -r .accessToken res.json)
curl -s $BASE/users/me -H "Authorization: Bearer $AT"

# 3. Renovar el access token
curl -s -b $J -c $J -X POST $BASE/auth/refresh

# 4. Cerrar sesión
curl -s -b $J -c $J -X POST $BASE/auth/logout
```

---

## Endpoints de negocio (Moonlight)

Todos requieren `Authorization: Bearer <accessToken>`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dashboard/resumen` | KPIs del día, agenda, ocupación de salas y venta estimada |
| GET | `/salas`, `/salas/:id` | Directorio / detalle de sala |
| GET | `/reservaciones?fecha&estado&q` | Lista con filtros |
| POST | `/reservaciones` | Crea reservación (valida sala, capacidad y solapes; genera folio) |
| GET | `/reservaciones/:id` | Detalle con pagos, pedidos e historial |
| PATCH | `/reservaciones/:id` | Actualiza datos y recalcula costo |
| POST | `/reservaciones/:id/cancelar` | Cancela la reservación |
| POST | `/reservaciones/:id/llegada` | Marca `en-sala` |
| GET | `/clientes?q=`, `/clientes/:id` | Directorio / perfil de cliente con historial |
| GET | `/pedidos?estado=`, `/pedidos/:id` | Comandas / detalle |
| PATCH | `/pedidos/:id/estado` | `pendiente` → `preparando` → `listo` → `entregado` |
| GET | `/caja/resumen` | KPIs del turno (ingresos, anticipos, saldos) |
| GET | `/caja/movimientos` | Tabla de reservaciones con total/anticipo/saldo |
| POST | `/caja/reservaciones/:id/pagos` | Registra pago o anticipo |

### Seed

```bash
npm run prisma:seed
```

Crea el empleado demo `admin@moonlight.mx` / `secret123`, 8 salas, clientes, las reservaciones de ejemplo del turno y los pedidos mostrados en el prototipo.

---

## CORS y consumo desde frontend (Angular u otro SPA)

Por defecto la API está pensada para correr en `http://localhost:3001` y servir a un frontend en `http://localhost:4200`. Para habilitar CORS se usa la variable `CORS_ORIGINS` (lista separada por comas):

```bash
# .env (desarrollo)
CORS_ORIGINS=http://localhost:4200

# Producción (múltiples orígenes)
CORS_ORIGINS=https://app.example.com,https://staging.example.com
```

El middleware (`src/middlewares/cors.middleware.ts`) responde los preflight `OPTIONS` con:

- `Access-Control-Allow-Origin: <origen permitido>`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Max-Age: 86400`

> En producción `CORS_ORIGINS` es obligatorio: si la variable viene vacía el proceso falla al validar variables de entorno (no se cae a `localhost:4200`). Esto es intencional, evita exponer la API con credenciales a orígenes no listados.

### Cookie del refresh token

El refresh token viaja en una cookie `httpOnly`, `Path=/auth`, **`SameSite=Lax`**. Esto permite:

- Dev (`http://localhost:4200` → `http://localhost:3001`): mismo registrable domain (`localhost`), así que el navegador envía la cookie en cualquier request, incluido el `POST /auth/refresh` desde un interceptor HTTP.
- Prod con dominios distintos (`app.x.com` + `api.x.com`): son sitios diferentes; `SameSite=Lax` **bloquea** la cookie en sub‑requests cross-site iniciados desde JS. Soluciones:
  - Usar subdominios bajo el mismo dominio registrable (`app.example.com` + `api.example.com`) → mismo sitio, cookie viaja.
  - O servir SPA y API bajo el mismo origen con un reverse proxy (nginx/Caddy) que haga proxy de `/auth/*` y `/users/*` a la API. Sin CORS en absoluto.

### Verificación rápida

Preflight esperado:

```bash
curl -i -X OPTIONS http://localhost:3001/auth/login \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
# → 204, con Access-Control-Allow-Origin y Access-Control-Allow-Credentials
```

Login + cookie:

```bash
curl -i -X POST http://localhost:3001/auth/login \
  -H "Origin: http://localhost:4200" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"teo@example.com","password":"secret123"}'
# → Set-Cookie: refresh_token=...; Path=/auth; HttpOnly; SameSite=Lax
```

---

## Integración con Angular (guía rápida)

> Nota: la API de autenticación ahora usa la tabla `empleados` (nombre, correo, contraseña hasheada, rol) en lugar de `users`. El contrato REST se mantiene: `name/email/password` en register/login, y la respuesta `user` ahora incluye `rol`.

### 1. URL base

```ts
// src/environments/environment.ts
export const environment = {
  apiBaseUrl: 'http://localhost:3001'
};
```

### 2. Bootstrap HTTP con credenciales

```ts
// app.config.ts
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
};
```

### 3. Almacén del access token

Guárdalo en memoria (signal o servicio), nunca en `localStorage`:

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessToken = signal<string | null>(null);

  get token(): string | null {
    return this.accessToken();
  }

  setToken(token: string | null): void {
    this.accessToken.set(token);
  }

  refresh(): Observable<string> {
    return this.http
      .post<{ accessToken: string }>(
        `${environment.apiBaseUrl}/auth/refresh`,
        {},
        { withCredentials: true }   // necesario para enviar la cookie httpOnly
      )
      .pipe(map((res) => res.accessToken));
  }
}
```

### 4. Interceptor HTTP (esquema)

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const authReq = auth.token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (req.url.endsWith('/auth/refresh')) {
        auth.setToken(null);
        router.navigateByUrl('/login');
        return throwError(() => error);
      }

      // Llamada única de refresh; el resto espera
      return auth.refresh().pipe(
        switchMap((newToken) => {
          auth.setToken(newToken);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        })
      );
    })
  );
};
```

### 5. Login / register

```ts
this.http
  .post<{ user: User; accessToken: string }>(
    `${environment.apiBaseUrl}/auth/login`,
    { email, password },
    { withCredentials: true }
  )
  .subscribe(({ user, accessToken }) => {
    this.auth.setToken(accessToken);
  });
```

> Importante: cualquier llamada a `/auth/*` debe usar `withCredentials: true` para que el navegador la incluya en el flujo de la cookie. Centralízalo en un `AuthService` para no olvidarlo.
