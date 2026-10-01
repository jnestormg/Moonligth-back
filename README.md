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
│   ├── controllers/           # auth.controller.ts, users.controller.ts
│   ├── middlewares/           # auth (Bearer), validate (Zod), error (central)
│   ├── routes/                # auth.routes.ts, users.routes.ts
│   ├── schemas/               # Esquemas Zod de entrada
│   ├── services/              # auth.service.ts, user.service.ts
│   ├── types/auth.types.ts    # Payloads JWT y tipos de usuario
│   ├── lib/prisma.ts          # Cliente Prisma (singleton)
│   ├── app.ts                 # Express: middlewares + rutas
│   └── server.ts              # Arranque y graceful shutdown
├── prisma/
│   ├── schema.prisma          # Modelos User y RefreshToken
│   └── migrations/            # Migración inicial
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
