import "./index.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Authentication from './components/authentication';
import NotificationScheduler from './components/notification_scheduler';
import ArrivalPredictions from './components/arrival_predictions';

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Authentication />} />
        <Route path="/notifications" element={<NotificationScheduler />} />
        <Route path="/arrivals" element={<ArrivalPredictions />} />
      </Routes>
    </Router>
  );
}
