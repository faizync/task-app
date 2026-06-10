// server.js — Main entry point for the Express API
// Responsibilities:
//   1. Load secrets from AWS Secrets Manager (MUST be first)
//   2. Load non-secret env vars from .env
//   3. Configure Express (middleware, CORS, body parsing)
//   4. Mount route handlers
//   5. Initialize DB then start listening

const { loadSecrets } = require('./secrets'); // Must be required before dotenv

async function main() {
  // ─── STEP 1: LOAD SECRETS ──────────────────────────────────────────────────
  // Fetches DB credentials, JWT secret, and config from AWS Secrets Manager
  // and injects them into process.env BEFORE anything else runs.
  // Without this, DB_HOST, DB_PASSWORD, JWT_SECRET etc. would all be undefined.
  await loadSecrets();

  // ─── STEP 2: LOAD NON-SECRET CONFIG FROM .env ─────────────────────────────
  // .env only contains non-sensitive values: PORT, NODE_ENV, AWS_REGION, JWT_EXPIRES_IN
  // Credentials never go in .env — they come from Secrets Manager above.
  require('dotenv').config();

  const express = require('express');
  const cors = require('cors');
  const { initDB } = require('./db');

  const authRoutes = require('./routes/auth');
  const postRoutes = require('./routes/posts');

  const app = express();
  const PORT = process.env.PORT || 5000;

  // ─── MIDDLEWARE ─────────────────────────────────────────────────────────────

  // CORS — allows the React frontend (different origin) to call this API.
  // FRONTEND_URL is loaded from Secrets Manager (myapp/config).
  // No '*' fallback — if FRONTEND_URL is missing, CORS blocks all cross-origin
  // requests, which is the safe failure mode in production.
  if (!process.env.FRONTEND_URL) {
    console.error('❌ FRONTEND_URL is not set. Check myapp/config secret in Secrets Manager.');
    process.exit(1);
  }

  app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // Parse JSON request bodies (application/json)
  app.use(express.json());

  // Parse URL-encoded form data (application/x-www-form-urlencoded)
  app.use(express.urlencoded({ extended: true }));

  // ─── HEALTH CHECK ROUTE ─────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // ─── API ROUTES ─────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);

  // ─── 404 HANDLER ────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
  });

  // ─── GLOBAL ERROR HANDLER ───────────────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ message: 'Internal server error' });
  });

  // ─── START ──────────────────────────────────────────────────────────────────
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  });
}

main().catch(err => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
