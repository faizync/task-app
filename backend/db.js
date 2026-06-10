// db.js - Database connection pool using mysql2
// Why pool? Reuses connections instead of opening a new one per request.
// mysql2 is the modern, promise-based MySQL driver for Node.js.

const mysql = require('mysql2/promise');
const fs = require('fs');

// All process.env values here are populated by loadSecrets() in server.js
// before this module is ever required. Do NOT call require('dotenv') here —
// that already runs in server.js after secrets are loaded.

// RDS SSL certificate — download from AWS and place at this path on the server:
// wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
//      -O /home/ubuntu/certs/aws-rds-ca.pem
const rdsCert = fs.readFileSync('/home/ubuntu/certs/aws-rds-ca.pem');

// Create a connection pool.
// A pool holds multiple open connections.
// When a request comes in, it borrows one from the pool,
// uses it, then returns it — much faster than connecting each time.
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // RDS endpoint — set by loadSecrets()
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,          // Queue requests if all connections are busy
  connectionLimit: 10,               // Max simultaneous connections in the pool
  queueLimit: 0,                     // 0 = unlimited queue
  ssl: {
    rejectUnauthorized: true,        // Enforce valid RDS SSL certificate
    ca: rdsCert,                     // AWS RDS CA bundle
  }
});

// Initialize the database: create tables if they don't exist
async function initDB() {
  try {
    // Test the connection first
    const conn = await pool.getConnection();
    console.log('✅ Database connected successfully');
    conn.release(); // Always release back to pool

    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create posts table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT NOT NULL,
        title       VARCHAR(255) NOT NULL,
        content     TEXT NOT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1); // Kill the app — no point running without a DB
  }
}

module.exports = { pool, initDB };
