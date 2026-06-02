# Arogya Jal — Water Quality Monitoring Platform

IoT-enabled water quality monitoring from booth to municipality. ESP32 pH sensors feed the backend automatically; ASHA workers enter TDS and turbidity; WQI and hierarchical scores are computed server-side.

## Architecture

```
Municipality → Ward → Booth → Water Bodies → Sensors → Sensor Readings
                                                      ↓
                                              water_body_summary (scheduled job)
                                                      ↓
ASHA Form (TDS + Turbidity) → water_quality_reports → WQI
                                                      ↓
                              booth_reports → ward_reports → municipality_reports
```

## Quick Start

### 1. Database (Supabase SQL Editor)

Run in order:

1. `supabase/migrations/001_arogya_jal_schema.sql`
2. `supabase/migrations/002_migrate_legacy_data.sql` *(only when upgrading existing DB)*
3. `supabase/migrations/003_seed_demo.sql`

### 2. Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- `VITE_API_URL=http://localhost:8788/api`

### 3. Run

```bash
npm install
npm run dev:all    # frontend :8080 + API :8788
```

Or separately:

```bash
npm run api        # Backend REST API
npm run dev        # Vite frontend
```

## Backend (`server/`)

Clean architecture layout:

| Layer | Path |
|-------|------|
| Entities | `server/domain/entities/` |
| DTOs / Validation | `server/dto/validation.mjs` |
| Repositories | `server/repositories/` |
| Services | `server/services/` |
| Controllers | `server/controllers/` |
| Routes | `server/routes/api.mjs` |
| Scheduled Jobs | `server/jobs/summary-updater.mjs` |

API docs: [`server/docs/API.md`](server/docs/API.md)

### ESP32 Ingestion

```bash
POST /api/iot/readings
{
  "sensorCode": "PH001",
  "rawAdcValue": 1050,
  "voltage": 0.85,
  "phValue": 7.2,
  "timestamp": "2026-06-01T10:00:00"
}
```

## Frontend Routes

| Route | Role | Purpose |
|-------|------|---------|
| `/asha/water-quality` | ASHA worker | Booth water quality form |
| `/gov/dashboard` | Government | Municipality dashboard |
| `/public/dashboard` | Public user | Municipality-scoped view |

## Roles

- `asha_worker` — submit water quality reports
- `government` — full dashboard access
- `public_user` — municipality-scoped dashboard

## WQI (backend-only)

Uses **30-day average pH** from `water_body_summary`, not latest reading.

`WQI = phScore×0.4 + tdsScore×0.3 + turbidityScore×0.3`

Booth score uses descending priority weights (3, 2, 1 for 3 water bodies).

## Future Sensors

Register new sensors in `sensors` table (`TDS`, `TURBIDITY`, `TEMPERATURE`, `DISSOLVED_OXYGEN`). All values store in `sensor_readings.sensor_value` — no schema changes required.
