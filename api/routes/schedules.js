const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// Middleware to verify user
const verifyUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;  // Attach user to request
  next();
};

// Apply auth to all routes except seed (for testing)
router.use((req, res, next) => {
  if (req.path === '/seed' && req.method === 'POST') {
    return next();  // Skip auth for seed
  }
  verifyUser(req, res, next);
});

// CRUD for ride_schedule

// GET /schedules - get all schedules for the user
router.get('/', async (req, res) => { // works
  console.log('Fetching schedules for user:', req.user.id);
  const { data, error } = await supabase
    .from('ride_schedule')
    .select('*')
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Error fetching schedules:', error);
    return res.status(500).json({ error: error.message });
  }
  console.log('Fetched schedules:', data.length, 'items');
  res.json(data);
});

// POST /schedules - create a new schedule
router.post('/', async (req, res) => { // works
  const {
    title,
    origin_stop_id,
    route_id,
    direction_id,
    notify_lead_time_min,
    days,
    depart_time_local
  } = req.body;

  if (!Array.isArray(days) || days.length === 0) {
    return res.status(400).json({ error: 'days must be a non-empty array' });
  }

  console.log('RPC params:', {
    days,
    depart_time_local,
    daysType: typeof days,
    isArray: Array.isArray(days),
    dayTypes: days.map((d) => typeof d)
  });

  const { data, error } = await supabase.rpc('create_schedule_with_times', {
    p_user_id: req.user.id,
    p_title: title,
    p_origin_stop_id: origin_stop_id,
    p_route_id: route_id,
    p_direction_id: direction_id,
    p_notify_lead_time_min: notify_lead_time_min,
    p_days: days,
    p_depart_time_local: depart_time_local
  });

  if (error) {
    console.error('RPC error full:', error);
    return res.status(500).json({ error: error.message, details: error });
  }
  res.json({ id: data });
});

// GET /schedules/:id - get specific schedule
router.get('/:id', async (req, res) => { // works
  const { id } = req.params;

  const { data, error } = await supabase
    .from('ride_schedule')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: 'Not found' });
  res.json(data[0]);
});

// PUT /schedules/:id - update schedule
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    origin_stop_id,
    route_id,
    direction_id,
    notify_lead_time_min,
    days,
    depart_time_local
  } = req.body;

  const { data, error } = await supabase.rpc('update_schedule_with_times', {
    p_user_id: req.user.id,
    p_schedule_id: id,
    p_title: title,
    p_origin_stop_id: origin_stop_id,
    p_route_id: route_id,
    p_direction_id: direction_id,
    p_notify_lead_time_min: notify_lead_time_min,
    p_days: days,
    p_depart_time_local: depart_time_local
  });

  if (error) {
    console.error('RPC error full:', error);
    return res.status(500).json({ error: error.message, details: error });
  }

  res.json({ id: data });
});

// DELETE /schedules/:id - delete schedule
router.delete('/:id', async (req, res) => { // works
  const { id } = req.params;

  const { error } = await supabase
    .from('ride_schedule')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// CRUD for rider_schedule_time

// GET /schedules/:scheduleId/times - get times for schedule
router.get('/:scheduleId/times', async (req, res) => { // works
  const { scheduleId } = req.params;

  // Check if schedule belongs to user
  const { data: schedule } = await supabase
    .from('ride_schedule')
    .select('id')
    .eq('id', scheduleId)
    .eq('user_id', req.user.id);

  if (!schedule.length) return res.status(404).json({ error: 'Schedule not found' });

  const { data, error } = await supabase
    .from('rider_schedule_time')
    .select('*')
    .eq('schedule_id', scheduleId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /schedules/:scheduleId/times - add time
router.post('/:scheduleId/times', async (req, res) => { // works
  const { scheduleId } = req.params;
  const { day, depart_time_local } = req.body;

  // Check schedule
  const { data: schedule } = await supabase
    .from('ride_schedule')
    .select('id')
    .eq('id', scheduleId)
    .eq('user_id', req.user.id);

  if (!schedule.length) return res.status(404).json({ error: 'Schedule not found' });

  const { data, error } = await supabase
    .from('rider_schedule_time')
    .insert({
      schedule_id: scheduleId,
      day,
      depart_time_local
    })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// PUT /schedules/:scheduleId/times/:day - update time
router.put('/:scheduleId/times/:day', async (req, res) => { // works
  const { scheduleId, day } = req.params;
  const { depart_time_local } = req.body;

  // Check schedule
  const { data: schedule } = await supabase
    .from('ride_schedule')
    .select('id')
    .eq('id', scheduleId)
    .eq('user_id', req.user.id);

  if (!schedule.length) return res.status(404).json({ error: 'Schedule not found' });

  const { data, error } = await supabase
    .from('rider_schedule_time')
    .update({
      depart_time_local
    })
    .eq('schedule_id', scheduleId)
    .eq('day', day)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// DELETE /schedules/:scheduleId/times/:day - delete time
router.delete('/:scheduleId/times/:day', async (req, res) => { // works
  const { scheduleId, day } = req.params;

  // Check schedule
  const { data: schedule } = await supabase
    .from('ride_schedule')
    .select('id')
    .eq('id', scheduleId)
    .eq('user_id', req.user.id);

  if (!schedule.length) return res.status(404).json({ error: 'Schedule not found' });

  const { error } = await supabase
    .from('rider_schedule_time')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('day', day);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// Seed endpoint to insert example data
router.post('/seed', async (req, res) => { // works
  const hardcodedUserId = '3f8c0c1e-1b4a-4c1a-9e6f-001111111111'; // For seed only

  // Ensure user exists in app_user
  await supabase.from('app_user').upsert({
    id: hardcodedUserId,
    email: 'test@example.com'
  });

  const rideData = {
    user_id: hardcodedUserId,
    title: 'Go to Campus',
    origin_stop_id: '22273',
    route_id: 'A',
    direction_id: 'A_0_var0',
    notify_lead_time_min: 10
  };

  const { data: ride, error: rideError } = await supabase
    .from('ride_schedule')
    .insert(rideData)
    .select();

  if (rideError) return res.status(500).json({ error: rideError.message });

  const timeData = {
    schedule_id: ride[0].id,
    day: 'Monday',
    depart_time_local: '08:00:00'
  };

  const { data: time, error: timeError } = await supabase
    .from('rider_schedule_time')
    .insert(timeData)
    .select();

  if (timeError) return res.status(500).json({ error: timeError.message });

  res.json({ ride: ride[0], time: time[0] });
});

module.exports = router;
