/**
 * Stop detail: show stop info and real-time arrivals.
 * GET /umo_routes/predictions?stop=ID&route=ROUTE (route from query if present).
 */
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getPredictionsByStop } from "../lib/unitransApi.js";

function formatMinutes(predictions) {
  const mins = (predictions || [])
    .map((p) => p.minutes)
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  return mins.length ? mins.slice(0, 5) : [];
}

export default function StopDetail() {
  const { stopId } = useParams();
  const [searchParams] = useSearchParams();
  const routeParam = searchParams.get("route") || null;

  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!stopId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getPredictionsByStop(stopId, routeParam)
      .then((data) => {
        if (!cancelled) setBundles(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load arrivals.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [stopId, routeParam]);

  if (loading) return <div>Loading arrivals...</div>;
  if (error) return <div>Error: {error}</div>;

  const stopName = bundles[0]?.stop?.name ?? stopId ?? "Unknown stop";

  return (
    <div>
      <h2>Stop: {stopName}</h2>
      <p><Link to="/stops">← Back to stops</Link></p>
      <p>Stop ID: {stopId}. {routeParam ? `Route: ${routeParam}` : "All routes."}</p>
      <h3>Real-time arrivals</h3>
      {bundles.length === 0 ? (
        <p>No predictions for this stop.</p>
      ) : (
        <ul>
          {bundles.map((b) => {
            const routeId = b.route?.id ?? "?";
            const dir = b.predictions?.[0]?.direction;
            const directionLabel = dir?.destinationName ?? dir?.name ?? "";
            const minutes = formatMinutes(b.predictions);
            return (
              <li key={`${routeId}-${b.stop?.id}`}>
                <strong>Route {routeId}</strong>
                {directionLabel && ` → ${directionLabel}`}
                {" "}
                {minutes.length ? `${minutes.join(", ")} min` : "No times"}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
