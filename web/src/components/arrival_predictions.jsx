import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:3000";

function formatUpdatedAt(date) {
  if (!date) return "";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getNextMinutes(predictions) {
  const mins = predictions
    .map((prediction) => prediction.minutes)
    .filter((value) => typeof value === "number" && Number.isFinite(value));
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
      .map((bundle) => ({
        ...bundle,
        nextMinutes: getNextMinutes(bundle.predictions || []),
      }))
      .sort((a, b) => {
        const aMin = a.nextMinutes ?? Number.POSITIVE_INFINITY;
        const bMin = b.nextMinutes ?? Number.POSITIVE_INFINITY;
        return aMin - bMin;
      });
  }, [bundles]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this browser.");
      return;
    }

    setStatus("locating");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
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

  const fetchPredictions = async (location = coords) => {
    if (!location) return;
    setStatus("loading");
    setError("");

    try {
      const url = new URL("/umo_routes/predictions/near", API_BASE);
      const latFixed = Number(location.lat).toFixed(6);
      const lonFixed = Number(location.lon).toFixed(6);
      url.searchParams.set("lat", latFixed);
      url.searchParams.set("lon", lonFixed);
      console.log("[arrivals] requesting", url.toString());
      console.log(
        `curl -s "${API_BASE}/umo_routes/predictions/near?lat=${latFixed}&lon=${lonFixed}"`
      );

      const response = await fetch(url.toString());
      console.log("[arrivals] response status", response.status);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();
      console.log("[arrivals] response data", data);
      setBundles(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) {
        console.warn("[arrivals] non-array response", data);
      }

      const serverTimestamps = (Array.isArray(data) ? data : [])
        .map((bundle) => bundle.serverTimestamp)
        .filter((value) => typeof value === "number");
      console.log("[arrivals] server timestamps", serverTimestamps);
      const nextUpdatedAt = serverTimestamps.length
        ? new Date(Math.max(...serverTimestamps))
        : new Date();
      setUpdatedAt(nextUpdatedAt);
      setStatus("ready");
    } catch (fetchError) {
      console.error("[arrivals] fetch error", fetchError);
      setStatus("error");
      setError(fetchError.message || "Failed to fetch predictions.");
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div>
      <h2>Nearby Departures</h2>
      <div>
        Updated: {updatedAt ? formatUpdatedAt(updatedAt) : "--"}
      </div>
      <button
        type="button"
        onClick={() => (coords ? fetchPredictions(coords) : requestLocation())}
        disabled={status === "locating" || status === "loading"}
      >
        {coords ? "Refresh" : "Use my location"}
      </button>

      {coords && (
        <div>
          Location: {coords.lat.toFixed(6)}, {coords.lon.toFixed(6)}
        </div>
      )}

      {status === "locating" && <div>Requesting your location...</div>}
      {status === "loading" && <div>Loading predictions...</div>}
      {error && <div>{error}</div>}

      {status === "ready" && sortedBundles.length === 0 && (
        <div>No nearby arrivals found.</div>
      )}

      <div>
        {sortedBundles.map((bundle) => {
          const routeId = bundle.route?.id || "?";
          const stopName = bundle.stop?.name || "Unknown stop";
          const direction =
            bundle.predictions?.find(
              (prediction) =>
                prediction.direction?.destinationName ||
                prediction.direction?.name
            )?.direction || {};
          const directionLabel =
            direction.destinationName || direction.name || "";
          const minutes = (bundle.predictions || [])
            .map((prediction) => prediction.minutes)
            .filter((value) => typeof value === "number")
            .slice(0, 3);

          return (
            <div key={`${routeId}-${bundle.stop?.id}`}>
              <div>{stopName}</div>
              <div>Route: {routeId}</div>
              <div>Direction: {directionLabel || "Destination TBD"}</div>
              <div>Agency: Unitrans ASUCD/City of Davis</div>
              <div>
                {minutes.length
                  ? minutes.map((value, index) => (
                      <span key={`${routeId}-${index}`}>{value} min </span>
                    ))
                  : "No times"}
              </div>
              <hr />
            </div>
          );
        })}
      </div>
    </div>
  );
}
