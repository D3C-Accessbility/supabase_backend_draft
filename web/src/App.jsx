import "./index.css";
<<<<<<< HEAD
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
=======
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Header from "./components/Header";
>>>>>>> c254d91526f7faaba863d6ee6f333a6b0829f464
import Home from "./components/Home";
import StopsPage from "./components/StopsPage";
import StopDetail from "./components/StopDetail";
import SchedulePage from "./components/SchedulePage";
import SettingsPage from "./components/SettingsPage";
import Authentication from "./components/authentication";
import NotificationScheduler from "./components/notification_scheduler";
import RoutesList from "./components/RoutesList";
import RouteDetail from "./components/RouteDetail";
<<<<<<< HEAD
=======
import StopsList from "./components/StopsList";
import StopDetail from "./components/StopDetail";
import Navigation from "./components/Navigation";
>>>>>>> c254d91526f7faaba863d6ee6f333a6b0829f464

export default function App() {
  return (
    <Router>
<<<<<<< HEAD
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
=======
      <Header />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/auth" component={Authentication} />
        <Route exact path="/routes" component={RoutesList} />
        <Route path="/routes/:routeId" component={RouteDetail} />
        <Route exact path="/stops" component={StopsList} />
        <Route path="/stops/:stopId" component={StopDetail} />
        <Route path="/notifications" component={NotificationScheduler} />
        <Route path="/arrivals" component={ArrivalPredictions} />
        <Route path="/navigation" component={Navigation} />
      </Switch>
>>>>>>> c254d91526f7faaba863d6ee6f333a6b0829f464
    </Router>
  );
}
