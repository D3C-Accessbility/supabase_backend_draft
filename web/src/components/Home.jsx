/**
 * Home: route planning card, in-page trip planning results, status pills, Buses Running Now.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { getRoutes, getStopsByRoute, getPredictionsNear, getRouteStopPredictions, planTrip } from "../lib/unitransApi.js";
import { decodePolyline } from "../lib/polyline.js";
import "../App.css";
import "leaflet/dist/leaflet.css";

const DAVIS_CENTER = [38.5449, -121.7405];

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length < 2) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, points]);
  return null;
}

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
  const [tripDate, setTripDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tripTime, setTripTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [plan, setPlan] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");
  const [selectedItineraryIndex, setSelectedItineraryIndex] = useState(0);
  const [bundles, setBundles] = useState([]);
  const [loadingBuses, setLoadingBuses] = useState(false);
  const [busesError, setBusesError] = useState("");
  const [selectedEstimateTime, setSelectedEstimateTime] = useState("");
  const [selectedDelayMinutes, setSelectedDelayMinutes] = useState(null);
  const [selectedDelayLoading, setSelectedDelayLoading] = useState(false);
  const [selectedDelayError, setSelectedDelayError] = useState("");

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

  const fromStopObj = boardingStops.find((s) => String(s.id) === String(boardingStop));
  const toStopObj = goingStops.find((s) => String(s.id) === String(goingStop));
  const fromLat = fromStopObj?.lat != null ? Number(fromStopObj.lat) : null;
  const fromLon = fromStopObj?.lon != null ? Number(fromStopObj.lon) : null;
  const toLat = toStopObj?.lat != null ? Number(toStopObj.lat) : null;
  const toLon = toStopObj?.lon != null ? Number(toStopObj.lon) : null;
  const fromCoords = fromLat != null && fromLon != null ? [fromLat, fromLon] : null;
  const toCoords = toLat != null && toLon != null ? [toLat, toLon] : null;

  const runPlan = useCallback(() => {
    if (fromLat == null || fromLon == null || toLat == null || toLon == null) {
      setPlanError("Select both origin and destination stops.");
      setPlan(null);
      return;
    }
    setPlanning(true);
    setPlanError("");
    setPlan(null);
    planTrip({
      fromLat,
      fromLon,
      toLat,
      toLon,
      date: tripDate,
      time: tripTime,
      arriveBy: false,
    })
      .then((data) => {
        const itineraries = data?.plan?.itineraries;
        if (!itineraries || itineraries.length === 0) {
          setPlanError("No itineraries found. Try different stops or time.");
          return;
        }
        setPlan(data);
        setSelectedItineraryIndex(0);
      })
      .catch((err) => setPlanError(err.message || "Trip plan failed."))
      .finally(() => setPlanning(false));
  }, [fromLat, fromLon, toLat, toLon, tripDate, tripTime]);

  const swapStops = () => {
    setBoardingRoute(goingRoute);
    setBoardingStops(goingStops);
    setBoardingStop(goingStop);
    setGoingRoute(boardingRoute);
    setGoingStops(boardingStops);
    setGoingStop(boardingStop);
    setPlan(null);
    setPlanError("");
  };

  const handleFindBuses = () => {
    const hasFromSelection = Boolean(boardingStop && boardingRoute);
    const hasToSelection = Boolean(goingStop && goingRoute && toLat != null && toLon != null);

    if (hasFromSelection && hasToSelection && fromLat != null && fromLon != null) {
      runPlan();
      return;
    }

    if (hasFromSelection) {
      navigate(`/stops/${encodeURIComponent(boardingStop)}?route=${encodeURIComponent(boardingRoute)}`);
    } else {
      setPlanError("Select at least a boarding stop to continue.");
      setPlan(null);
    }
  };

  const applyDateChoice = (choice) => {
    setDateChoice(choice);
    const now = new Date();
    if (choice === "TODAY") {
      setTripDate(now.toISOString().slice(0, 10));
      return;
    }
    if (choice === "TOMORROW") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setTripDate(tomorrow.toISOString().slice(0, 10));
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const itineraries = plan?.plan?.itineraries || [];
  const selected = itineraries[selectedItineraryIndex];
  const durationMin = selected?.duration ? Math.round(selected.duration / 60) : null;
  const selectedStart = (() => {
    if (selected?.startTime == null) return "";
    const numericValue = Number(selected.startTime);
    const date = Number.isFinite(numericValue) ? new Date(numericValue) : new Date(selected.startTime);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  })();
  const selectedEnd = (() => {
    if (selected?.endTime == null) return "";
    const numericValue = Number(selected.endTime);
    const date = Number.isFinite(numericValue) ? new Date(numericValue) : new Date(selected.endTime);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  })();
  const firstTransitLeg = (selected?.legs || []).find((leg) => leg?.mode && leg.mode !== "WALK");

  useEffect(() => {
    let cancelled = false;
    const routeId = firstTransitLeg?.route?.shortName || boardingRoute || "";
    const stopId = boardingStop || "";
    const scheduledStart = firstTransitLeg?.startTime ?? selected?.startTime ?? null;

    if (!selected || !routeId || !stopId || scheduledStart == null) {
      setSelectedEstimateTime("");
      setSelectedDelayMinutes(null);
      setSelectedDelayLoading(false);
      setSelectedDelayError("");
      return () => {
        cancelled = true;
      };
    }

    setSelectedDelayLoading(true);
    setSelectedDelayError("");
    getRouteStopPredictions(routeId, stopId)
      .then((data) => {
        if (cancelled) return;
        const predictions = Array.isArray(data)
          ? data.flatMap((bundle) => (Array.isArray(bundle?.predictions) ? bundle.predictions : []))
          : [];
        const minutes = predictions
          .map((prediction) => Number(prediction?.minutes))
          .filter((value) => Number.isFinite(value) && value >= 0);

        if (!minutes.length) {
          setSelectedEstimateTime("");
          setSelectedDelayMinutes(null);
          setSelectedDelayError("No live estimate for this itinerary.");
          return;
        }

        const nextMinutes = Math.min(...minutes);
        const estimatedDate = new Date(Date.now() + nextMinutes * 60 * 1000);
        const startNumeric = Number(scheduledStart);
        const scheduledDate = Number.isFinite(startNumeric) ? new Date(startNumeric) : new Date(scheduledStart);
        const hasScheduledDate = !Number.isNaN(scheduledDate.getTime());

        setSelectedEstimateTime(
          estimatedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
        );
        setSelectedDelayMinutes(
          hasScheduledDate ? Math.round((estimatedDate.getTime() - scheduledDate.getTime()) / (60 * 1000)) : null
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setSelectedEstimateTime("");
        setSelectedDelayMinutes(null);
        setSelectedDelayError(err.message || "Failed to fetch live delay.");
      })
      .finally(() => {
        if (!cancelled) setSelectedDelayLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, firstTransitLeg, boardingRoute, boardingStop]);

  const mapPoints = [];
  if (fromCoords) mapPoints.push(fromCoords);
  if (toCoords) mapPoints.push(toCoords);
  if (selected?.legs) {
    selected.legs.forEach((leg) => {
      const pts = leg.legGeometry?.points ? decodePolyline(leg.legGeometry.points) : [];
      pts.forEach((p) => mapPoints.push(p));
    });
  }
  if (toCoords) mapPoints.push(toCoords);

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
          onChange={(e) => {
            setBoardingRoute(e.target.value);
            setPlan(null);
            setPlanError("");
          }}
          aria-label="Route for boarding"
        >
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id ?? ""}>{r.title ?? r.id}</option>
          ))}
        </select>
        <select
          value={boardingStop}
          onChange={(e) => {
            setBoardingStop(e.target.value);
            setPlan(null);
            setPlanError("");
          }}
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
          onChange={(e) => {
            setGoingRoute(e.target.value);
            setPlan(null);
            setPlanError("");
          }}
          aria-label="Route for destination"
        >
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id ?? ""}>{r.title ?? r.id}</option>
          ))}
        </select>
        <select
          value={goingStop}
          onChange={(e) => {
            setGoingStop(e.target.value);
            setPlan(null);
            setPlanError("");
          }}
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
              onClick={() => applyDateChoice(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="date"
            value={tripDate}
            onChange={(e) => {
              setDateChoice("OTHER");
              setTripDate(e.target.value);
            }}
            aria-label="Trip date"
          />
          <input
            type="time"
            value={tripTime}
            onChange={(e) => setTripTime(e.target.value)}
            aria-label="Trip time"
          />
        </div>

        <button type="button" className="btn-find-buses" onClick={handleFindBuses}>
          <span>🚌</span> {planning ? "PLANNING..." : "FIND BUSES"}
        </button>
      </div>

      <div className="section-title">
        <span>Planned Trip</span>
      </div>

      {planning && <div className="page-loading">Planning trip...</div>}
      {planError && <div className="page-error">{planError}</div>}

      {plan && itineraries.length > 0 && (
        <>
          <div style={{ marginBottom: 12 }}>
            {itineraries.map((itin, i) => (
              <button
                key={i}
                type="button"
                className="eta-badge min"
                style={{ marginRight: 8, marginBottom: 8 }}
                onClick={() => setSelectedItineraryIndex(i)}
              >
                {i === selectedItineraryIndex ? "● " : ""}
                {Math.round(itin.duration / 60)} min
              </button>
            ))}
          </div>
          {selected && (
            <div className="bus-card" style={{ marginBottom: 12 }}>
              <div className="bus-card-body">
                <div className="bus-card-title">Trip · {durationMin} min</div>
                {(selectedStart || selectedEnd) && (
                  <div className="bus-card-meta" style={{ marginTop: 4 }}>
                    {selectedStart || "?"} - {selectedEnd || "?"}
                  </div>
                )}
                <div className="bus-card-meta" style={{ marginTop: 4 }}>
                  Estimated arrival: {selectedDelayLoading ? "Loading..." : selectedEstimateTime || "N/A"}
                </div>
                <div className="bus-card-meta" style={{ marginTop: 4 }}>
                  Delay: {selectedDelayLoading
                    ? "Loading..."
                    : selectedDelayMinutes == null
                      ? "N/A"
                      : selectedDelayMinutes === 0
                        ? "On time"
                        : selectedDelayMinutes > 0
                          ? `${selectedDelayMinutes} min late`
                          : `${Math.abs(selectedDelayMinutes)} min early`}
                </div>
                {!selectedDelayLoading && selectedDelayError && (
                  <div className="bus-card-meta" style={{ marginTop: 4 }}>
                    {selectedDelayError}
                  </div>
                )}
                {(selected.legs || []).map((leg, i) => (
                  <div key={i} className="bus-card-meta" style={{ marginTop: 4 }}>
                    {leg.mode === "WALK" ? "Walk" : leg.route?.shortName || leg.mode}
                    {leg.from?.name ? ` → ${leg.from.name}` : ""}
                    {leg.to?.name ? ` to ${leg.to.name}` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ height: 280, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 16 }}>
            <MapContainer
              center={DAVIS_CENTER}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {fromCoords && (
                <Marker
                  position={fromCoords}
                  icon={L.divIcon({
                    html: '<span style="background:#3b82f6;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">A</span>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })}
                >
                  <Popup>From</Popup>
                </Marker>
              )}
              {toCoords && (
                <Marker
                  position={toCoords}
                  icon={L.divIcon({
                    html: '<span style="background:#22c55e;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">B</span>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                  })}
                >
                  <Popup>To</Popup>
                </Marker>
              )}
              {selected?.legs?.map((leg, i) => {
                const pts = leg.legGeometry?.points ? decodePolyline(leg.legGeometry.points) : [];
                if (pts.length < 2) return null;
                return <Polyline key={i} positions={pts} color={leg.route?.color || "#3b82f6"} weight={4} />;
              })}
              <FitBounds points={mapPoints.length >= 2 ? mapPoints : null} />
            </MapContainer>
          </div>
        </>
      )}

      {!plan && !planning && !planError && (
        <div className="map-placeholder" style={{ marginBottom: 16 }}>
          Select from/to stops and click &quot;Find Buses&quot; to show trip options here.
        </div>
      )}

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
