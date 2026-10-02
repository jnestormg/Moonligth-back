# REST API Specification

## 1. Descripción

Construir una API REST utilizando:

- Node.js 22 LTS
- TypeScript
- Express 5
- Prisma ORM
- MySQL 8
- Zod
- JWT
- bcrypt
- Docker
- Docker Compose

La API deberá contar inicialmente con un sistema de autenticación basado en JWT, utilizando Access Token y Refresh Token.

La aplicación deberá ejecutarse dentro de Docker y conectarse a una instancia MySQL también administrada mediante Docker Compose.

---

# 2. Objetivos

La primera versión deberá permitir:

- Registrar usuarios.
- Iniciar sesión.
- Generar un Access Token JWT.
- Generar un Refresh Token.
- Renovar el Access Token mediante el Refresh Token.
- Cerrar sesión.
- Consultar los datos del usuario autenticado.
- Validar entradas mediante Zod.
- Almacenar usuarios en MySQL utilizando Prisma.
- Ejecutar Express dentro de un contenedor Docker.
- Ejecutar MySQL dentro de Docker Compose.
- Ejecutar migraciones Prisma automáticamente al iniciar la API.

---

# 3. Stack tecnológico

| Tecnología | Uso |
|---|---|
| Node.js 22 LTS | Runtime |
| TypeScript | Lenguaje |
| Express 5 | Framework HTTP |
| Prisma | ORM |
| MySQL 8 | Base de datos |
| Zod | Validación |
| jsonwebtoken | JWT |
| bcrypt | Hash de contraseñas |
| cookie-parser | Manejo de cookies |
| Docker | Contenedor de la API |
| Docker Compose | API + MySQL |

---

# 4. Estructura del proyecto

```text
project/
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── users.controller.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── users.routes.ts
│   │
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   └── user.schema.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   │
│   ├── types/
│   │   └── auth.types.ts
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   └── schema.prisma
│
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── spec.md
