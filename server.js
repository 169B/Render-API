const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (adjust in production)
app.use(cors());
app.use(express.json());

// RobotEvents API configuration
const ROBOTEVENTS_API_BASE = 'https://www.robotevents.com/api/v2';
const API_TOKEN = process.env.ROBOTEVENTS_API_TOKEN;

// Middleware to add API token to requests
const robotEventsHeaders = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json'
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'VEX Robotics Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// Get team information
app.get('/api/teams/:teamNumber', async (req, res) => {
  try {
    const { teamNumber } = req.params;
    const response = await axios.get(
      `${ROBOTEVENTS_API_BASE}/teams`,
      {
        headers: robotEventsHeaders,
        params: { number: teamNumber }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching team:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch team data',
      details: error.response?.data || error.message
    });
  }
});

// Get upcoming events for a team
app.get('/api/teams/:teamNumber/events', async (req, res) => {
  try {
    const { teamNumber } = req.params;
    const { season, level, start } = req.query;
    
    // First, get the team ID
    const teamResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/teams`,
      {
        headers: robotEventsHeaders,
        params: { number: teamNumber }
      }
    );
    
    if (!teamResponse.data.data || teamResponse.data.data.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const teamId = teamResponse.data.data[0].id;
    
    // Get events for the team using the team-specific endpoint
    const params = { start: start || '2024-06-01' };
    if (season) params.season = season;
    if (level) params.level = level;
    
    const eventsResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/teams/${teamId}/events`,
      {
        headers: robotEventsHeaders,
        params
      }
    );
    
    // Filter for upcoming events and sort by date
    const now = new Date();
    const upcomingEvents = eventsResponse.data.data
      .filter(event => new Date(event.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
    
    res.json({
      ...eventsResponse.data,
      data: upcomingEvents
    });
  } catch (error) {
    console.error('Error fetching events:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch events',
      details: error.response?.data || error.message
    });
  }
});

// Get matches for a specific event and team
app.get('/api/events/:eventId/teams/:teamNumber/matches', async (req, res) => {
  try {
    const { eventId, teamNumber } = req.params;
    
    // Get team ID
    const teamResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/teams`,
      {
        headers: robotEventsHeaders,
        params: { number: teamNumber }
      }
    );
    
    if (!teamResponse.data.data || teamResponse.data.data.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const teamId = teamResponse.data.data[0].id;
    
    // Get matches
    const matchesResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events/${eventId}/divisions`,
      { headers: robotEventsHeaders }
    );
    
    // Get matches for each division
    const allMatches = [];
    for (const division of matchesResponse.data.data) {
      const divisionMatches = await axios.get(
        `${ROBOTEVENTS_API_BASE}/events/${eventId}/divisions/${division.id}/matches`,
        {
          headers: robotEventsHeaders,
          params: { team: teamId }
        }
      );
      allMatches.push(...divisionMatches.data.data);
    }
    
    // Sort matches by scheduled time
    allMatches.sort((a, b) => {
      if (!a.scheduled || !b.scheduled) return 0;
      return new Date(a.scheduled) - new Date(b.scheduled);
    });
    
    res.json({ data: allMatches });
  } catch (error) {
    console.error('Error fetching matches:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch matches',
      details: error.response?.data || error.message
    });
  }
});

// Get event details
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const response = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events/${eventId}`,
      { headers: robotEventsHeaders }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching event details:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch event details',
      details: error.response?.data || error.message
    });
  }
});

// Get event by SKU
app.get('/api/events/sku/:eventSku', async (req, res) => {
  try {
    const { eventSku } = req.params;
    const response = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events`,
      {
        headers: robotEventsHeaders,
        params: {
          'sku[]': eventSku,
          myEvents: false
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching event by SKU:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch event by SKU',
      details: error.response?.data || error.message
    });
  }
});

// Get team rankings at an event
app.get('/api/events/:eventId/teams/:teamNumber/rankings', async (req, res) => {
  try {
    const { eventId, teamNumber } = req.params;
    
    // Get team ID
    const teamResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/teams`,
      {
        headers: robotEventsHeaders,
        params: { number: teamNumber }
      }
    );
    
    if (!teamResponse.data.data || teamResponse.data.data.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const teamId = teamResponse.data.data[0].id;
    
    // Get rankings
    const response = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events/${eventId}/rankings`,
      {
        headers: robotEventsHeaders,
        params: { team: teamId }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching rankings:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch rankings',
      details: error.response?.data || error.message
    });
  }
});

// Get combined events for multiple teams
app.get('/api/teams/multiple', async (req, res) => {
  try {
    const { teams } = req.query;
    
    if (!teams) {
      return res.status(400).json({ error: 'Teams parameter is required (comma-separated team numbers)' });
    }
    
    const teamNumbers = teams.split(',').map(t => t.trim()).filter(t => t);
    
    if (teamNumbers.length === 0) {
      return res.status(400).json({ error: 'At least one team number must be provided' });
    }
    
    // Fetch events for all teams in parallel
    const teamEventsPromises = teamNumbers.map(async (teamNumber) => {
      try {
        // Get team ID
        const teamResponse = await axios.get(
          `${ROBOTEVENTS_API_BASE}/teams`,
          {
            headers: robotEventsHeaders,
            params: { number: teamNumber }
          }
        );
        
        if (!teamResponse.data.data || teamResponse.data.data.length === 0) {
          return { teamNumber, events: [] };
        }
        
        const teamId = teamResponse.data.data[0].id;
        
        // Get events for the team using the team-specific endpoint
        const eventsResponse = await axios.get(
          `${ROBOTEVENTS_API_BASE}/teams/${teamId}/events`,
          {
            headers: robotEventsHeaders,
            params: { start: '2024-06-01' }
          }
        );
        
        return { 
          teamNumber, 
          teamId,
          events: eventsResponse.data.data || [] 
        };
      } catch (error) {
        console.error(`Error fetching events for team ${teamNumber}:`, error.message);
        return { teamNumber, events: [] };
      }
    });
    
    const teamEventsResults = await Promise.all(teamEventsPromises);
    
    // Combine and deduplicate events
    const eventMap = new Map();
    
    teamEventsResults.forEach(({ teamNumber, events }) => {
      events.forEach(event => {
        if (eventMap.has(event.id)) {
          // Event already exists, add this team to the registered teams list
          eventMap.get(event.id).registeredTeams.push(teamNumber);
        } else {
          // New event, add it with this team
          eventMap.set(event.id, {
            ...event,
            registeredTeams: [teamNumber]
          });
        }
      });
    });
    
    // Convert to array and filter for upcoming events
    const now = new Date();
    const upcomingEvents = Array.from(eventMap.values())
      .filter(event => new Date(event.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
    
    res.json({
      data: upcomingEvents,
      meta: {
        totalTeams: teamNumbers.length,
        teams: teamNumbers,
        totalEvents: upcomingEvents.length
      }
    });
  } catch (error) {
    console.error('Error fetching multiple team events:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch events for multiple teams',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`VEX Robotics Dashboard API running on port ${PORT}`);
});
