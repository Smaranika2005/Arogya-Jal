# Arogya Jal REST API

Base URL: `http://localhost:8788/api`

Authentication: Bearer token from Supabase Auth (`Authorization: Bearer <access_token>`)

IoT endpoints optionally require: `X-IoT-API-Key: <IOT_API_KEY>`

---

## Health

### `GET /health`

Returns service status.

---

## IoT (ESP32)

### `POST /iot/readings`

Ingest pH sensor reading. No user JWT required if `IOT_API_KEY` is unset; otherwise send API key header.

**Body:**
```json
{
  "sensorCode": "PH001",
  "rawAdcValue": 1050,
  "voltage": 0.85,
  "phValue": 7.2,
  "timestamp": "2026-06-01T10:00:00Z"
}
```

**Response `201`:**
```json
{
  "reading": { "id": 1, "sensor_value": 7.2, "recorded_at": "..." },
  "sensor": { "id": 1, "code": "PH001", "type": "PH" },
  "waterBodyId": 1
}
```

Summary tables are updated asynchronously after insert.

---

## Hierarchy

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/municipalities` | Any authenticated | List municipalities |
| GET | `/municipalities/:id/wards` | Any authenticated | Wards in municipality |
| GET | `/wards/:id/booths` | Any authenticated | Booths in ward |
| GET | `/booths/:id/water-bodies` | Any authenticated | Water bodies in booth |
| GET | `/water-bodies/:id/ph-summary` | Any authenticated | Precomputed pH stats (read-only for ASHA form) |

---

## WQI & Scoring (Backend-only calculations)

### `POST /wqi/calculate`

**Role:** `asha_worker`

Calculate WQI for a single water body using `avg_ph_30_days` from summary table.

**Body:**
```json
{
  "waterBodyId": 1,
  "boothId": 1,
  "tds": 250,
  "turbidity": 4,
  "priority": 3
}
```

### `POST /booths/submit-report`

**Role:** `asha_worker`

Submit multiple water bodies for one booth. Priority is assigned by array order (first = highest).

**Body:**
```json
{
  "boothId": 1,
  "entries": [
    { "waterBodyId": 1, "tds": 250, "turbidity": 4 },
    { "waterBodyId": 2, "tds": 400, "turbidity": 8 }
  ]
}
```

**Response:** Individual WQI reports, booth score, ward score propagation, municipality score propagation.

**Booth Score Formula:**
```
SUM(WQI × weight) / SUM(weight)
weights = n, n-1, ..., 1 by priority order
```

---

## Dashboard

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/dashboard/municipalities` | gov, public | All municipalities with latest scores |
| GET | `/dashboard/municipalities/:id` | gov, public | Full hierarchy dashboard |
| GET | `/dashboard/water-bodies/:id` | gov, public | Details + pH/WQI trends |
| GET | `/dashboard/booths/:id/trends` | gov, public | Booth score history |
| GET | `/dashboard/wards/:id/trends` | gov, public | Ward score history |

---

## Admin

### `POST /admin/summaries/refresh`

**Role:** `government`

Manually trigger water body summary recalculation from `sensor_readings`.

---

## WQI Scoring Reference

| Parameter | Ranges → Score |
|-----------|----------------|
| pH (30-day avg) | 6.5–8.5→100, 6.0–6.5/8.5–9.0→80, 5.5–6.0/9.0–9.5→60, else→40 |
| TDS | 0–300→100, 301–500→80, 501–1000→60, >1000→40 |
| Turbidity | 0–5→100, 6–10→80, 11–20→60, >20→40 |

**Formula:** `WQI = ph×0.4 + tds×0.3 + turbidity×0.3`

---

## Architecture

```
ESP32 → POST /iot/readings → sensor_readings
                              ↓ (async job)
                         water_body_summary

ASHA Worker → POST /booths/submit-report → water_quality_reports
                                        → booth_reports
                                        → ward_reports
                                        → municipality_reports

Dashboard → GET /dashboard/* (reads precomputed tables only)
```

Scheduled job (`SUMMARY_JOB_CRON`, default every 15 min) refreshes all `water_body_summary` rows.
