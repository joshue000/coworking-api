# Changelog

## [0.1.0] — 2026-04-27

### Added
- Initial project setup: TypeScript, Express, Prisma, PostgreSQL, MQTT
- Clean Architecture: domain / application / infrastructure / shared layers
- **Places** CRUD endpoints (`/api/places`)
- **Spaces** CRUD endpoints (`/api/spaces`)
- **Reservations** CRUD endpoints (`/api/reservations`) with pagination and filters
- API Key authentication middleware (`x-api-key` header)
- Business rule: schedule conflict detection per space
- Business rule: maximum 3 active reservations per client per week
- **IoT — MQTT subscriber** for `telemetry` and `reported` topics (wildcard pattern)
- **IoT — Digital Twin**: `device_desired` and `device_reported` tables
- **IoT — Alert Engine**: CO2, OCCUPANCY_MAX, OCCUPANCY_UNEXPECTED rules with configurable time windows
- **IoT — Telemetry Aggregations**: 5-minute window aggregation into `telemetry_aggregations`
- **IoT — Desired Publisher**: publishes configuration to `sites/{siteId}/offices/{officeId}/desired`
- Swagger / OpenAPI docs at `/api-docs`
- Postman collection + environment file
- Unit tests: reservation use-cases, space use-cases, time utilities
- Integration tests: Places API, Reservations API
- Docker Compose: PostgreSQL 16, Eclipse Mosquitto 2.0, API service
- Shell scripts: `setup.sh`, `start.sh`, `start-docker.sh`, `test.sh`
- `AI.md` documenting Claude AI usage
