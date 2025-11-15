import express from "express";
import fetch from "node-fetch";

const app = express();
const API_KEY = process.env.ROBOT_EVENTS_API_KEY;

app.get("/events/:team", async (req, res) => {
  const url = `https://www.robotevents.com/api/v2/teams/${req.params.team}/events`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Accept": "application/json"
    }
  });

  const data = await response.json();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(data);
});

app.get("/", (req, res) => res.send("RobotEvents Proxy Running"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Proxy running"));
