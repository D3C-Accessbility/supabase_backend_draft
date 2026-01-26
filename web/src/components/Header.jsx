import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
      <nav>
        <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
        <Link to="/auth" style={{ marginRight: '20px' }}>Authentication</Link>
        <Link to="/notifications" style={{ marginRight: '20px' }}>Notifications</Link>
        <Link to="/arrivals">Arrivals</Link>
      </nav>
    </header>
  );
}
