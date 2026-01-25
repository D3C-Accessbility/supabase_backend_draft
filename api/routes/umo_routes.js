const express = require('express');
const { umoiqFetch } = require('../lib/umoiq');

const router = express.Router();
const AGENCY = "unitrans";

// GET /umo_routes/agency - get Unitrans agency info
router.get('/agency', async (req, res) => {
  try {
    const agencies = await umoiqFetch("/agencies");

    const unitrans = agencies.find(
      (a) =>
        a.name.toLowerCase().includes("unitrans") ||
        a.name.toLowerCase().includes("davis")
    );

    if (!unitrans) {
      return res.status(404).json({ error: "Unitrans agency not found" });
    }

    res.json(unitrans);
  } catch (error) {
    console.error("Error fetching agency:", error);
    res.status(500).json({ error: "Failed to fetch agency information" });
  }
});

// GET /umo_routes/routes - get all routes for Unitrans
router.get('/routes', async (req, res) => {
  try {
    const routes = await umoiqFetch(`/agencies/${AGENCY}/routes`);
    res.json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// GET /umo_routes/predictions?stop=STOP_ID - get predictions for a stop
router.get('/predictions', async (req, res) => {
  const { stop } = req.query;

  if (!stop) {
    return res.status(400).json({ error: "Missing stop parameter" });
  }

  try {
    const data = await umoiqFetch(
      `/agencies/${AGENCY}/stops/${stop}/predictions`
    );

    // Convert predictions to frontend-friendly format
    const predictions = data.map((p) => ({
      route: p.routeId || p.route || "Unknown",
      minutes: p.minutes ?? "?",
      vehicleId: p.vehicleId ?? null,
      occupancy: p.occupancy ?? null,
    }));

    res.json(predictions);
  } catch (error) {
    console.error("UmoIQ predictions error:", error);
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
});

// GET /umo_routes/stops/search?query=SEARCH_TERM - search stops by name
router.get('/stops/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    // 1. Fetch all routes
    const routes = await umoiqFetch(`/agencies/${AGENCY}/routes`);

    const matches = [];

    // 2. Loop through routes and collect matching stops
    for (const route of routes) {
      const stops = await umoiqFetch(
        `/agencies/${AGENCY}/routes/${route.id}/stops`
      );

      for (const stop of stops) {
        if (
          stop.name?.toLowerCase().includes(query.toLowerCase())
        ) {
          matches.push({
            id: stop.id,
            name: stop.name,
            route: route.id,
          });
        }
      }
    }

    // Limit results to 10
    res.json(matches.slice(0, 10));
  } catch (error) {
    console.error("Error searching stops:", error);
    res.status(500).json({ error: "Failed to search stops" });
  }
});

module.exports = router;