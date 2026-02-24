/**
 * Stops: search destination, list results with link to stop detail.
 * Optional "Nearby" section with location + predictions. Map placeholder.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchStops, getPredictionsNear } from "../lib/unitransApi.js";
import "../App.css";

export default function StopsPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [nearbyBundles, setNearbyBundles] = useState([]);
  const [coords, setCoords] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState("");

  const runSearch = useCallback(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchStops(query.trim())
      .then((data) => setSearchResults(Array.isArray(data) ? data : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [query]);

  const requestNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setNearbyError("Location not supported.");
      return;
    }
    setNearbyLoading(true);
    setNearbyError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setCoords({ lat, lon });
        getPredictionsNear(lat, lon)
          .then((data) => setNearbyBundles(Array.isArray(data) ? data : []))
          .catch((err) => setNearbyError(err.message || "Failed to load."))
          .finally(() => setNearbyLoading(false));
      },
      () => {
        setNearbyError("Location denied.");
        setNearbyLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  // Build destination-style rows from nearby bundles (for "Live ETA" display)
  const nearbyRows = nearbyBundles.slice(0, 10).map((b) => {
    const routeId = b.route?.id ?? "?";
    const routeTitle = b.route?.title ?? routeId;
    const stopName = b.stop?.name ?? "Stop";
    const stopId = b.stop?.id;
    const preds = b.predictions || [];
    const mins = preds.map((p) => p.minutes).filter((m) => typeof m === "number" && Number.isFinite(m));
    const etaMin = mins.length ? Math.min(...mins) : null;
    const dir = preds[0]?.direction;
    const dest = dir?.destinationName ?? dir?.name ?? "";
    const delay = preds[0]?.delay;
    return { routeId, routeTitle, stopName, stopId, etaMin, dest, delay };
  });

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Find Stops</h2>

      <div className="search-bar">
        <span aria-hidden="true">🔍</span>
        <input
          type="search"
          placeholder="Search destination"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search destination"
        />
      </div>

      {searching && <div className="page-loading">Searching...</div>}

      {!searching && query.trim() && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Results</div>
          {searchResults.length === 0 ? (
            <p className="text-muted">No stops found.</p>
          ) : (
            searchResults.map((s) => (
              <Link
                key={`${s.id}-${s.route ?? ""}`}
                to={`/stops/${encodeURIComponent(s.id)}${s.route ? `?route=${encodeURIComponent(s.route)}` : ""}`}
                className="result-row"
                style={{ display: "flex", textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="result-row-icon"
                  style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                >
                  {String(s.route ?? "?")[0]}
                </div>
                <div className="result-row-body">
                  <div className="result-row-title">{s.name ?? s.id}</div>
                  <div className="result-row-sub">
                    {s.code && `Code: ${s.code}`} {s.route && `• Route ${s.route}`}
                  </div>
                  <div className="result-row-eta">View arrivals →</div>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            ))
          )}
        </div>
      )}

      <div className="section-title">Nearby arrivals</div>
      <button
        type="button"
        onClick={requestNearby}
        disabled={nearbyLoading}
        className="pill pill-blue"
        style={{ marginBottom: 12 }}
      >
        {coords ? "Refresh location" : "Use my location"}
      </button>
      {nearbyLoading && <div className="page-loading">Loading...</div>}
      {nearbyError && <div className="page-error">{nearbyError}</div>}
      {!nearbyLoading && !nearbyError && nearbyRows.length > 0 && (
        <div>
          {nearbyRows.map((row, i) => (
            <Link
              key={`${row.stopId}-${row.routeId}-${i}`}
              to={`/stops/${encodeURIComponent(row.stopId)}?route=${encodeURIComponent(row.routeId)}`}
              className="result-row"
              style={{ display: "flex", textDecoration: "none", color: "inherit" }}
            >
              <div
                className="result-row-icon"
                style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
              >
                {String(row.routeId)[0]}
              </div>
              <div className="result-row-body">
                <div className="result-row-title">{row.stopName}</div>
                <div className="result-row-sub">
                  {row.dest && `${row.dest}`}
                </div>
                <div className="result-row-eta">
                  Live ETA: {row.etaMin != null ? `${row.etaMin} min` : "—"}
                </div>
                {row.delay && (
                  <div className="delay-banner">
                    <span>⚠</span> Running {row.delay} min late
                  </div>
                )}
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      )}

      <div className="map-placeholder">Map (stop locations)</div>
    </div>
  );
}
