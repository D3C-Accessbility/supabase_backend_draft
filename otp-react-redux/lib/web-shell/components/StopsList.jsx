/**
 * Stops: search by name and/or filter by route.
 * - Search: GET /umo_routes/stops/search?query=
 * - Filter by route: GET /umo_routes/routes/:route/stops
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRoutes, getStopsByRoute, searchStops } from "../lib/unitransApi.js";

export default function StopsList() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load routes once for dropdown
  useEffect(() => {
    let cancelled = false;
    getRoutes()
      .then((data) => {
        if (!cancelled) setRoutes(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load stops: either by route selection or by search
  const loadStops = useCallback(() => {
    setError("");
    if (searchQuery.trim()) {
      setLoading(true);
      searchStops(searchQuery)
        .then((data) => setStops(Array.isArray(data) ? data : []))
        .catch((err) => setError(err.message || "Search failed."))
        .finally(() => setLoading(false));
      return;
    }
    if (selectedRouteId) {
      setLoading(true);
      getStopsByRoute(selectedRouteId)
        .then((data) => setStops(Array.isArray(data) ? data : []))
        .catch((err) => setError(err.message || "Failed to load stops."))
        .finally(() => setLoading(false));
      return;
    }
    setStops([]);
  }, [searchQuery, selectedRouteId]);

  // When route selection changes, load stops for that route
  useEffect(() => {
    if (selectedRouteId && !searchQuery.trim()) {
      setLoading(true);
      getStopsByRoute(selectedRouteId)
        .then((data) => setStops(Array.isArray(data) ? data : []))
        .catch((err) => setError(err.message || "Failed to load stops."))
        .finally(() => setLoading(false));
    } else if (!searchQuery.trim()) {
      setStops([]);
    }
  }, [selectedRouteId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h2>Stops</h2>
      <div>
        <label>Filter by route: </label>
        <select
          value={selectedRouteId}
          onChange={(e) => {
            setSelectedRouteId(e.target.value);
            setSearchQuery("");
          }}
        >
          <option value="">-- Select route --</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id ?? ""}>
              {r.title ?? r.id ?? "Unknown"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Search by name: </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Stop name"
        />
        <button type="button" onClick={loadStops} disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>
      {error && <div>Error: {error}</div>}
      {loading && <div>Loading...</div>}
      {!loading && (
        <>
          {stops.length === 0 ? (
            <p>Select a route or search by stop name.</p>
          ) : (
            <ul>
              {stops.map((s) => (
                <li key={`${s.id}-${s.route ?? "x"}`}>
                  <Link
                    to={`/stops/${encodeURIComponent(s.id)}${s.route ? `?route=${encodeURIComponent(s.route)}` : ""}`}
                  >
                    {s.name ?? s.id ?? "Unknown"}
                  </Link>
                  {s.code != null && <span> (Code: {s.code})</span>}
                  {s.route != null && <span> — Route: {s.route}</span>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
