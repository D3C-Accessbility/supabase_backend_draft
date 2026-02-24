/**
 * Home: route planning card, status pills, Buses Running Now.
 * Boarding From / Going To use routes + stops; Find Buses shows arrivals for selected stop.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoutes, getStopsByRoute, getPredictionsNear } from "../lib/unitransApi.js";
import "../App.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Ready to ride this evening?";
}

export default function Home() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [boardingRoute, setBoardingRoute] = useState("");
  const [boardingStops, setBoardingStops] = useState([]);
  const [boardingStop, setBoardingStop] = useState("");
  const [goingRoute, setGoingRoute] = useState("");
  const [goingStops, setGoingStops] = useState([]);
  const [goingStop, setGoingStop] = useState("");
  const [dateChoice, setDateChoice] = useState("TODAY");
  const [bundles, setBundles] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loadingBuses, setLoadingBuses] = useState(false);
  const [busesError, setBusesError] = useState("");

  // Load routes once
  useEffect(() => {
    let c = false;
    getRoutes().then((data) => { if (!c) setRoutes(Array.isArray(data) ? data : []); });
    return () => { c = true; };
  }, []);

  // Load stops when route changes
  const loadStops = useCallback((routeId, setStops) => {
    if (!routeId) { setStops([]); return; }
    getStopsByRoute(routeId).then((data) => setStops(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    loadStops(boardingRoute, setBoardingStops);
    setBoardingStop("");
  }, [boardingRoute, loadStops]);

  useEffect(() => {
    loadStops(goingRoute, setGoingStops);
    setGoingStop("");
  }, [goingRoute, loadStops]);

  // Request location and fetch nearby predictions for "Buses Running Now"
  const loadNearbyBuses = useCallback(() => {
    if (!navigator.geolocation) {
      setBusesError("Location not supported.");
      return;
    }
    setLoadingBuses(true);
    setBusesError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        getPredictionsNear(lat, lon)
          .then((data) => setBundles(Array.isArray(data) ? data : []))
          .catch((err) => setBusesError(err.message || "Failed to load buses."))
          .finally(() => setLoadingBuses(false));
      },
      () => {
        setBusesError("Location denied.");
        setLoadingBuses(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    loadNearbyBuses();
  }, []);

  const swapStops = () => {
    setBoardingRoute(goingRoute);
    setBoardingStops(goingStops);
    setBoardingStop(goingStop);
    setGoingRoute(boardingRoute);
    setGoingStops(boardingStops);
    setGoingStop(boardingStop);
  };

  const handleFindBuses = () => {
    if (boardingStop && boardingRoute) {
      navigate(`/stops/${encodeURIComponent(boardingStop)}?route=${encodeURIComponent(boardingRoute)}`);
    } else {
      navigate("/stops");
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Build "Buses Running Now" list from bundles (one card per route+stop with next ETA)
  const busCards = bundles.slice(0, 8).map((b) => {
    const routeId = b.route?.id ?? "?";
    const stopId = b.stop?.id ?? "";
    const routeTitle = b.route?.title ?? routeId;
    const stopName = b.stop?.name ?? "Stop";
    const preds = b.predictions || [];
    const mins = preds.map((p) => p.minutes).filter((m) => typeof m === "number" && Number.isFinite(m));
    const nextMin = mins.length ? Math.min(...mins) : null;
    const isArriving = nextMin !== null && nextMin <= 1;
    const occupancy = preds[0]?.occupancyDescription ?? preds[0]?.occupancyStatus ?? null;
    const delay = preds[0]?.delay;
    const routeColor = b.route?.color || "#3b82f6";
    return {
      key: `${routeId}-${stopId}`,
      routeId,
      stopId,
      routeTitle,
      stopName,
      nextMin,
      isArriving,
      occupancy,
      delay,
      routeColor,
    };
  });

  return (
    <div>
      <div className="gradient-card">
        <div className="text-muted">LIVE • {timeStr}</div>
        <h2 style={{ margin: "8px 0 16px", fontSize: "1.25rem" }}>Hey Aggie! {getGreeting()}</h2>

        <label>BOARDING FROM</label>
        <select
          value={boardingRoute}
          onChange={(e) => setBoardingRoute(e.target.value)}
          aria-label="Route for boarding"
        >
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id ?? ""}>{r.title ?? r.id}</option>
          ))}
        </select>
        <select
          value={boardingStop}
          onChange={(e) => setBoardingStop(e.target.value)}
          aria-label="Stop for boarding"
        >
          <option value="">Where are you starting?</option>
          {boardingStops.map((s) => (
            <option key={s.id} value={s.id ?? ""}>{s.name ?? s.id}</option>
          ))}
        </select>

        <div className="swap-icon">
          <button type="button" onClick={swapStops} aria-label="Swap origin and destination">
            ⇅
          </button>
        </div>

        <label>GOING TO</label>
        <select
          value={goingRoute}
          onChange={(e) => setGoingRoute(e.target.value)}
          aria-label="Route for destination"
        >
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id ?? ""}>{r.title ?? r.id}</option>
          ))}
        </select>
        <select
          value={goingStop}
          onChange={(e) => setGoingStop(e.target.value)}
          aria-label="Destination stop"
        >
          <option value="">Where&apos;s your destination?</option>
          {goingStops.map((s) => (
            <option key={s.id} value={s.id ?? ""}>{s.name ?? s.id}</option>
          ))}
        </select>

        <div className="date-row">
          {["TODAY", "TOMORROW", "OTHER"].map((d) => (
            <button
              key={d}
              type="button"
              className={`date-btn ${dateChoice === d ? "active" : ""}`}
              onClick={() => setDateChoice(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <button type="button" className="btn-find-buses" onClick={handleFindBuses}>
          <span>🚌</span> FIND BUSES
        </button>
      </div>

      <div className="status-pills">
        <span className="pill pill-green">LIVE • {timeStr}</span>
        {busCards.length > 0 && (
          <span className="pill pill-green">
            {busCards[0].routeId}: {busCards[0].isArriving ? "Arriving" : `${busCards[0].nextMin} min`}
          </span>
        )}
        <span className="pill pill-blue">Clear</span>
      </div>

      <div className="section-title">
        <span>Buses Running Now</span>
        <span className="section-badge">{busCards.length} ACTIVE</span>
      </div>

      {loadingBuses && <div className="page-loading">Loading buses...</div>}
      {busesError && (
        <div className="page-error">
          {busesError}
          <button type="button" onClick={loadNearbyBuses} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      {!loadingBuses && !busesError && busCards.length === 0 && (
        <p className="text-muted">Enable location to see buses near you, or use Find Stops below.</p>
      )}

      {!loadingBuses && busCards.length > 0 && (
        <div>
          {busCards.map((card) => (
            <div
              key={card.key}
              className="bus-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/stops/${encodeURIComponent(card.stopId)}?route=${encodeURIComponent(card.routeId)}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/stops/${encodeURIComponent(card.stopId)}?route=${encodeURIComponent(card.routeId)}`)}
            >
              <div
                className="bus-card-icon"
                style={{ background: `${card.routeColor}22`, border: `2px solid ${card.routeColor}`, color: card.routeColor }}
              >
                {card.routeId}
              </div>
              <div className="bus-card-body">
                <div className="bus-card-title">
                  {card.routeTitle}
                  {card.delay && <span className="delay-badge">DELAYED</span>}
                </div>
                <div className="bus-card-location">At {card.stopName}</div>
                <div className="bus-card-meta">
                  <span className={`eta-badge ${card.isArriving ? "arriving" : "min"}`}>
                    {card.isArriving ? "ARRIVING" : `${card.nextMin} MIN`}
                  </span>
                  {card.occupancy && <span>👤 {card.occupancy}</span>}
                  {card.delay && <span className="delay-badge">+{card.delay} late</span>}
                </div>
              </div>
              <span aria-hidden="true">→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
