# Just Tap Super Admin Mobile API

Express.js + MySQL 8 backend for the **Mobile Super Admin** flow (Figma Frame 1261155661).

## Prerequisites

- **Option A — Docker (recommended):** Docker 24+ and Docker Compose v2
- **Option B — Native:** Node.js 20+, MySQL 8, Redis 7

## Quick start (Docker — full stack)

```bash
cp .env.example .env
# Edit JWT secrets in .env before production use

docker compose up -d --build
# API:     http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/docs
# Health:  http://localhost:3000/health
```

Default login after seed: `admin@justtap.com` / `admin123`

## Local setup (native Node + Docker for MySQL/Redis)

```bash
cp .env.example .env

# Start only MySQL and Redis in Docker
docker compose up -d mysql redis

npm install
npm run wait:services   # wait for ports 3306 + 6379
npm run db:setup        # migrate + seed
npm run dev             # development with hot reload
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Create upload/log dirs + generate `openapi.json` |
| `npm run dev` | Development server with `--watch` |
| `npm run start` | Production server |
| `npm run start:prod` | Production server (`NODE_ENV=production`) |
| `npm run db:migrate` | Run SQL migrations |
| `npm run db:seed` | Run seeders |
| `npm run db:setup` | Migrate + seed |
| `npm run wait:services` | Wait for MySQL/Redis TCP ports |
| `npm run openapi:generate` | Regenerate `openapi.json` |
| `npm run docker:build` | Build API Docker image |
| `npm run docker:up` | Start full Docker stack |
| `npm run docker:down` | Stop Docker stack |
| `npm run docker:logs` | Tail API container logs |
| `npm run docker:reset` | Destroy volumes and rebuild |

## Docker services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `mysql` | mysql:8.0 | 3306 | Primary database |
| `redis` | redis:7-alpine | 6379 | Cache / readiness checks |
| `api` | Custom Dockerfile | 3000 | Node.js Express API |

On container start the API waits for MySQL + Redis, runs migrations (`RUN_MIGRATIONS=true`), seeds data (`RUN_SEEDERS=true`), then starts the server.

## Health probes

| Endpoint | Purpose | Success |
|----------|---------|---------|
| `GET /health` | Overall status (MySQL + Redis) | 200 healthy / 503 degraded |
| `GET /health/live` | Liveness — process alive | Always 200 |
| `GET /health/ready` | Readiness — deps connected | 200 ready / 503 not_ready |
| `GET /live` | Liveness alias | 200 |
| `GET /ready` | Readiness alias | 200 / 503 |

Example readiness response:

```json
{
  "success": true,
  "message": "ready",
  "data": {
    "status": "ready",
    "checks": {
      "database": { "status": "up", "latencyMs": 2 },
      "redis": { "status": "up", "latencyMs": null }
    }
  }
}
```

## Environment

Copy [`.env.example`](.env.example) to `.env`. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | `mysql` inside Docker Compose |
| `DB_USER` / `DB_PASSWORD` | `justtap` / `justtap_secret` | MySQL credentials |
| `REDIS_URL` | `redis://localhost:6379` | `redis://redis:6379` in Compose |
| `RUN_MIGRATIONS` | `true` | Auto-migrate on Docker start |
| `RUN_SEEDERS` | `true` | Auto-seed on Docker start |
| `SKIP_REDIS` | — | Set `true` to skip Redis (dev only) |

## Database

Production MySQL 8 schema for the Super Admin mobile flow only (25 tables, 7 views, 5 triggers).

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run migrations `000`–`010` |
| `npm run db:seed` | Insert sample data |
| `npm run db:setup` | Migrate + seed |

Key files:

- [`src/database/schema.sql`](src/database/schema.sql) — full consolidated SQL (~800 lines)
- [`src/database/migrations/`](src/database/migrations/) — ordered migration files
- [`src/database/seeders/`](src/database/seeders/) — sample data with stable UUIDs
- [`src/database/RELATIONSHIPS.md`](src/database/RELATIONSHIPS.md) — ER diagram, FKs, views, triggers

## Default credentials

- Email: `admin@justtap.com`
- Password: `admin123`

## API

- Base URL: `http://localhost:3000/api/v1`
- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON**: `http://localhost:3000/openapi.json` (also `/api/docs.json`)
- Health: `http://localhost:3000/health`
- Liveness: `http://localhost:3000/health/live`
- Readiness: `http://localhost:3000/health/ready`

### OpenAPI documentation

Complete OpenAPI 3.0 spec with request/response schemas, validation rules, example payloads, error responses, HTTP status codes, and JWT `Authorization: Bearer` authentication.

```bash
npm run openapi:generate   # writes openapi.json to project root
```

| Feature | Details |
|---------|---------|
| Authentication | `bearerAuth` — `Authorization: Bearer <access_token>` from `POST /auth/login` |
| Validation errors | HTTP 422 with `{ success, message, errors[] }` |
| Standard errors | 400, 401, 403, 404, 409, 422, 429, 500 documented per endpoint |
| List endpoints | Pagination, search, sort, filter query params documented |
| Import endpoints | Multipart CSV/JSON file or JSON `{ records: [...] }` body |
| Export endpoints | `format=json\|csv`, `download=true` query params |

Spec source: `src/docs/` (components, paths, helpers).

## Response format

```json
{ "success": true, "message": "", "data": {} }
{ "success": false, "message": "", "errors": [] }
```

## API endpoints

All routes require `Authorization: Bearer <access_token>` except auth login/refresh/OTP/forgot-password.

### Auth (`/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Login with email/password |
| POST | `/logout` | Revoke refresh token |
| POST | `/token/refresh` | Refresh access token |
| POST | `/otp/send` | Send OTP |
| POST | `/otp/verify` | Verify OTP |
| POST | `/password/forgot` | Request password reset |
| POST | `/password/reset` | Reset password with token |
| POST | `/password/change` | Change password (authenticated) |
| GET | `/me` | Current user profile |

### Profile (`/me`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get profile |
| PATCH | `/` | Update profile |
| PATCH | `/preferences` | Update preferences |
| POST | `/avatar` | Upload avatar image |

### Dashboard (`/dashboard`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/home` | Home screen stats and summaries |

### Events (`/events`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/meta` | Status labels and filter options |
| GET | `/calendar` | Calendar view by month |
| GET | `/today` | Today's events |
| GET | `/upcoming` | Upcoming events |
| GET | `/export` | Export events (JSON/CSV) |
| GET | `/` | List events (pagination, search, sort, filter) |
| POST | `/` | Create event |
| POST | `/bulk-delete` | Bulk soft-delete |
| PATCH | `/bulk-update` | Bulk status update |
| GET | `/:id` | Event detail |
| PATCH | `/:id` | Update event |
| DELETE | `/:id` | Soft-delete event |
| GET | `/:eventId/tasks` | Event tasks list |
| POST | `/:eventId/tasks/assign` | Assign tasks to event |
| POST | `/:eventId/functions` | Add function |
| PATCH | `/:eventId/functions/:functionId` | Update function |
| DELETE | `/:eventId/functions/:functionId` | Delete function |
| GET | `/:eventId/menu-planning` | Menu planning view |
| PUT | `/:eventId/menu-planning` | Update menu selections |
| GET | `/:eventId/tables` | Table assignments |
| PUT | `/:eventId/tables` | Bulk save table assignments |
| POST | `/:eventId/tables/:tableNumber/assign` | Assign single table |
| POST | `/:eventId/table-allocation` | Allocate dining/captain tables |
| GET | `/:eventId/orders/summary` | Order summary |
| GET | `/:eventId/orders/tables` | Orders by table |
| GET | `/:eventId/orders/tables/:tableNumber` | Table order detail |
| GET | `/:eventId/orders/report` | Order report export |
| GET | `/:eventId/feedback` | Feedback list |
| GET | `/:eventId/feedback/summary` | Feedback summary |
| GET | `/:eventId/feedback/export` | Export feedback |
| POST | `/:eventId/feedback` | *(via `/feedback` routes for reply/flag)* |

### Inquiries (`/inquiries`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Inquiry statistics |
| GET | `/export` | Export inquiries |
| POST | `/import` | Import CSV/JSON |
| GET | `/` | List (pagination, search, sort, filter) |
| POST | `/` | Create inquiry |
| POST | `/bulk-delete` | Bulk delete |
| PATCH | `/bulk-update` | Bulk status update |
| GET | `/:id` | Inquiry detail |
| PATCH | `/:id` | Update inquiry |
| DELETE | `/:id` | Delete inquiry |
| POST | `/:id/convert` | Convert to event |

### Menu (`/menu`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | `/categories`, `/categories/:id` | Category CRUD |
| POST | `/categories/bulk-delete`, `/categories/bulk-update` | Bulk category ops |
| GET/POST | `/categories/export`, `/categories/import` | Export/import |
| GET/POST/PATCH/DELETE | `/items`, `/items/:id` | Menu item CRUD |
| POST | `/items/bulk-delete`, `/items/bulk-update` | Bulk item ops |
| GET/POST | `/items/export`, `/items/import` | Export/import |
| GET | `/packages`, `/courses` | Packages and courses |

### Tasks (`/tasks`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/summary` | Task summary |
| GET | `/export` | Export task templates |
| GET/POST/PATCH/DELETE | `/`, `/:id` | Task template CRUD |
| POST | `/bulk-delete` | Bulk delete templates |

### Staff (`/staff`)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | `/`, `/:id` | Staff CRUD |
| POST | `/bulk-delete`, `/bulk-update` | Bulk ops |
| GET/POST | `/export`, `/import` | Export/import |

### Feedback (`/feedback`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/bulk-delete`, `/bulk-flag` | Bulk operations |
| POST | `/:id/reply` | Reply to feedback |
| POST | `/:id/flag` | Flag feedback |

### Orders (`/orders`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/items/:lineItemId` | Order line item detail |

### Activity (`/activity`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/recent` | Recent activity feed |
| GET | `/events/:eventId` | Event activity log |

### Analytics, Content, Uploads
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/sales` | Sales analytics |
| GET | `/content/about`, `/content/contact` | Static content pages |
| POST | `/uploads/images`, `/uploads/documents` | File uploads |

### List query parameters (tables)

All list endpoints support: `page`, `limit`, `search`, `sortBy`, `sortOrder`, plus domain-specific filters.

Export endpoints support: `format=json|csv`, `download=true`.

Import endpoints accept JSON body `{ "records": [...] }` or multipart CSV/JSON file upload.

## Project structure

```
src/
  config/       — database, JWT, multer, swagger
  controllers/  — request handlers
  services/     — business logic
  repositories/ — data access (parameterized queries)
  routes/       — Express routers
  middleware/   — auth, validation, errors, rate limiting
  validations/  — Joi schemas
  database/     — schema.sql, seeders, setup script
```
