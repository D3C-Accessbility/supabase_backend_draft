# Unitrans UC Davis Bus App

Full-stack app for Unitrans bus services: real-time arrivals, trip planning with OpenTripPlanner, schedules, and maps.

## Project structure

| Folder | Purpose |
|--------|---------|
| `api/` | Express backend: UmoIQ proxy (routes, stops, predictions), Supabase schedules, **OTP proxy** (trip plan) |
| `web/` | Main frontend: React + Vite. Home, Stops (search + map), **Plan** (OTP trip + map), My Schedule, Settings |
| `open_trip_planner/` | OTP data (GTFS, graph). Run OTP Java server here for trip planning. |
| `otp-react-redux/` | Optional standalone OTP trip planner (separate app). |

## Quick start

1. **Start OpenTripPlanner** (for Plan page and trip maps):
   ```bash
   cd open_trip_planner
   # Download the OTP JAR once (if you don't have it):
   curl -L -o otp-shaded-2.8.1.jar https://repo1.maven.org/maven2/org/opentripplanner/otp-shaded/2.8.1/otp-shaded-2.8.1.jar
   # Run OTP (requires Java 8+). Script defaults to port 9080 to avoid Docker:
   ./download-and-run.sh
   # Or: java -Xmx2G -jar otp-shaded-2.8.1.jar --port 9080 --load .
   ```
   OTP runs at `http://localhost:9080` (script default). Set `OTP_URL=http://localhost:9080` in `api/.env.local` so the API can reach it.

2. **Start the API**:
   ```bash
   cd api
   npm install
   # Add .env.local with SUPABASE_*, UMO_API_KEY
   node index.js
   ```
   API runs at `http://localhost:3000`.

3. **Start the web app**:
   ```bash
   cd web
   npm install
   # Optional: add web/.env.local (see Environment section below)
   npm run dev
   ```
   Web runs at `http://localhost:5173`.

## Features

- **Home**: Route planning card (boarding from / going to), “Find Buses” → Plan page or stop arrivals; Buses Running Now (location + real-time predictions).
- **Stops**: Search stops by name, nearby arrivals with Live ETA, **map** with stop markers and your location.
- **Plan**: OpenTripPlanner trip planning. Pick from/to stops, date/time, “Find trip” → itineraries + **map** with route polyline.
- **My Schedule**: Grid/list of your saved schedules (auth); link to manage notifications.
- **Settings**: Notifications, theme (light/dark/system), preferences (stored in localStorage).

## API overview

| Path | Description |
|------|-------------|
| `GET /umo_routes/agency` | Agency info |
| `GET /umo_routes/routes` | All routes |
| `GET /umo_routes/routes/:route/stops` | Stops for a route |
| `GET /umo_routes/predictions?stop=&route=` | Predictions at stop |
| `GET /umo_routes/predictions/near?lat=&lon=` | Predictions near location |
| `GET /umo_routes/stops/search?query=` | Search stops by name |
| `GET /otp/plan?fromLat=&fromLon=&toLat=&toLon=&date=&time=` | OTP trip plan (proxies to OTP) |
| `GET /otp/health` | Check OTP is reachable |
| `GET/POST/PUT/DELETE /schedules*` | User schedules (auth) |

## Environment

**api/.env.local**

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` – Supabase
- `UMO_API_KEY` – UmoIQ (Unitrans real-time)
- `OTP_URL` – optional, default `http://localhost:8080`. Use `http://localhost:9080` if you start OTP with the script (it uses port 9080 to avoid Docker).
- `OTP_ROUTER_ID` – optional, default `default`

**web/.env.local**

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_ANON=your_supabase_anon_jwt
VITE_API_BASE_URL=/api
VITE_OTP_APP_URL=/otp/
VITE_APP_URL=http://localhost:3000
```

Do not commit real keys/tokens to source control.

## Tech stack

- **Backend:** Node.js, Express, Supabase, UmoIQ proxy, OTP proxy
- **Frontend:** React, Vite, React Router, Leaflet (maps)
- **Trip planning / maps:** OpenTripPlanner (OTP), proxied via API; maps in Plan and Stops
