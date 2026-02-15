import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./components/Home";
import Authentication from "./components/authentication";
import NotificationScheduler from "./components/notification_scheduler";
import ArrivalPredictions from "./components/arrival_predictions";
import RoutesList from "./components/RoutesList";
import RouteDetail from "./components/RouteDetail";
import StopsList from "./components/StopsList";
import StopDetail from "./components/StopDetail";
import Navigation from "./components/Navigation";

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Authentication />} />
        <Route path="/routes" element={<RoutesList />} />
        <Route path="/routes/:routeId" element={<RouteDetail />} />
        <Route path="/stops" element={<StopsList />} />
        <Route path="/stops/:stopId" element={<StopDetail />} />
        <Route path="/notifications" element={<NotificationScheduler />} />
        <Route path="/arrivals" element={<ArrivalPredictions />} />
        <Route path="/navigation" element={<Navigation />} />
      </Routes>
    </Router>
  );
}
