/**
 * Real-time arrivals near user location.
 * Uses GET /umo_routes/predictions/near?lat=&lon= via unitransApi.
 * Loading and error states included.
 */
import { useEffect, useMemo, useState } from "react";
import { getPredictionsNear } from "../lib/unitransApi.js";

function formatUpdatedAt(date) {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getNextMinutes(predictions) {
  const mins = (predictions || [])
    .map((p) => p.minutes)
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  return mins.length ? Math.min(...mins) : null;
}

export default function ArrivalPredictions() {
  const [coords, setCoords] = useState(null);
  const [bundles, setBundles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const sortedBundles = useMemo(() => {
    return [...bundles]
      .map((b) => ({ ...b, nextMinutes: getNextMinutes(b.predictions || []) }))
      .sort((a, b) => {
        const aMin = a.nextMinutes ?? Number.POSITIVE_INFINITY;
        const bMin = b.nextMinutes ?? Number.POSITIVE_INFINITY;
        return aMin - bMin;
      });
  }, [bundles]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }
    setStatus("locating");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = { lat: position.coords.latitude, lon: position.coords.longitude };
        setCoords(nextCoords);
        fetchPredictions(nextCoords);
      },
      (geoError) => {
        setStatus("error");
        setError(geoError.message || "Unable to get location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const fetchPredictions = async (location) => {
    if (!location) return;
    setStatus("loading");
    setError("");
    try {
      const data = await getPredictionsNear(location.lat, location.lon);
      setBundles(Array.isArray(data) ? data : []);
      const timestamps = (Array.isArray(data) ? data : [])
        .map((b) => b.serverTimestamp)
        .filter((v) => typeof v === "number");
      setUpdatedAt(timestamps.length ? new Date(Math.max(...timestamps)) : new Date());
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Failed to fetch predictions.");
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div>
      <h2>Nearby departures</h2>
      <div>Updated: {updatedAt ? formatUpdatedAt(updatedAt) : "--"}</div>
      <button
        type="button"
        onClick={() => (coords ? fetchPredictions(coords) : requestLocation())}
        disabled={status === "locating" || status === "loading"}
      >
        {coords ? "Refresh" : "Use my location"}
      </button>
      {coords && (
        <div>Location: {coords.lat.toFixed(6)}, {coords.lon.toFixed(6)}</div>
      )}
      {status === "locating" && <div>Requesting your location...</div>}
      {status === "loading" && <div>Loading predictions...</div>}
      {error && <div>Error: {error}</div>}
      {status === "ready" && sortedBundles.length === 0 && (
        <div>No nearby arrivals found.</div>
      )}
      <div>
        {sortedBundles.map((bundle) => {
          const routeId = bundle.route?.id ?? "?";
          const stopName = bundle.stop?.name ?? "Unknown stop";
          const dir = bundle.predictions?.find(
            (p) => p.direction?.destinationName || p.direction?.name
          )?.direction ?? {};
          const directionLabel = dir.destinationName ?? dir.name ?? "";
          const minutes = (bundle.predictions || [])
            .map((p) => p.minutes)
            .filter((v) => typeof v === "number")
            .slice(0, 3);
          return (
            <div key={`${routeId}-${bundle.stop?.id}`}>
              <div>{stopName}</div>
              <div>Route: {routeId} {directionLabel && `→ ${directionLabel}`}</div>
              <div>{minutes.length ? minutes.map((m, i) => <span key={i}>{m} min </span>) : "No times"}</div>
              <hr />
            </div>
          );
        })}
      </div>
    </div>
  );
}
