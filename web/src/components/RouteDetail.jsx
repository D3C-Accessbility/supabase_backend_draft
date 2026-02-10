/**
 * Route detail page: show one route and its stops.
 * GET /umo_routes/routes/:route/stops. Links to stop detail for arrivals.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRoutes, getStopsByRoute } from "../lib/unitransApi.js";

export default function RouteDetail() {
  const { routeId } = useParams();
  const [routeInfo, setRouteInfo] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    // Resolve route title from list (backend doesn't have GET /routes/:id)
    getRoutes()
      .then((list) => {
        if (cancelled) return;
        const r = Array.isArray(list) ? list.find((x) => x.id === routeId) : null;
        setRouteInfo(r ?? { id: routeId, title: routeId });
        return getStopsByRoute(routeId);
      })
      .then((stopsData) => {
        if (cancelled) return;
        setStops(Array.isArray(stopsData) ? stopsData : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load route.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [routeId]);

  if (loading) return <div>Loading route...</div>;
  if (error) return <div>Error: {error}</div>;

  const title = routeInfo?.title ?? routeId;

  return (
    <div>
      <h2>Route: {title}</h2>
      <p><Link to="/routes">← Back to routes</Link></p>
      <h3>Stops</h3>
      {stops.length === 0 ? (
        <p>No stops for this route.</p>
      ) : (
        <ul>
          {stops.map((s) => (
            <li key={s.id}>
              <Link to={`/stops/${encodeURIComponent(s.id)}?route=${encodeURIComponent(routeId)}`}>
                {s.name ?? s.id ?? "Unknown"}
              </Link>
              {s.code != null && <span> (Code: {s.code})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
