# Frontend ↔ Backend Integration

Baseline integration layer connecting the React frontend to the Express backend so all core Unitrans bus features are functional.

---

## 1. Dependency graph (frontend → backend)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React + Vite)                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  App.jsx                                                                     │
│    ├── Header.jsx          → nav links (no API)                              │
│    ├── Home.jsx            → getAgency()                                    │
│    ├── RoutesList.jsx      → getRoutes()                                    │
│    ├── RouteDetail.jsx     → getRoutes(), getStopsByRoute(routeId)           │
│    ├── StopsList.jsx       → getRoutes(), getStopsByRoute(), searchStops()   │
│    ├── StopDetail.jsx      → getPredictionsByStop(stopId, route?)            │
│    ├── arrival_predictions → getPredictionsNear(lat, lon)                   │
│    ├── notification_scheduler → getSchedules, getScheduleTimes,             │
│    │                             createSchedule, updateSchedule,             │
│    │                             deleteSchedule (all with getToken)          │
│    └── authentication.jsx  → Supabase only (no backend API)                  │
│                                                                              │
│  All API calls go through:                                                   │
│    web/src/lib/unitransApi.js  → wrappers for each endpoint                  │
│    web/src/lib/api.js          → central fetch (base URL, auth, errors)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BACKEND (Express, port 3000)                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  index.js                                                                    │
│    ├── /health, /test, /     (no frontend use in this baseline)             │
│    ├── /schedules/*           → routes/schedules.js (Supabase + auth)         │
│    └── /umo_routes/*          → routes/umo_routes.js (UmoIQ proxy)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API contract summary table

| Method | Path | Auth | Params / Body | Response (success) |
|--------|------|------|----------------|---------------------|
| GET | `/umo_routes/agency` | No | — | `{ id, name, shortName, website, phone, timezone, ... }` |
| GET | `/umo_routes/routes` | No | — | `[{ id, title, color, textColor, hidden, timestamp }]` |
| GET | `/umo_routes/routes/:route/stops` | No | `route` (param) | `[{ id, name, code, lat, lon, route, directions, ... }]` |
| GET | `/umo_routes/predictions` | No | `stop` (query), `route` (query, optional) | `[{ serverTimestamp, route, stop, predictions[] }]` |
| GET | `/umo_routes/predictions/near` | No | `lat`, `lon` (query) | Same as above (array of bundles) |
| GET | `/umo_routes/stops/search` | No | `query` (query) | `[{ id, name, code, lat, lon, route }]` (max 10) |
| GET | `/schedules` | Bearer | — | `[{ id, user_id, title, origin_stop_id, route_id, direction_id, notify_lead_time_min, ... }]` |
| POST | `/schedules` | Bearer | Body: `{ title, origin_stop_id, route_id, direction_id, notify_lead_time_min, days[], depart_time_local }` | `{ id }` |
| GET | `/schedules/:id` | Bearer | `id` (param) | Single schedule object |
| PUT | `/schedules/:id` | Bearer | Same body as POST | `{ id }` |
| DELETE | `/schedules/:id` | Bearer | `id` (param) | `{ message: "Deleted" }` |
| GET | `/schedules/:scheduleId/times` | Bearer | `scheduleId` (param) | `[{ schedule_id, day, depart_time_local }]` |

Error responses: JSON `{ error: "string" }` with appropriate HTTP status (4xx/5xx). Frontend `api()` throws `Error(message)` with `body.error` or status text.

---

## 3. Step-by-step integration explanation

1. **Central API client (`web/src/lib/api.js`)**  
   - Single base URL from `VITE_API_URL` or `http://localhost:3000`.  
   - `api(path, options, getToken)` performs `fetch`, sets `Content-Type` for JSON body, and optionally adds `Authorization: Bearer <token>` when `options.auth` is true and `getToken` is provided.  
   - On non-ok response, parses JSON and throws `Error(body.error || statusText)`.

2. **API wrappers (`web/src/lib/unitransApi.js`)**  
   - One function per backend route used by the app: `getAgency`, `getRoutes`, `getStopsByRoute`, `getPredictionsByStop`, `getPredictionsNear`, `searchStops`, and schedule CRUD + `getScheduleTimes`.  
   - Schedules functions take `getToken` (e.g. from Supabase session) and call `api(..., { auth: true }, getToken)`.

3. **Routes and pages**  
   - **Home**: Fetches agency (optional), shows links to Routes, Stops, Arrivals, Schedules.  
   - **Routes list** (`/routes`): Calls `getRoutes()`, shows list with links to `/routes/:routeId`.  
   - **Route detail** (`/routes/:routeId`): Resolves route title from `getRoutes()`, loads stops via `getStopsByRoute(routeId)`, links each stop to `/stops/:stopId?route=...`.  
   - **Stops** (`/stops`): Dropdown to filter by route (loads stops for that route), plus search-by-name using `searchStops(query)`. Results link to `/stops/:stopId?route=...` when applicable.  
   - **Stop detail** (`/stops/:stopId`): Reads `route` from query; calls `getPredictionsByStop(stopId, route)` and shows real-time arrivals.  
   - **Arrivals** (`/arrivals`): Gets user location, calls `getPredictionsNear(lat, lon)`, shows nearby departures with loading/error states.  
   - **Schedules** (`/notifications`): When logged in, uses `getSchedules(getToken)`, `getScheduleTimes`, `createSchedule`, `updateSchedule`, `deleteSchedule`; all errors surface as `apiError` state.

4. **Loading and error handling**  
   - Each page that fetches data has `loading` and `error` state.  
   - While loading, a simple “Loading…” message is shown.  
   - On API failure, `error` (or `apiError` in notification_scheduler) is set from the thrown message and rendered.

5. **Header and navigation**  
   - Header links to Home, Routes, Stops, Arrivals, Schedules, Auth.  
   - No backend logic was changed; only frontend files were added or modified.

---

## 4. Files created or modified

| File | Action |
|------|--------|
| `web/src/lib/api.js` | **Created** – central fetch wrapper and base URL |
| `web/src/lib/unitransApi.js` | **Created** – typed wrappers for all used backend endpoints |
| `web/src/App.jsx` | **Modified** – added routes for `/routes`, `/routes/:routeId`, `/stops`, `/stops/:stopId` and corresponding components |
| `web/src/components/Header.jsx` | **Modified** – added Routes, Stops, Schedules links; renamed Notifications to Schedules in nav |
| `web/src/components/Home.jsx` | **Modified** – fetches agency, shows links to Routes, Stops, Arrivals, Schedules |
| `web/src/components/RoutesList.jsx` | **Created** – view routes list, links to route detail |
| `web/src/components/RouteDetail.jsx` | **Created** – route detail and stops for that route, links to stop detail |
| `web/src/components/StopsList.jsx` | **Created** – filter by route + search by name, links to stop detail |
| `web/src/components/StopDetail.jsx` | **Created** – stop info and real-time arrivals for that stop (optional route in query) |
| `web/src/components/arrival_predictions.jsx` | **Modified** – uses `getPredictionsNear` from unitransApi; loading/error already present |
| `web/src/components/notification_scheduler.jsx` | **Modified** – all schedule calls go through unitransApi with `getToken`; added `apiError` state for failures |

Backend: no changes.
