import "./index.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
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
    </Router>
  );
}
