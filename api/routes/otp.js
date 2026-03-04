/**
 * OpenTripPlanner proxy. Forwards plan and router requests to OTP (e.g. http://localhost:8080).
 * Requires OTP to be running with graph loaded (see README).
 */

const express = require("express");
const router = express.Router();

const OTP_BASE = process.env.OTP_URL || "http://localhost:9080";
const ROUTER_ID = process.env.OTP_ROUTER_ID || "default";
const OTP_GRAPHQL_URL = `${OTP_BASE}/otp/routers/${encodeURIComponent(ROUTER_ID)}/index/graphql`;

const PLAN_QUERY = `
  query Plan(
    $fromLat: Float!
    $fromLon: Float!
    $toLat: Float!
    $toLon: Float!
    $date: String!
    $time: String!
    $arriveBy: Boolean!
  ) {
    plan(
      from: { lat: $fromLat, lon: $fromLon }
      to: { lat: $toLat, lon: $toLon }
      date: $date
      time: $time
      arriveBy: $arriveBy
      transportModes: [{ mode: WALK }, { mode: TRANSIT }]
    ) {
      itineraries {
        duration
        startTime
        endTime
        walkDistance
        legs {
          mode
          startTime
          endTime
          from {
            name
            lat
            lon
            departureTime
            arrivalTime
          }
          to {
            name
            lat
            lon
            departureTime
            arrivalTime
          }
          route {
            gtfsId
            longName
            shortName
          }
          legGeometry {
            points
          }
        }
      }
    }
  }
`;

const HEALTH_QUERY = `
  query Health {
    __typename
  }
`;

async function postOtpGraphql(query, variables = {}) {
  const response = await fetch(OTP_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    const err = new Error(`OTP returned non-JSON response (${response.status}).`);
    err.status = response.status;
    err.payload = raw;
    throw err;
  }

  if (!response.ok) {
    const msg = payload?.errors?.map((e) => e.message).filter(Boolean).join("; ");
    const err = new Error(msg || `OTP request failed (${response.status}).`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  if (payload?.errors?.length) {
    const msg = payload.errors.map((e) => e.message).filter(Boolean).join("; ");
    const err = new Error(msg || "OTP GraphQL error.");
    err.status = 502;
    err.payload = payload;
    throw err;
  }

  return payload;
}

/**
 * GET /otp/plan
 * Query: fromLat, fromLon, toLat, toLon, date (YYYY-MM-DD), time (HH:mm), arriveBy (optional)
 * Proxies to OTP GraphQL /otp/routers/{routerId}/index/graphql
 */
router.get("/plan", async (req, res) => {
  const { fromLat, fromLon, toLat, toLon, date, time, arriveBy } = req.query;
  if (fromLat == null || fromLon == null || toLat == null || toLon == null) {
    return res.status(400).json({ error: "Missing fromLat, fromLon, toLat, or toLon" });
  }

  const fromLatNum = Number(fromLat);
  const fromLonNum = Number(fromLon);
  const toLatNum = Number(toLat);
  const toLonNum = Number(toLon);
  if (![fromLatNum, fromLonNum, toLatNum, toLonNum].every(Number.isFinite)) {
    return res.status(400).json({ error: "Invalid coordinates. Expected numeric from/to lat/lon." });
  }

  const dateStr = date || new Date().toISOString().slice(0, 10);
  const timeStr = time || new Date().toTimeString().slice(0, 5);
  try {
    const variables = {
      fromLat: fromLatNum,
      fromLon: fromLonNum,
      toLat: toLatNum,
      toLon: toLonNum,
      date: dateStr,
      time: timeStr,
      arriveBy: arriveBy === "true",
    };
    const payload = await postOtpGraphql(PLAN_QUERY, variables);
    res.json({ plan: payload?.data?.plan || null });
  } catch (err) {
    console.error("OTP plan error:", err);
    res.status(err.status || 502).json({ error: err.message || "Could not reach OpenTripPlanner." });
  }
});

/**
 * GET /otp/health - check if OTP router is up
 */
router.get("/health", async (req, res) => {
  try {
    await postOtpGraphql(HEALTH_QUERY);
    res.json({ ok: true, routerId: ROUTER_ID, endpoint: OTP_GRAPHQL_URL });
  } catch (err) {
    res.status(err.status || 502).json({
      ok: false,
      routerId: ROUTER_ID,
      endpoint: OTP_GRAPHQL_URL,
      error: err.message || "OTP unreachable",
    });
  }
});

module.exports = router;
