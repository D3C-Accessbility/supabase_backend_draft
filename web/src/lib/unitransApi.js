/**
 * Typed API wrappers for Unitrans backend.
 * - umo_routes: agency, routes, stops, predictions, stop search (no auth).
 * - schedules: user ride schedules (auth required; use getToken from supabase session).
 * All paths and response shapes mirror the Express backend.
 */

import { api } from "./api.js";

// --- Umo routes (public) ---

/** GET /umo_routes/agency → agency info object */
export async function getAgency() {
  return api("umo_routes/agency");
}

/** GET /umo_routes/routes → array of { id, title, color, textColor, hidden, timestamp } */
export async function getRoutes() {
  return api("umo_routes/routes");
}

/** GET /umo_routes/routes/:route/stops → array of stops */
export async function getStopsByRoute(routeId) {
  return api(`umo_routes/routes/${encodeURIComponent(routeId)}/stops`);
}

/**
 * GET /umo_routes/predictions?stop=ID&route=ROUTE (route optional)
 * → array of prediction bundles { serverTimestamp, route, stop, predictions[] }
 */
export async function getPredictionsByStop(stopId, routeId = null) {
  const params = new URLSearchParams({ stop: stopId });
  if (routeId) params.set("route", routeId);
  return api(`umo_routes/predictions?${params.toString()}`);
}

/**
 * GET /umo_routes/predictions/near?lat=LAT&lon=LON
 * → array of prediction bundles
 */
export async function getPredictionsNear(lat, lon) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  return api(`umo_routes/predictions/near?${params.toString()}`);
}

/** GET /umo_routes/stops/search?query=TERM → array of up to 10 stops { id, name, code, lat, lon, route } */
export async function searchStops(query) {
  if (!query || !String(query).trim()) return [];
  const params = new URLSearchParams({ query: String(query).trim() });
  return api(`umo_routes/stops/search?${params.toString()}`);
}

// --- Schedules (auth required) ---

/**
 * GET /schedules → list of ride_schedule for user. Requires getToken.
 */
export async function getSchedules(getToken) {
  return api("schedules", { auth: true }, getToken);
}

/**
 * POST /schedules → create schedule. Body: { title, origin_stop_id, route_id, direction_id, notify_lead_time_min, days[], depart_time_local }
 */
export async function createSchedule(body, getToken) {
  return api("schedules", { method: "POST", body: JSON.stringify(body), auth: true }, getToken);
}

/**
 * GET /schedules/:id → one schedule
 */
export async function getSchedule(id, getToken) {
  return api(`schedules/${encodeURIComponent(id)}`, { auth: true }, getToken);
}

/**
 * PUT /schedules/:id → update schedule (same body shape as create)
 */
export async function updateSchedule(id, body, getToken) {
  return api(`schedules/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body), auth: true }, getToken);
}

/**
 * DELETE /schedules/:id
 */
export async function deleteSchedule(id, getToken) {
  return api(`schedules/${encodeURIComponent(id)}`, { method: "DELETE", auth: true }, getToken);
}

/**
 * GET /schedules/:scheduleId/times → array of { schedule_id, day, depart_time_local }
 */
export async function getScheduleTimes(scheduleId, getToken) {
  return api(`schedules/${encodeURIComponent(scheduleId)}/times`, { auth: true }, getToken);
}

// --- OpenTripPlanner (trip planning) ---

/**
 * GET /otp/plan?fromLat=&fromLon=&toLat=&toLon=&date=&time=&arriveBy=
 * Returns OTP plan response: { plan: { itineraries: [...] } }
 */
export async function planTrip({ fromLat, fromLon, toLat, toLon, date, time, arriveBy }) {
  const params = new URLSearchParams({
    fromLat: String(fromLat),
    fromLon: String(fromLon),
    toLat: String(toLat),
    toLon: String(toLon),
  });
  if (date) params.set("date", date);
  if (time) params.set("time", time);
  if (arriveBy != null) params.set("arriveBy", arriveBy ? "true" : "false");
  return api(`otp/plan?${params.toString()}`);
}

/** GET /otp/health - check if OTP is reachable */
export async function getOtpHealth() {
  return api("otp/health");
}
