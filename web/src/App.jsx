import "./index.css";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import StopsPage from "./components/StopsPage";
import StopDetail from "./components/StopDetail";
import SchedulePage from "./components/SchedulePage";
import SettingsPage from "./components/SettingsPage";
import Authentication from "./components/authentication";
import NotificationScheduler from "./components/notification_scheduler";
import RoutesList from "./components/RoutesList";
import RouteDetail from "./components/RouteDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/stops" element={<StopsPage />} />
          <Route path="/stops/:stopId" element={<StopDetail />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationScheduler />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/routes" element={<RoutesList />} />
          <Route path="/routes/:routeId" element={<RouteDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}
