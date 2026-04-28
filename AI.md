# AI Usage Report

## Tool Used

**Claude Sonnet 4.6** via Claude Code CLI (Anthropic).

## What Was Delegated to AI

| Area | What AI Did |
|---|---|
| **Code generation** | Generated all source files: entities, repositories, use-cases, controllers, routes, middlewares, MQTT handlers, alert engine, tests |
| **IoT integration** | Designed the MQTT subscriber pattern, Digital Twin upsert logic, and the alert state machine (condition window tracking in memory) |
| **Test strategy** | Structured unit and integration tests following the repository pattern with mocks |
| **Documentation** | Generated README, Swagger JSDoc annotations, Postman collection, and shell scripts |

## What Was Reviewed and Validated Manually

- Business rules (weekly reservation limit, schedule conflict detection, office hours validation)
- Alert engine time-window logic (condition tracking per space, open/resolve cycles)
- Digital Twin separation: empirical telemetry data vs. device configuration state
- Denormalization decision and trade-off documentation in code comments
- IoT topic wildcard parsing (`sites/+/offices/+/{suffix}`)

## AI Limitations Acknowledged

- AI-generated code was validated for correctness but not run against a live database during generation
- Integration tests require a running PostgreSQL instance (documented in README)
- The alert engine uses in-memory state — a production system would need Redis or DB-backed state for multi-instance deployments
