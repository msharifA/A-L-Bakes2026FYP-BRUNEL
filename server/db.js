import pkg from "pg";
const { Pool } = pkg;

const ssl =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl
});
