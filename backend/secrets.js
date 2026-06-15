// secrets.js — Loads all credentials from AWS Secrets Manager at startup.
// Called FIRST in server.js before any other require() that reads process.env.
//
// Why Secrets Manager instead of .env?
//   - No credentials stored on disk
//   - Supports automatic rotation
//   - Access controlled by IAM (BackendEC2Role) — no hardcoded AWS keys needed
//   - Audit trail of every secret access in CloudTrail

const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

async function getSecret(secretName) {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString);
}

async function loadSecrets() {
  try {
    const [dbSecret, jwtSecret] = await Promise.all([
      getSecret('taskapp/db'),   // { host, port, dbname, username, password }
      getSecret('taskapp/jwt'),  // { JWT_SECRET }
      // FRONTEND_URL is not a secret — it comes from .env instead
    ]);

    // Inject into process.env so the rest of the app (db.js, auth.js etc.)
    // reads process.env.DB_PASSWORD etc. as normal — no other files need changing.
    // Secrets are in memory only — never written to disk.
    process.env.DB_HOST     = dbSecret.host;
    process.env.DB_PORT     = dbSecret.port     || '3306';
    process.env.DB_NAME     = dbSecret.dbname   || 'appdb';
    process.env.DB_USER     = dbSecret.username;
    process.env.DB_PASSWORD = dbSecret.password;

    process.env.JWT_SECRET  = jwtSecret.JWT_SECRET;

    console.log('✅ Secrets loaded from AWS Secrets Manager');
  } catch (err) {
    // Any failure here is fatal — the app cannot run without its credentials.
    // Common causes:
    //   - BackendEC2Role not attached to the EC2 instance
    //   - IAM policy missing secretsmanager:GetSecretValue for taskapp/*
    //   - Secret name mismatch (check exact names in Secrets Manager console)
    //   - NAT Gateway not configured (private subnet can't reach Secrets Manager API)
    console.error('❌ Failed to load secrets from AWS Secrets Manager:', err.message);
    process.exit(1);
  }
}

module.exports = { loadSecrets };
