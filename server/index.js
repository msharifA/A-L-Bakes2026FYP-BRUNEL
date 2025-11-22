import express from "express";
import cors from "cors";
import pkg from "./package.json" assert { type: "json" }; // ← change to ./package.json

const app = express();

const CF_ORIGIN = "https://dizqgvrbhxb2t.cloudfront.net";
app.use(cors({ origin: CF_ORIGIN, credentials: true }));

const health = (req, res) => res.status(200).send("OK");
const version = (req, res) => res.json({ version: pkg.version });
const dbPing = async (_req, res) => {
  try {
    res.json({ db: "up" });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  }
};

const api = express.Router();
api.get("/health", health);
api.get("/version", version);
api.get("/db-ping", dbPing);
app.use("/api", api);

// keep legacy for now
app.get("/health", health);
app.get("/version", version);
app.get("/db-ping", dbPing);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`API listening on ${PORT}`));
