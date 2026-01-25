require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

// basic healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// simple test endpoint for quick verification
app.get('/test', (req, res) => res.json({ message: 'Test OK' }));

// root
app.get('/', (req, res) => res.send('API running'));

// routes
const schedulesRouter = require('./routes/schedules');
app.use('/schedules', schedulesRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});