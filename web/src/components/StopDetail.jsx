/**
 * Stop detail: show stop info and real-time arrivals.
 * GET /umo_routes/predictions?stop=ID&route=ROUTE (route from query if present).
 */
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getPredictionsByStop } from "../lib/unitransApi.js";
import "../App.css";

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

  if (loading) return <div className="page-loading">Loading arrivals...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;

  const stopName = bundles[0]?.stop?.name ?? stopId ?? "Unknown stop";

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link to="/stops">← Back to stops</Link>
      </p>
      <h2 style={{ marginBottom: 4 }}>{stopName}</h2>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Stop ID: {stopId} {routeParam && `• Route ${routeParam}`}
      </p>
      <h3 style={{ marginBottom: 12 }}>Real-time arrivals</h3>
      {bundles.length === 0 ? (
        <p className="text-muted">No predictions for this stop.</p>
      ) : (
        <div>
          {bundles.map((b) => {
            const routeId = b.route?.id ?? "?";
            const routeColor = b.route?.color || "var(--accent)";
            const dir = b.predictions?.[0]?.direction;
            const directionLabel = dir?.destinationName ?? dir?.name ?? "";
            const minutes = formatMinutes(b.predictions);
            const nextMin = minutes.length ? Math.min(...minutes) : null;
            const isArriving = nextMin !== null && nextMin <= 1;
            return (
              <div key={`${routeId}-${b.stop?.id}`} className="bus-card">
                <div
                  className="bus-card-icon"
                  style={{ background: `${routeColor}22`, border: `2px solid ${routeColor}`, color: routeColor }}
                >
                  {routeId}
                </div>
                <div className="bus-card-body">
                  <div className="bus-card-title">Route {routeId}</div>
                  {directionLabel && <div className="bus-card-location">{directionLabel}</div>}
                  <div className="bus-card-meta">
                    <span className={`eta-badge ${isArriving ? "arriving" : "min"}`}>
                      {isArriving ? "ARRIVING" : minutes.length ? `${minutes.join(", ")} min` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
