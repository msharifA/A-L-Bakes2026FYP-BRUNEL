import express from "express";
import pkg from "pg";
const { Client } = pkg;

const app = express();

app.get("/health", (_, res) => res.status(200).send("ok"));
app.get("/version", (_, res) => {
    res.json({ tag: process.env.IMAGE_TAG || "unknown", time: new Date().toISOString() });
  });

app.get("/db-ping", async (_, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DB_SSL === "true" ||
      (process.env.DATABASE_URL || "").includes("rds.amazonaws.com")
        ? { rejectUnauthorized: false }
        : false,
  });
  try {
    await client.connect();
    const r = await client.query("SELECT 1 AS ok");
    res.json({ db: "up", result: r.rows[0] });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  } finally {
    await client.end();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
