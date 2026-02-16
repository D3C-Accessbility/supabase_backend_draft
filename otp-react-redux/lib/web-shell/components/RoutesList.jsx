/**
 * View all Unitrans routes.
 * Calls GET /umo_routes/routes, shows list with links to route detail.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRoutes } from "../lib/unitransApi.js";

export default function RoutesList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getRoutes()
      .then((data) => {
        if (!cancelled) setRoutes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load routes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div>Loading routes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Unitrans Routes</h2>
      {routes.length === 0 ? (
        <p>No routes found.</p>
      ) : (
        <ul>
          {routes.map((r) => (
            <li key={r.id}>
              <Link to={`/routes/${encodeURIComponent(r.id)}`}>
                {r.title ?? r.id ?? "Unknown"}
              </Link>
              {r.id != null && <span> (ID: {r.id})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
