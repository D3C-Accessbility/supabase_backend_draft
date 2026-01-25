import "./index.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Authentication from './components/authentication';
import NotificationScheduler from './components/notification_scheduler';

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Authentication />} />
        <Route path="/notifications" element={<NotificationScheduler />} />
      </Routes>
    </Router>
  );
}