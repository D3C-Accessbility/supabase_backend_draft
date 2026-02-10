/**
 * Home: entry links for core Unitrans features.
 * Optionally fetches agency info from backend (GET /umo_routes/agency).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAgency } from "../lib/unitransApi.js";

export default function Home() {
  const [agency, setAgency] = useState(null);
  const [agencyError, setAgencyError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAgency()
      .then((data) => {
        if (!cancelled) setAgency(data);
      })
      .catch(() => {
        if (!cancelled) setAgencyError("Could not load agency info.");
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h1>Welcome to Unitrans App</h1>
      {agency && <p>{agency.name ?? agency.shortName ?? "Unitrans"}</p>}
      {agencyError && <p>{agencyError}</p>}
      <ul>
        <li><Link to="/routes">View routes</Link></li>
        <li><Link to="/stops">View stops (search & filter)</Link></li>
        <li><Link to="/arrivals">Real-time arrivals (nearby)</Link></li>
        <li><Link to="/notifications">My schedules (notifications)</Link></li>
      </ul>
    </div>
  );
}
