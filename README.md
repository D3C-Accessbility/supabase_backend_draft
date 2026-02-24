# Unitrans MVP

A full-stack web application for Unitrans bus services with schedule management and navigation.

## Features

- Single-page library for navigation (`otp-react-redux`).

## Project Structure

- `api/`: Custom backend (Express.js).
- `open_trip_planner/`: OpenTripPlanner Java application (runs Grizzly server).
- `otp-react-redux/`: Main navigation web app.
- `web/`: Legacy frontend framework (deprecated).

## Quick Start (Recommended)

1. Start the Grizzly server in `open_trip_planner` first:
   ```bash
   cd open_trip_planner
   java -Xmx2G -jar otp-shaded-2.8.1.jar --load .
   ```

2. Start the custom backend in `api`:
   ```bash
   cd api
   node index.js
   ```

3. Build and start `otp-react-redux`:
   ```bash
   cd otp-react-redux
   yarn build
   yarn start
   ```

## Backend Setup

1. Navigate to the API directory:
   ```bash
   cd api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the server:
   ```bash
   node index.js
   ```

The backend runs on port `3000` by default.

## OpenTripPlanner (OTP) Setup

1. Navigate to `open_trip_planner`:
   ```bash
   cd open_trip_planner
   ```

2. Download the OTP shaded JAR (if needed):
   ```bash
   curl -L -o otp-shaded-2.8.1.jar https://repo1.maven.org/maven2/org/opentripplanner/otp-shaded/2.8.1/otp-shaded-2.8.1.jar
   ```

3. Verify Java 8+ is installed:
   ```bash
   java -version
   ```

4. Start OTP using the saved graph:
   ```bash
   java -Xmx2G -jar otp-shaded-2.8.1.jar --load .
   ```

OTP's Grizzly server runs at `http://localhost:8080` by default.

## Frontend Setup (Deprecated)

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The deprecated frontend runs on `http://localhost:5173`.

## Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com).
2. Select your project.
3. Navigate to **Settings > API**.
4. Copy the project URL and API keys.

## Technologies Used

- Backend: Node.js, Express.js, Supabase
- Frontend: React, Vite, Redux
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Routing Engine: OpenTripPlanner
