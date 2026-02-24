/**
 * My Schedule: grid (Mon–Sun, 7am–9pm) and list view from /schedules API.
 * Requires auth; schedule times from getScheduleTimes.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../lib/supabase";
import { getSchedules, getScheduleTimes } from "../lib/unitransApi.js";
import "../App.css";

const DAYS_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function getToken() {
  return supabase.auth.getSession().then(({ data: { session } }) => session?.access_token ?? null);
}

function hourLabel(h) {
  if (h === 12) return "12 PM";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

export default function SchedulePage() {
  const [session, setSession] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [timesByScheduleId, setTimesByScheduleId] = useState({});
  const [view, setView] = useState("GRID");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setSchedules([]);
      setTimesByScheduleId({});
      setLoading(false);
      return;
    }
    try {
      const list = await getSchedules(getToken);
      const arr = Array.isArray(list) ? list : [];
      setSchedules(arr);
      const times = {};
      await Promise.all(
        arr.map(async (s) => {
          try {
            const t = await getScheduleTimes(s.id, getToken);
            times[s.id] = Array.isArray(t) ? t : [];
          } catch {
            times[s.id] = [];
          }
        })
      );
      setTimesByScheduleId(times);
    } catch (err) {
      setError(err.message || "Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAll();
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) fetchAll();
      else setSchedules([]), setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Build grid cells: for each (dayIndex, hour) we have a list of schedule titles
  const gridCells = {};
  DAYS_FULL.forEach((day, dayIdx) => {
    HOURS.forEach((hour) => {
      const key = `${dayIdx}-${hour}`;
      gridCells[key] = [];
      schedules.forEach((s) => {
        const times = timesByScheduleId[s.id] || [];
        const onDay = times.filter((t) => t.day === day);
        onDay.forEach((t) => {
          const depart = t.depart_time_local;
          if (!depart) return;
          const h = parseInt(depart.slice(0, 2), 10);
          if (h === hour) gridCells[key].push(s.title ?? "Trip");
        });
      });
    });
  });

  if (loading) return <div className="page-loading">Loading schedule...</div>;
  if (error) return <div className="page-error">{error}</div>;

  if (!session) {
    return (
      <div>
        <h2>My Schedule</h2>
        <p className="text-muted">Sign in to view and manage your schedule.</p>
        <Link to="/auth">Sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title" style={{ marginBottom: 8 }}>
        <span>MY SCHEDULE</span>
        <div className="view-toggle">
          <button
            type="button"
            className={view === "GRID" ? "active" : ""}
            onClick={() => setView("GRID")}
          >
            GRID
          </button>
          <button
            type="button"
            className={view === "LIST" ? "active" : ""}
            onClick={() => setView("LIST")}
          >
            LIST
          </button>
        </div>
      </div>

      {view === "GRID" && (
        <div className="schedule-grid-wrap">
          <table className="schedule-grid">
            <thead>
              <tr>
                <th className="time-col"></th>
                {DAYS_SHORT.map((d) => (
                  <th key={d}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="time-col">{hourLabel(hour)}</td>
                  {DAYS_FULL.map((day, dayIdx) => {
                    const key = `${dayIdx}-${hour}`;
                    const titles = gridCells[key] || [];
                    return (
                      <td key={key} className={titles.length ? "cell-busy" : ""}>
                        {titles.length ? titles.join(", ") : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "LIST" && (
        <div className="schedule-list">
          {schedules.length === 0 ? (
            <p className="text-muted">No schedules. Add one from notifications.</p>
          ) : (
            schedules.map((s) => {
              const times = timesByScheduleId[s.id] || [];
              return (
                <div key={s.id} className="schedule-list-item">
                  <strong>{s.title ?? "Trip"}</strong>
                  <span>
                    Route {s.route_id} • Stop {s.origin_stop_id} • Notify {s.notify_lead_time_min} min before
                  </span>
                  {times.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: "0.85rem" }}>
                      {times.map((t) => (
                        <span key={t.day} style={{ marginRight: 12 }}>
                          {t.day} {t.depart_time_local?.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Link to="/notifications">Edit</Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <p style={{ marginTop: 16 }}>
        <Link to="/notifications">Manage schedules & notifications →</Link>
      </p>
    </div>
  );
}
