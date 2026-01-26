const express = require('express');
const { umoiqFetch } = require('../lib/umoiq');

const router = express.Router();
const AGENCY = "unitrans";

function normalizeRoutes(routes) {
  return routes.map((route) => ({
    id: route.id ?? null,
    title: route.title ?? route.id ?? "Unknown",
    color: route.color ?? null,
    textColor: route.textColor ?? null,
    hidden: route.hidden ?? false,
    timestamp: route.timestamp ?? null,
  }));
}

function normalizeStops(stops, routeId) {
  return stops.map((stop) => ({
    id: stop.id ?? null,
    name: stop.name ?? "Unknown",
    code: stop.code ?? null,
    lat: stop.lat ?? null,
    lon: stop.lon ?? null,
    hidden: stop.hidden ?? false,
    showDestinationSelector: stop.showDestinationSelector ?? false,
    directions: stop.directions ?? [],
    route: routeId ?? stop.route ?? null,
    timestamp: stop.timestamp ?? null,
  }));
}

function normalizePredictionBundles(bundles) {
  if (!Array.isArray(bundles)) {
    return [];
  }

  return bundles.map((bundle) => ({
    serverTimestamp: bundle.serverTimestamp ?? null,
    route: {
      id: bundle.route?.id ?? bundle.routeId ?? null,
      title: bundle.route?.title ?? null,
      color: bundle.route?.color ?? null,
      textColor: bundle.route?.textColor ?? null,
      hidden: bundle.route?.hidden ?? false,
    },
    stop: {
      id: bundle.stop?.id ?? null,
      name: bundle.stop?.name ?? "Unknown",
      code: bundle.stop?.code ?? null,
      lat: bundle.stop?.lat ?? null,
      lon: bundle.stop?.lon ?? null,
      hidden: bundle.stop?.hidden ?? false,
      showDestinationSelector: bundle.stop?.showDestinationSelector ?? false,
      route: bundle.stop?.route ?? bundle.route?.id ?? null,
    },
    predictions: (Array.isArray(bundle.values) ? bundle.values : []).map(
      (value) => ({
        timestamp: value.timestamp ?? null,
        minutes: value.minutes ?? null,
        isDeparture: value.isDeparture ?? value.departure ?? null,
        occupancyStatus: value.occupancyStatus ?? null,
        occupancyDescription: value.occupancyDescription ?? null,
        vehiclesInConsist: value.vehiclesInConsist ?? null,
        vehicleId: value.vehicleId ?? null,
        linkedVehicleIds: value.linkedVehicleIds ?? null,
        vehicleType: value.vehicleType ?? null,
        direction: {
          id: value.direction?.id ?? null,
          name: value.direction?.name ?? null,
          destinationName: value.direction?.destinationName ?? null,
        },
        tripId: value.tripId ?? null,
        delay: value.delay ?? null,
        affectedByLayover: value.affectedByLayover ?? null,
        predUsingNavigationTm: value.predUsingNavigationTm ?? null,
      })
    ),
  }));
}

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

    res.json({
      id: unitrans.id ?? null,
      name: unitrans.name ?? null,
      shortName: unitrans.shortName ?? null,
      website: unitrans.website ?? null,
      phone: unitrans.phone ?? null,
      timezone: unitrans.location?.timezone ?? unitrans.timezone ?? null,
      allowsStopCode: unitrans.allowsSelectionByStopCode ?? null,
      numberDigitsForStopCode: unitrans.numberDigitsForStopCode ?? null,
      scheduleUrl: unitrans.scheduleUrl ?? null,
      logo: unitrans.logo ?? null,
      rev: unitrans.rev ?? null,
      revTimestamp: unitrans.revTimestamp ?? null,
      blessedRev: unitrans.blessedRev ?? null,
      segtimesRev: unitrans.segtimesRev ?? null,
    });
  } catch (error) {
    console.error("Error fetching agency:", error);
    res.status(500).json({ error: "Failed to fetch agency information" });
  }
});

// GET /umo_routes/routes - get all routes for Unitrans
router.get('/routes', async (req, res) => {
  try {
    const routes = await umoiqFetch(`/agencies/${AGENCY}/routes`);
    res.json(normalizeRoutes(routes));
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// GET /umo_routes/routes/:route/stops - get all stops for a route
router.get('/routes/:route/stops', async (req, res) => {
  const { route } = req.params;

  if (!route) {
    return res.status(400).json({ error: "Missing route parameter" });
  }

  try {
    const stops = await umoiqFetch(
      `/agencies/${AGENCY}/routes/${encodeURIComponent(route)}/stops`
    );
    res.json(normalizeStops(stops, route));
  } catch (error) {
    console.error("Error fetching stops:", error);
    res.status(500).json({ error: "Failed to fetch stops" });
  }
});

// GET /umo_routes/predictions?stop=STOP_ID - get predictions for a stop
router.get('/predictions', async (req, res) => {
  const { stop, route } = req.query;

  if (!stop) {
    return res.status(400).json({ error: "Missing stop parameter" });
  }

  try {
    const path = route
      ? `/agencies/${AGENCY}/routes/${encodeURIComponent(route)}/stops/${encodeURIComponent(stop)}/predictions`
      : `/agencies/${AGENCY}/stops/${encodeURIComponent(stop)}/predictions`;
    const data = await umoiqFetch(path);
    res.json(normalizePredictionBundles(data));
  } catch (error) {
    console.error("UmoIQ predictions error:", error);
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
});

// GET /umo_routes/predictions/near?lat=LAT&lon=LON - get predictions near location
router.get('/predictions/near', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat or lon parameter" });
  }

  try {
    const data = await umoiqFetch(
      `/locations/${encodeURIComponent(lat)},${encodeURIComponent(lon)}/predictions`
    );
    res.json(normalizePredictionBundles(data));
  } catch (error) {
    console.error("UmoIQ nearby predictions error:", error);
    res.status(500).json({ error: "Failed to fetch nearby predictions" });
  }
});

// GET /umo_routes/stops/search?query=SEARCH_TERM - search stops by name
router.get('/stops/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    const routes = await umoiqFetch(`/agencies/${AGENCY}/routes`);
    const matches = [];

    for (const route of routes) {
      const stops = await umoiqFetch(
        `/agencies/${AGENCY}/routes/${route.id}/stops`
      );

      for (const stop of stops) {
        if (stop.name?.toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            id: stop.id ?? null,
            name: stop.name ?? "Unknown",
            code: stop.code ?? null,
            lat: stop.lat ?? null,
            lon: stop.lon ?? null,
            route: route.id ?? null,
          });
        }
      }
    }

    res.json(matches.slice(0, 10));
  } catch (error) {
    console.error("Error searching stops:", error);
    res.status(500).json({ error: "Failed to search stops" });
  }
});

module.exports = router;
