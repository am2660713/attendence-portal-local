import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;
const databaseName = process.env.PGDATABASE || "attendance_app_local";

const client = new Client({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: "postgres",
  ssl: false,
});

const escapeIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

const createDatabase = async () => {
  await client.connect();
  const existsResult = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);

  if (existsResult.rowCount > 0) {
    console.log(`Database '${databaseName}' already exists.`);
    return;
  }

  await client.query(`CREATE DATABASE ${escapeIdentifier(databaseName)}`);
  console.log(`Database '${databaseName}' created successfully.`);
};

createDatabase()
  .catch((error) => {
    console.error("Failed to create local database:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
