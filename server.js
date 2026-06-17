const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const { Pool } = require("pg");

const app  = express();
const PORT = process.env.PORT || 3000;

// Use DATABASE_URL env var on Render, fallback to direct URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Init table on startup
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roadmap_state (
      id      INTEGER PRIMARY KEY DEFAULT 1,
      data    JSONB   NOT NULL,
      updated TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("DB ready");
}

// GET /api/data
app.get("/api/data", async (req, res) => {
  try {
    const result = await pool.query("SELECT data FROM roadmap_state WHERE id = 1");
    if (result.rows.length === 0) return res.json({ teams: null, cols: [] });
    res.json(result.rows[0].data);
  } catch (e) {
    console.error("GET error:", e.message);
    res.status(500).json({ error: "Failed to read data" });
  }
});

// POST /api/data
app.post("/api/data", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }
    await pool.query(`
      INSERT INTO roadmap_state (id, data, updated)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET data = $1, updated = NOW()
    `, [JSON.stringify(payload)]);
    res.json({ ok: true });
  } catch (e) {
    console.error("POST error:", e.message);
    res.status(500).json({ error: "Failed to save data" });
  }
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(e => {
  console.error("DB init failed:", e.message);
  process.exit(1);
});
