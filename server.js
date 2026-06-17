const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

const app      = express();
const PORT     = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Serve the front-end
app.use(express.static(path.join(__dirname, "public")));

// GET /api/data — return saved roadmap state
app.get("/api/data", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    return res.json({ teams: null, cols: [] });
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    res.json(JSON.parse(raw));
  } catch (e) {
    res.status(500).json({ error: "Failed to read data" });
  }
});

// POST /api/data — save roadmap state
app.post("/api/data", (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save data" });
  }
});

app.listen(PORT, () => {
  console.log(`Roadmap server running on port ${PORT}`);
});
