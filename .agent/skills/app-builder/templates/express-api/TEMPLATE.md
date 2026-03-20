---
name: express-api
description: Express.js REST API template principles. TypeScript, Prisma, JWT.
---

# Express.js API Template

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL + Prisma |
| Validation | Zod |
| Auth | JWT + bcrypt |

---

## Directory Structure

```
project-name/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts           # Express setup
│   ├── config/          # Environment
│   ├── routes/          # Route handlers
│   ├── controllers/     # Business logic
│   ├── services/        # Data access
│   ├── middleware/
│   │   ├── auth.ts      # JWT verify
│   │   ├── error.ts     # Error handler
│   │   └── validate.ts  # Zod validation
│   ├── schemas/         # Zod schemas
│   └── utils/
└── package.json
```

---

## Middleware Stack

| Order | Middleware |
|-------|------------|
| 1 | helmet (security) |
| 2 | cors |
| 3 | morgan (logging) |
| 4 | body parsing |
| 5 | routes |
| 6 | error handler |

---

## API Response Format

| Type | Structure |
|------|-----------|
| Success | `{ success: true, data: {...} }` |
| Error | `{ error: "message", details: [...] }` |

---

## Setup Steps

1. Create project directory
2. `pnpm init -y`
3. Install deps: `pnpm install express prisma zod bcrypt jsonwebtoken`
4. Configure Prisma
5. `pnpm run db:push`
6. `pnpm run dev`

---

## Best Practices

- Layer architecture (routes → controllers → services)
- Validate all inputs with Zod
- Centralized error handling
- Environment-based config
- Use Prisma for type-safe DB access
