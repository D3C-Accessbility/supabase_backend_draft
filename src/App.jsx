import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function App() {
  const [email, setEmail] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e?.preventDefault?.();
    setError(null);
    setResults([]);
    if (!email.trim()) {
      setError("Enter an email address");
      return;
    }

    setLoading(true);
    try {
      // 1) Find user by email
      // perform a case-insensitive lookup so minor casing/whitespace won't fail
      const { data: user, error: userErr } = await supabase
        .from("app_user")
        .select("id,email,timezone")
        .ilike("email", email.trim())
        .maybeSingle();

      if (userErr) {
        // if multiple rows matched, provide a helpful debug listing
        if (userErr.message && userErr.message.includes("coerce")) {
          const { data: candidates } = await supabase.from("app_user").select("id,email").ilike("email", `%${email.trim()}%`).limit(20);
          setError(`Multiple or ambiguous users found. Candidates: ${JSON.stringify(candidates || [])}`);
          return;
        }
        setError(userErr.message ?? String(userErr));
        return;
      }

      if (!user) {
        setError("User not found (check exact email)");
        return;
      }

      // 2) Fetch schedules for user
      const { data: schedules, error: schedulesErr } = await supabase
        .from("ride_schedule")
        .select("id,title,origin_stop_id,route_id")
        .eq("user_id", user.id);

      if (schedulesErr) {
        setError(schedulesErr.message);
        return;
      }

      const scheduleIds = (schedules || []).map((s) => s.id).filter(Boolean);

      if (scheduleIds.length === 0) {
        setResults([]);
        return;
      }

      // 3) Fetch times for those schedules
      const { data: times, error: timesErr } = await supabase
        .from("rider_schedule_time")
        .select("schedule_id,day,depart_time_local")
        .in("schedule_id", scheduleIds);

      if (timesErr) {
        setError(timesErr.message);
        return;
      }

      // 4) Merge schedules and times into display rows
      const rows = [];
      for (const t of times || []) {
        const sched = (schedules || []).find((s) => s.id === t.schedule_id);
        if (!sched) continue;
        rows.push({
          schedule_id: t.schedule_id,
          day: t.day,
          depart_time_local: t.depart_time_local,
          origin_stop_id: sched.origin_stop_id,
          route_id: sched.route_id,
          title: sched.title,
        });
      }

      // sort by title then day
      rows.sort((a, b) => (a.title || "").localeCompare(b.title || "") || (a.day || "").localeCompare(b.day || ""));
      setResults(rows);
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Lookup schedules by user email</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
        <input
          placeholder="user01@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 8, width: 300 }}
        />
        <button style={{ marginLeft: 8, padding: "8px 12px" }} disabled={loading}>
          {loading ? "Loading…" : "Search"}
        </button>
      </form>

      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {results.length === 0 && !loading && !error && <div>No schedule rows to show.</div>}

      {results.length > 0 && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Title</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Day</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Depart Time</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Origin Stop ID</th>
              <th style={{ border: "1px solid #ddd", padding: 8 }}>Route ID</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={`${r.schedule_id}-${r.day}`}>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.title}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.day}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.depart_time_local}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.origin_stop_id}</td>
                <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.route_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;