# Coworking Reservation API

Workspace Reservation Management System — Node.js + TypeScript backend with IoT integration.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript 5 |
| Framework | Express.js |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| MQTT | MQTT.js + Eclipse Mosquitto 2.0 |
| Validation | Zod |
| API Docs | Swagger / OpenAPI 3.0 |
| Tests | Jest + Supertest |
| Containers | Docker + docker-compose |

---

## Architecture

Clean Architecture with 4 layers:

```
src/
├── domain/           # Entities, repository interfaces, domain errors
├── application/      # Use-cases, DTOs (Zod schemas)
├── infrastructure/   # Prisma repositories, HTTP (Express), MQTT handlers
└── shared/           # Constants, utilities, types
```

**Dependency rule:** inner layers never depend on outer layers. All dependencies point inward.

---

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- A running **Mosquitto MQTT broker** on port `1883`

> This project does not manage its own MQTT broker. Configure `MQTT_BROKER_URL` in `.env` to point to your broker instance.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env with your values

# 3. Start PostgreSQL
docker compose up -d postgres

# 4. Run database migrations
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. Start the API
npm run dev       # development (hot reload)
npm run build && npm start   # production
```

### Full Docker stack

```bash
# Builds and starts the API + PostgreSQL in containers
docker compose up --build -d
```

> **Linux note:** When the API runs inside Docker, use `MQTT_BROKER_URL=mqtt://172.17.0.1:1883` in `.env` instead of `host.docker.internal`.

The API will be available at:
- **API:** `http://localhost:3000`
- **Swagger UI:** `http://localhost:3000/api-docs`
- **Health:** `http://localhost:3000/health`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | HTTP port |
| `API_KEY` | — | Static API key for authentication |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `MQTT_BROKER_URL` | `mqtt://localhost:1883` | Mosquitto broker URL |
| `MQTT_CLIENT_ID` | `coworking-api` | MQTT client identifier |
| `ALERT_CO2_OPEN_WINDOW_SEC` | `300` | CO2 alert open window (seconds) |
| `ALERT_CO2_RESOLVE_WINDOW_SEC` | `120` | CO2 alert resolve window (seconds) |
| `ALERT_OCCUPANCY_MAX_OPEN_WINDOW_SEC` | `120` | Occupancy max alert open window |
| `ALERT_OCCUPANCY_MAX_RESOLVE_WINDOW_SEC` | `60` | Occupancy max alert resolve window |
| `ALERT_OCCUPANCY_UNEXPECTED_OPEN_WINDOW_SEC` | `600` | Unexpected occupancy open window |
| `ALERT_OCCUPANCY_UNEXPECTED_RESOLVE_WINDOW_SEC` | `300` | Unexpected occupancy resolve window |
| `TELEMETRY_AGGREGATION_WINDOW_MIN` | `5` | Telemetry aggregation window (minutes) |

---

## Authentication

All `/api/*` endpoints require the `x-api-key` header:

```
x-api-key: your-api-key-here
```

The `/health` endpoint is public.

---

## API Endpoints

### Places

| Method | Path | Description |
|---|---|---|
| GET | `/api/places` | List all places (paginated) |
| GET | `/api/places/:id` | Get place by ID |
| POST | `/api/places` | Create a place |
| PATCH | `/api/places/:id` | Update a place |
| DELETE | `/api/places/:id` | Delete a place |

### Spaces

| Method | Path | Description |
|---|---|---|
| GET | `/api/spaces` | List all spaces (paginated) |
| GET | `/api/spaces/:id` | Get space by ID |
| POST | `/api/spaces` | Create a space |
| PATCH | `/api/spaces/:id` | Update a space |
| DELETE | `/api/spaces/:id` | Delete a space |

### Reservations

| Method | Path | Description |
|---|---|---|
| GET | `/api/reservations` | List reservations with filters + pagination |
| GET | `/api/reservations/:id` | Get reservation by ID |
| POST | `/api/reservations` | Create a reservation |
| PATCH | `/api/reservations/:id` | Update a reservation |
| DELETE | `/api/reservations/:id` | Delete a reservation |

**Query params for GET /api/reservations:**
- `page` (default: 1), `pageSize` (default: 20, max: 100)
- `spaceId`, `placeId`, `clientEmail`, `date` (YYYY-MM-DD)

### IoT

| Method | Path | Description |
|---|---|---|
| GET | `/api/iot/spaces/:spaceId/status` | Full IoT status (telemetry + digital twin + active alert) |
| PUT | `/api/iot/spaces/:spaceId/desired` | Update device config (publishes to MQTT) |
| GET | `/api/iot/spaces/:spaceId/alerts` | List alerts (paginated) |
| GET | `/api/iot/spaces/:spaceId/telemetry` | List telemetry aggregations (paginated) |

---

## Business Rules

1. **No schedule conflicts:** two reservations for the same space cannot overlap in time on the same date.
2. **Weekly limit:** a client (identified by email) cannot hold more than **3 active reservations per calendar week** (Monday–Sunday).
3. **Office hours validation:** `opensAt` must be earlier than `closesAt` when creating/updating a space.

---

## IoT Integration

### MQTT Topics

The API subscribes to:
- `sites/+/offices/+/telemetry` — sensor readings (temperature, humidity, CO₂, occupancy, power)
- `sites/+/offices/+/reported` — device state confirmation (digital twin reported side)

The API publishes to:
- `sites/{siteId}/offices/{officeId}/desired` — desired configuration (sent via `PUT /api/iot/spaces/:id/desired`)

> **Mapping:** `siteId` corresponds to a `placeId` and `officeId` corresponds to a `spaceId` in the database.

### Digital Twin

| State | Table | Description |
|---|---|---|
| Desired | `device_desired` | Config the cloud wants the device to apply |
| Reported | `device_reported` | Config the device has confirmed is applied |

Divergence between the two states is visible via `GET /api/iot/spaces/:id/status`.

### Alert Rules

| Kind | Trigger | Open window | Resolve window |
|---|---|---|---|
| `CO2` | `co2_ppm > co2_alert_threshold` | 5 min consecutive | 2 min below threshold |
| `OCCUPANCY_MAX` | `occupancy > space.capacity` | 2 min consecutive | 1 min below capacity |
| `OCCUPANCY_UNEXPECTED` | `occupancy > 0` outside hours OR no active reservation | 10 min consecutive | 5 min |

All windows are configurable via environment variables.

---

## Running Tests

```bash
# Unit tests only (no DB required)
npm run test:unit

# Integration tests (requires PostgreSQL on TEST_DATABASE_URL)
npm run test:integration

# All tests with coverage
npm run test:coverage
```

> Integration tests connect to `TEST_DATABASE_URL` (defaults to `coworking_test` database).

---

## Swagger UI

Once the API is running, visit `http://localhost:3000/api-docs` for the interactive API documentation.

All endpoints require the `x-api-key` header — click **Authorize** in the Swagger UI and enter your key.

---

## Postman Collection

Import both files from `docs/postman/`:
1. `coworking-api.postman_collection.json` — all requests
2. `coworking-api.postman_environment.json` — environment variables

The collection uses scripts to automatically save `placeId`, `spaceId`, and `reservationId` variables after create operations, so you can run requests sequentially without manual copy-paste.

---

## Database Schema

```
places          → physical locations (latitude, longitude, timezone)
spaces          → rentable units (capacity, opens_at, closes_at)
reservations    → client bookings (place_id denormalized for query performance)
device_desired  → digital twin: desired config (cloud → device)
device_reported → digital twin: reported config (device → cloud)
telemetry_aggregations → 5-min window aggregations of sensor readings
alerts          → CO2, OCCUPANCY_MAX, OCCUPANCY_UNEXPECTED events
```

---

## Project Structure

```
coworking-api/
├── src/
│   ├── domain/               # Pure business logic (no framework deps)
│   │   ├── entities/         # TypeScript interfaces for core models
│   │   ├── repositories/     # Repository interfaces (contracts)
│   │   └── errors/           # Domain-specific error classes
│   ├── application/
│   │   ├── use-cases/        # Business logic orchestration
│   │   └── dtos/             # Zod validation schemas
│   ├── infrastructure/
│   │   ├── http/             # Express server, routes, middlewares
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── database/         # Prisma client + repository implementations
│   │   └── mqtt/             # MQTT client, handlers, alert engine, publishers
│   └── shared/               # Constants, utilities, types
├── prisma/
│   └── schema.prisma         # Database schema
├── tests/
│   ├── unit/                 # Use-case and utility tests (no DB)
│   └── integration/          # API endpoint tests (real DB)
├── docs/postman/             # Postman collection + environment
├── docker/                   # Dockerfiles
├── docker-compose.yml
├── AI.md                     # AI usage documentation
├── CHANGELOG.md
└── README.md
```
