import "./index.css";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import StopsPage from "./components/StopsPage";
import StopDetail from "./components/StopDetail";
import PlanPage from "./components/PlanPage";
import SchedulePage from "./components/SchedulePage";
import SettingsPage from "./components/SettingsPage";
import Authentication from "./components/authentication";
import NotificationScheduler from "./components/notification_scheduler";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/stops" element={<StopsPage />} />
          <Route path="/stops/:stopId" element={<StopDetail />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationScheduler />} />
        </Route>
      </Routes>
    </Router>
  );
}
