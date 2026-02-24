/**
 * OpenTripPlanner proxy. Forwards plan and router requests to OTP (e.g. http://localhost:8080).
 * Requires OTP to be running with graph loaded (see README).
 */

const express = require("express");
const router = express.Router();

const OTP_BASE = process.env.OTP_URL || "http://localhost:8080";
const ROUTER_ID = process.env.OTP_ROUTER_ID || "default";

/**
 * GET /otp/plan
 * Query: fromLat, fromLon, toLat, toLon, date (YYYY-MM-DD), time (HH:mm), arriveBy (optional)
 * Proxies to OTP /otp/routers/{routerId}/plan
 */
router.get("/plan", async (req, res) => {
  const { fromLat, fromLon, toLat, toLon, date, time, arriveBy } = req.query;
  if (fromLat == null || fromLon == null || toLat == null || toLon == null) {
    return res.status(400).json({ error: "Missing fromLat, fromLon, toLat, or toLon" });
  }

  const fromPlace = `${Number(fromLat)},${Number(fromLon)}`;
  const toPlace = `${Number(toLat)},${Number(toLon)}`;

  const dateStr = date || new Date().toISOString().slice(0, 10);
  const timeStr = time || new Date().toTimeString().slice(0, 5);

  const params = new URLSearchParams({
    fromPlace,
    toPlace,
    date: dateStr,
    time: timeStr,
    mode: "WALK,TRANSIT",
    maxWalkDistance: "800",
    arriveBy: arriveBy === "true" ? "true" : "false",
  });

  const url = `${OTP_BASE}/otp/routers/${encodeURIComponent(ROUTER_ID)}/plan?${params.toString()}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data || { error: "OTP request failed" });
    }
    res.json(data);
  } catch (err) {
    console.error("OTP plan error:", err);
    res.status(502).json({ error: "Could not reach OpenTripPlanner. Is it running?" });
  }
});

/**
 * GET /otp/health - check if OTP router is up
 */
router.get("/health", async (req, res) => {
  const url = `${OTP_BASE}/otp/routers/${encodeURIComponent(ROUTER_ID)}`;
  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    res.json({ ok: response.ok, ...data });
  } catch (err) {
    res.status(502).json({ ok: false, error: "OTP unreachable" });
  }
});

module.exports = router;
