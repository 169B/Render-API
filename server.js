const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (adjust in production)
app.use(cors());
app.use(express.json());

// Serve only HTML dashboard files (not the entire directory)
app.get('/codepen-template.html', (req, res) => {
  res.sendFile(__dirname + '/codepen-template.html');
});

app.get('/multi-team-dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/multi-team-dashboard.html');
});

app.get('/advanced-dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/advanced-dashboard.html');
});

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
    


    // Filter for upcoming events and sort by date (include events happening today)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day
    const upcomingEvents = eventsResponse.data.data
      .filter(event => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
      })
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

    // Convert to array and filter for upcoming events (include events happening today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = Array.from(eventMap.values())
      .filter(event => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
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

// Get live rankings/leaderboard for an event
app.get('/api/events/:eventId/rankings', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const response = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events/${eventId}/rankings`,
      { headers: robotEventsHeaders }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching event rankings:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch event rankings',
      details: error.response?.data || error.message
    });
  }
});

// Get matches happening now or next (live matches)
app.get('/api/events/:eventId/matches/live', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get all divisions for the event
    const divisionsResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events/${eventId}/divisions`,
      { headers: robotEventsHeaders }
    );
    
    const allMatches = [];
    
    // Get matches for each division
    for (const division of divisionsResponse.data.data) {
      const matchesResponse = await axios.get(
        `${ROBOTEVENTS_API_BASE}/events/${eventId}/divisions/${division.id}/matches`,
        { headers: robotEventsHeaders }
      );
      allMatches.push(...matchesResponse.data.data);
    }
    
    const now = new Date();
    
    // Find matches that are currently happening or coming up next
    const liveMatches = allMatches.filter(match => {
      if (!match.scheduled) return false;
      const scheduled = new Date(match.scheduled);
      const matchEnd = new Date(scheduled.getTime() + 5 * 60000); // Assume 5 min per match
      return now >= scheduled && now <= matchEnd;
    });
    
    // Find next matches (within next 30 minutes)
    const upcomingMatches = allMatches.filter(match => {
      if (!match.scheduled) return false;
      const scheduled = new Date(match.scheduled);
      const timeDiff = scheduled - now;
      return timeDiff > 0 && timeDiff <= 30 * 60000; // Next 30 minutes
    }).sort((a, b) => new Date(a.scheduled) - new Date(b.scheduled));
    
    res.json({
      live: liveMatches,
      next: upcomingMatches.slice(0, 5), // Return up to 5 next matches
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching live matches:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch live matches',
      details: error.response?.data || error.message
    });
  }
});

// Calculate team statistics
app.get('/api/teams/:teamNumber/stats', async (req, res) => {
  try {
    const { teamNumber } = req.params;
    const { eventId } = req.query;
    
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
    
    if (!eventId) {
      return res.status(400).json({ error: 'eventId query parameter is required' });
    }
    
    // Get matches for the team at this event
    const divisionsResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events/${eventId}/divisions`,
      { headers: robotEventsHeaders }
    );
    
    const allMatches = [];
    for (const division of divisionsResponse.data.data) {
      const matchesResponse = await axios.get(
        `${ROBOTEVENTS_API_BASE}/events/${eventId}/divisions/${division.id}/matches`,
        {
          headers: robotEventsHeaders,
          params: { team: teamId }
        }
      );
      allMatches.push(...matchesResponse.data.data);
    }
    
    // Calculate statistics
    let wins = 0, losses = 0, ties = 0;
    let totalScore = 0;
    let matchesPlayed = 0;
    const scores = [];
    
    allMatches.forEach(match => {
      // Only count completed matches
      if (!match.started || !match.scored) return;
      
      matchesPlayed++;
      
      const teamAlliance = match.alliances.find(alliance => 
        alliance.teams.some(t => t.team.id === teamId)
      );
      
      if (!teamAlliance) return;
      
      const opponentAlliance = match.alliances.find(a => a.color !== teamAlliance.color);
      
      if (teamAlliance.score !== undefined) {
        totalScore += teamAlliance.score;
        scores.push(teamAlliance.score);
        
        if (opponentAlliance && opponentAlliance.score !== undefined) {
          if (teamAlliance.score > opponentAlliance.score) {
            wins++;
          } else if (teamAlliance.score < opponentAlliance.score) {
            losses++;
          } else {
            ties++;
          }
        }
      }
    });
    
    const avgScore = matchesPlayed > 0 ? totalScore / matchesPlayed : 0;
    const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
    
    // Calculate consistency (standard deviation)
    let consistency = 0;
    if (scores.length > 1) {
      const variance = scores.reduce((sum, score) => {
        return sum + Math.pow(score - avgScore, 2);
      }, 0) / scores.length;
      consistency = Math.sqrt(variance);
    }
    
    res.json({
      teamNumber,
      eventId,
      stats: {
        matchesPlayed,
        wins,
        losses,
        ties,
        winRate: Math.round(winRate * 10) / 10,
        avgScore: Math.round(avgScore * 10) / 10,
        totalScore,
        highScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowScore: scores.length > 0 ? Math.min(...scores) : 0,
        consistency: Math.round(consistency * 10) / 10,
        scores
      }
    });
  } catch (error) {
    console.error('Error calculating team stats:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to calculate team statistics',
      details: error.response?.data || error.message
    });
  }
});

// Predict final ranking based on current performance
app.get('/api/events/:eventId/teams/:teamNumber/predictions', async (req, res) => {
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
    
    // Get current rankings
    const rankingsResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE}/events/${eventId}/rankings`,
      { headers: robotEventsHeaders }
    );
    
    const rankings = rankingsResponse.data.data || [];
    const teamRanking = rankings.find(r => r.team.id === teamId);
    
    if (!teamRanking) {
      return res.json({
        teamNumber,
        eventId,
        currentRank: null,
        predictions: {
          message: 'Team not yet ranked at this event'
        }
      });
    }
    
    // Get team stats
    const statsResponse = await axios.get(
      `${ROBOTEVENTS_API_BASE.replace('https://www.robotevents.com/api/v2', '')}/api/teams/${teamNumber}/stats?eventId=${eventId}`,
      { 
        baseURL: 'http://localhost:3000',
        timeout: 5000 
      }
    ).catch(() => null);
    
    const stats = statsResponse?.data?.stats || {
      avgScore: teamRanking.ap || 0,
      winRate: 50
    };
    
    // Calculate predictions
    const currentRank = teamRanking.rank;
    const currentWP = teamRanking.wins || 0;
    const currentAP = teamRanking.ap || 0;
    const currentSP = teamRanking.sp || 0;
    
    // Estimate remaining matches (typical event has 8-12 qualification matches)
    const totalMatches = stats.matchesPlayed || 0;
    const estimatedTotalMatches = Math.max(8, totalMatches + 3);
    const remainingMatches = Math.max(0, estimatedTotalMatches - totalMatches);
    
    // Predict if team wins next X matches
    const predictions = [];
    for (let wins = 0; wins <= Math.min(remainingMatches, 5); wins++) {
      const projectedWP = currentWP + (wins * 2);
      const projectedAP = currentAP + (stats.avgScore * (wins + (remainingMatches - wins) * 0.5));
      
      // Estimate rank based on projected WP and AP
      let estimatedRank = currentRank;
      rankings.forEach(team => {
        if (team.team.id === teamId) return;
        
        const teamWP = team.wins || 0;
        const teamAP = team.ap || 0;
        
        if (projectedWP > teamWP || (projectedWP === teamWP && projectedAP > teamAP)) {
          estimatedRank--;
        }
      });
      
      estimatedRank = Math.max(1, estimatedRank);
      
      predictions.push({
        winsNeeded: wins,
        projectedWP,
        projectedAP: Math.round(projectedAP),
        estimatedRank
      });
    }
    
    // Calculate qualification probability (top 30 typically qualify)
    const qualificationCutoff = Math.min(30, Math.floor(rankings.length * 0.5));
    const qualificationProbability = currentRank <= qualificationCutoff ? 
      Math.min(95, 100 - (currentRank / qualificationCutoff) * 20) :
      Math.max(5, 50 - ((currentRank - qualificationCutoff) / qualificationCutoff) * 40);
    
    // Alliance selection (typically top 8 are captains)
    const allianceSelectionChance = currentRank <= 8 ? 
      Math.min(95, 100 - (currentRank - 1) * 10) :
      Math.max(5, 40 - ((currentRank - 8) / 8) * 30);
    
    res.json({
      teamNumber,
      eventId,
      currentRank,
      currentWP,
      currentAP,
      currentSP,
      remainingMatches,
      predictions,
      qualificationProbability: Math.round(qualificationProbability),
      allianceSelectionChance: Math.round(allianceSelectionChance),
      totalTeams: rankings.length
    });
  } catch (error) {
    console.error('Error calculating predictions:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to calculate predictions',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`VEX Robotics Dashboard API running on port ${PORT}`);
});
