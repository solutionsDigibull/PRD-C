const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const aiRoutes = require('./routes/ai');
const supabase = require('./lib/supabase');

// Conditionally load project routes (requires supabase)
let projectRoutes;
try {
  projectRoutes = require('./routes/projects');
} catch (e) {
  console.log('Project routes not loaded:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes first — ensure they are never shadowed by static file serving
app.use('/api/ai', aiRoutes);
if (projectRoutes) {
  app.use('/api/projects', projectRoutes);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: process.env.AI_PROVIDER || 'openai',
    configured: !!(process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY),
    supabase: !!supabase
  });
});

// In production, serve React frontend build (after API routes)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// SPA fallback: serve index.html for any non-API route
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Bind to 0.0.0.0 so the server is reachable from outside the container
// (Coolify's reverse proxy connects via the container's network interface, not localhost)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 AI Provider: ${process.env.AI_PROVIDER || 'openai'}`);
});
