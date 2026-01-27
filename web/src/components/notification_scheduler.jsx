import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export default function NotificationScheduler() {
  const [session, setSession] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    origin_stop_id: '',
    route_id: '',
    direction_id: '',
    notify_lead_time_min: 10,
    depart_time_local: '',
    days: []
  });
  const [submitting, setSubmitting] = useState(false);
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchSchedules();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchSchedules();
      } else {
        setSchedules([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('http://localhost:3000/schedules', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const nextDays = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days: nextDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Reset form and refetch schedules
        setFormData({
          title: '',
          origin_stop_id: '',
          route_id: '',
          direction_id: '',
          notify_lead_time_min: 10,
          depart_time_local: '',
          days: []
        });
        fetchSchedules();
      } else {
        console.error('Error creating schedule');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const response = await fetch(`http://localhost:3000/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`
        }
      });

      if (response.ok) {
        fetchSchedules();
      } else {
        console.error('Error deleting schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  if (loading) {
    return <div>Loading schedules...</div>;
  }

  if (!session) {
    return <div>Please log in to view and manage notifications.</div>;
  }

  return (
    <div>
      <h2>Notification Scheduler</h2>
      <p>User: {session.user.email}</p>

      <h3>Create New Schedule</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Origin Stop ID:</label>
          <input
            type="text"
            name="origin_stop_id"
            value={formData.origin_stop_id}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Route ID:</label>
          <input
            type="text"
            name="route_id"
            value={formData.route_id}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Direction ID:</label>
          <input
            type="text"
            name="direction_id"
            value={formData.direction_id}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Notify Lead Time (minutes):</label>
          <input
            type="number"
            name="notify_lead_time_min"
            value={formData.notify_lead_time_min}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Depart Time (local):</label>
          <input
            type="time"
            name="depart_time_local"
            value={formData.depart_time_local}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Days:</label>
          <div>
            {dayOptions.map(day => (
              <label key={day} style={{ marginRight: '10px' }}>
                <input
                  type="checkbox"
                  checked={formData.days.includes(day)}
                  onChange={() => handleDayToggle(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Schedule'}
        </button>
      </form>

      <h3>Your Schedules</h3>
      {schedules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <ul>
          {schedules.map((schedule) => (
            <li key={schedule.id} style={{ marginBottom: '10px' }}>
              <strong>{schedule.title}</strong> - Stop: {schedule.origin_stop_id}, Route: {schedule.route_id}, Notify: {schedule.notify_lead_time_min} min
              <button onClick={() => handleDelete(schedule.id)} style={{ marginLeft: '10px' }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
