import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header style={{ backgroundColor: "#f0f0f0", padding: "10px", marginBottom: "20px" }}>
      <nav>
        <Link to="/" style={{ marginRight: "20px" }}>Home</Link>
        <Link to="/routes" style={{ marginRight: "20px" }}>Routes</Link>
        <Link to="/stops" style={{ marginRight: "20px" }}>Stops</Link>
        <Link to="/arrivals" style={{ marginRight: "20px" }}>Arrivals</Link>
        <Link to="/notifications" style={{ marginRight: "20px" }}>Schedules</Link>
        <Link to="/auth">Auth</Link>
      </nav>
    </header>
  );
}
