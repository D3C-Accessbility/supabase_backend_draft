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
   cd /Users/steven_liu/Projects/unitrans_mvp/unitrans_steven/my-app/api
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

## Frontend Setup

1. Navigate to the web directory:
   ```bash
   cd /Users/steven_liu/Projects/unitrans_mvp/unitrans_steven/my-app/web
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