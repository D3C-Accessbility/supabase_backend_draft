# Unitrans MVP

A full-stack web application for Unitrans bus services with schedule management and notifications.

## Project Structure

- `api/` - Backend Express.js server
- `web/` - Frontend React application

## API Routes

The backend contains the following API endpoints:

- `maps.js` - Google Maps navigation service
- `schedules.js` - Departure notification schedules
- `umo_routes.js` - Unitrans API calls

## Backend Setup

1. Navigate to the API directory:
   ```bash
   cd your-project-directory/api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file with Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the server:
   ```bash
   node index.js
   ```

The backend runs on port 3000 by default.

## OpenTripPlanner (OTP) Setup

1. Download the OTP shaded JAR into the `api/data/open_trip_planner` folder:
   ```bash
   cd your-project-directory/api/data/open_trip_planner
   curl -L -o otp-shaded-2.8.1.jar https://repo1.maven.org/maven2/org/opentripplanner/otp-shaded/2.8.1/otp-shaded-2.8.1.jar
   ```

2. Verify you have Java 1.8+ installed:
   ```bash
   java -version
   ```

3. Start OTP using the saved graph:
   ```bash
   java -Xmx2G -jar otp-shaded-2.8.1.jar --load .
   ```

OTP's Grizzly server runs at `http://localhost:8080` by default.

## Frontend Setup

1. Navigate to the web directory:
   ```bash
   cd your-project-directory/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file with Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend runs on `http://localhost:5173`

## Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Navigate to Settings > API
4. Copy the Project URL and API keys

## Technologies Used

- **Backend:** Node.js, Express.js, Supabase
- **Frontend:** React, Vite
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
