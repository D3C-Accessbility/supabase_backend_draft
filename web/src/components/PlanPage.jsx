/**
 * Plan: OpenTripPlanner trip planning. From/to, date/time, plan button → itineraries + map.
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { getRoutes, getStopsByRoute, planTrip } from "../lib/unitransApi.js";
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

export default function PlanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateFrom = location.state?.from || null;
  const stateTo = location.state?.to || null;

  const [routes, setRoutes] = useState([]);
  const [fromRoute, setFromRoute] = useState(stateFrom?.routeId || "");
  const [fromStops, setFromStops] = useState([]);
  const [fromStop, setFromStop] = useState("");
  const [fromCoords, setFromCoords] = useState(stateFrom ? [stateFrom.lat, stateFrom.lon] : null);
  const [toRoute, setToRoute] = useState(stateTo?.routeId || "");
  const [toStops, setToStops] = useState([]);
  const [toStop, setToStop] = useState("");
  const [toCoords, setToCoords] = useState(stateTo ? [stateTo.lat, stateTo.lon] : null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedItineraryIndex, setSelectedItineraryIndex] = useState(0);

  useEffect(() => {
    getRoutes().then((d) => setRoutes(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!fromRoute) { setFromStops([]); setFromStop(""); setFromCoords(null); return; }
    getStopsByRoute(fromRoute).then((d) => {
      setFromStops(Array.isArray(d) ? d : []);
      setFromStop("");
      setFromCoords(null);
    });
  }, [fromRoute]);

  useEffect(() => {
    if (!toRoute) { setToStops([]); setToStop(""); setToCoords(null); return; }
    getStopsByRoute(toRoute).then((d) => {
      setToStops(Array.isArray(d) ? d : []);
      setToStop("");
      setToCoords(null);
    });
  }, [toRoute]);

  const handleFromStopChange = (e) => {
    const id = e.target.value;
    setFromStop(id);
    const s = fromStops.find((x) => String(x.id) === String(id));
    if (s && s.lat != null && s.lon != null) setFromCoords([Number(s.lat), Number(s.lon)]);
    else setFromCoords(null);
  };

  const handleToStopChange = (e) => {
    const id = e.target.value;
    setToStop(id);
    const s = toStops.find((x) => String(x.id) === String(id));
    if (s && s.lat != null && s.lon != null) setToCoords([Number(s.lat), Number(s.lon)]);
    else setToCoords(null);
  };

  const runPlan = useCallback(() => {
    if (!fromCoords || !toCoords) {
      setError("Select origin and destination stops.");
      return;
    }
    setLoading(true);
    setError("");
    setPlan(null);
    planTrip({
      fromLat: fromCoords[0],
      fromLon: fromCoords[1],
      toLat: toCoords[0],
      toLon: toCoords[1],
      date,
      time,
      arriveBy: false,
    })
      .then((data) => {
        const itineraries = data?.plan?.itineraries;
        if (!itineraries || itineraries.length === 0) {
          setError("No itineraries found. Try different stops or time.");
          return;
        }
        setPlan(data);
        setSelectedItineraryIndex(0);
      })
      .catch((err) => setError(err.message || "Trip plan failed."))
      .finally(() => setLoading(false));
  }, [fromCoords, toCoords, date, time]);

  // Pre-fill from state when coming from Home
  useEffect(() => {
    if (stateFrom && stateFrom.lat != null && stateFrom.lon != null && !fromCoords) {
      setFromCoords([stateFrom.lat, stateFrom.lon]);
    }
    if (stateTo && stateTo.lat != null && stateTo.lon != null && !toCoords) {
      setToCoords([stateTo.lat, stateTo.lon]);
    }
  }, [stateFrom, stateTo]);

  const itineraries = plan?.plan?.itineraries || [];
  const selected = itineraries[selectedItineraryIndex];
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

  const durationMin = selected?.duration ? Math.round(selected.duration / 60) : null;

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Plan trip</h2>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Choose origin and destination stops, then plan with OpenTripPlanner.
      </p>

      <div className="gradient-card" style={{ marginBottom: 16 }}>
        <label>FROM</label>
        <select value={fromRoute} onChange={(e) => setFromRoute(e.target.value)} aria-label="From route">
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id ?? ""}>{r.title ?? r.id}</option>
          ))}
        </select>
        <select value={fromStop} onChange={handleFromStopChange} aria-label="From stop">
          <option value="">Select stop</option>
          {fromStops.map((s) => (
            <option key={s.id} value={s.id ?? ""}>{s.name ?? s.id}</option>
          ))}
        </select>
        <label>TO</label>
        <select value={toRoute} onChange={(e) => setToRoute(e.target.value)} aria-label="To route">
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id ?? ""}>{r.title ?? r.id}</option>
          ))}
        </select>
        <select value={toStop} onChange={handleToStopChange} aria-label="To stop">
          <option value="">Select stop</option>
          {toStops.map((s) => (
            <option key={s.id} value={s.id ?? ""}>{s.name ?? s.id}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button
          type="button"
          className="btn-find-buses"
          onClick={runPlan}
          disabled={loading || !fromCoords || !toCoords}
          style={{ marginTop: 12 }}
        >
          {loading ? "Planning…" : "Find trip"}
        </button>
      </div>

      {error && <div className="page-error">{error}</div>}

      {plan && itineraries.length > 0 && (
        <>
          <div className="section-title">Itineraries</div>
          <div style={{ marginBottom: 12 }}>
            {itineraries.map((itin, i) => (
              <button
                key={i}
                type="button"
                className={`eta-badge min`}
                style={{ marginRight: 8, marginBottom: 8 }}
                onClick={() => setSelectedItineraryIndex(i)}
              >
                {i === selectedItineraryIndex ? "● " : ""}
                {Math.round(itin.duration / 60)} min
              </button>
            ))}
          </div>
          {selected && (
            <div className="bus-card" style={{ marginBottom: 16 }}>
              <div className="bus-card-body">
                <div className="bus-card-title">Trip · {durationMin} min</div>
                {(selected.legs || []).map((leg, i) => (
                  <div key={i} className="bus-card-meta" style={{ marginTop: 4 }}>
                    {leg.mode === "WALK" ? "Walk" : leg.route?.shortName || leg.mode} {leg.from?.name && `→ ${leg.from.name}`}
                    {leg.to?.name && ` to ${leg.to.name}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="section-title">Map</div>
          <div style={{ height: 280, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
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

      {!plan && !loading && (
        <div className="map-placeholder" style={{ marginTop: 16 }}>
          Select from/to stops and click &quot;Find trip&quot; to see route on map.
        </div>
      )}
    </div>
  );
}
