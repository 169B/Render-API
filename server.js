import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const API_KEY = process.env.RE_API_KEY;

// Get upcoming events for a team
app.get("/api/teams/:team/events", async (req, res) => {
  const team = req.params.team;

  try {
    const url = `https://www.robotevents.com/api/v2/teams/${team}/events?myEvents=false&past=false&per_page=50`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get matches for a specific event
app.get("/api/events/:eventId/matches", async (req, res) => {
  const eventId = req.params.eventId;

  try {
    const url = `https://www.robotevents.com/api/v2/events/${eventId}/matches`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root test route
app.get("/", (req, res) => res.send("RobotEvents Proxy Operational ✔"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

