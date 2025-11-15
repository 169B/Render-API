# VEX Robotics Live Dashboard API

A Node.js Express proxy server for the RobotEvents API, providing a clean interface for building VEX Robotics team dashboards and live event tracking systems.

## Features

- 🏆 **Team Information** - Get detailed information about any VEX Robotics team
- 📅 **Event Tracking** - View upcoming events for teams with automatic filtering and sorting
- 🎯 **Live Match Data** - Access real-time match schedules and results
- 📊 **Rankings** - Retrieve team rankings at specific events
- 🔄 **Auto-Refresh** - Built-in support for periodic data updates
- 🌐 **CORS Enabled** - Ready for frontend integration from any domain
- 🚀 **Production Ready** - Deployed on Render with automatic scaling

## Deployed API

The API is live and ready to use at:

**Base URL:** `https://robot-events-proxy.onrender.com`

No authentication required for the proxy endpoints - the API token is handled server-side.

## API Endpoints

### Health Check
```
GET /
```
Returns the API status and current timestamp.

**Example Response:**
```json
{
  "status": "VEX Robotics Dashboard API is running",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### Get Team Information
```
GET /api/teams/:teamNumber
```
Retrieve detailed information about a specific team.

**Parameters:**
- `teamNumber` - The team number (e.g., "169B")

**Example:**
```bash
curl https://robot-events-proxy.onrender.com/api/teams/169B
```

### Get Team Events
```
GET /api/teams/:teamNumber/events
```
Get upcoming events for a team, automatically filtered and sorted by date.

**Parameters:**
- `teamNumber` - The team number (e.g., "169B")

**Query Parameters:**
- `season` (optional) - Filter by season ID
- `level` (optional) - Filter by competition level (e.g., "World", "State")

**Example:**
```bash
curl "https://robot-events-proxy.onrender.com/api/teams/169B/events?season=181"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 12345,
      "name": "VEX Robotics World Championship",
      "start": "2024-04-25T00:00:00Z",
      "end": "2024-04-27T00:00:00Z",
      "location": {
        "venue": "Kay Bailey Hutchison Convention Center",
        "city": "Dallas",
        "region": "Texas",
        "country": "United States"
      }
    }
  ]
}
```

### Get Event Details
```
GET /api/events/:eventId
```
Get detailed information about a specific event.

**Parameters:**
- `eventId` - The event ID

**Example:**
```bash
curl https://robot-events-proxy.onrender.com/api/events/12345
```

### Get Team Matches at Event
```
GET /api/events/:eventId/teams/:teamNumber/matches
```
Retrieve all matches for a team at a specific event, sorted by scheduled time.

**Parameters:**
- `eventId` - The event ID
- `teamNumber` - The team number

**Example:**
```bash
curl https://robot-events-proxy.onrender.com/api/events/12345/teams/169B/matches
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Q1",
      "scheduled": "2024-04-25T09:00:00Z",
      "started": null,
      "field": "Main",
      "alliances": [
        {
          "color": "red",
          "score": 0,
          "teams": [
            { "team": { "name": "169B" } }
          ]
        },
        {
          "color": "blue",
          "score": 0,
          "teams": [
            { "team": { "name": "229A" } }
          ]
        }
      ]
    }
  ]
}
```

### Get Team Rankings at Event
```
GET /api/events/:eventId/teams/:teamNumber/rankings
```
Get the current rankings for a team at a specific event.

**Parameters:**
- `eventId` - The event ID
- `teamNumber` - The team number

**Example:**
```bash
curl https://robot-events-proxy.onrender.com/api/events/12345/teams/169B/rankings
```

## Setup Instructions

### Getting a RobotEvents API Token

1. Go to [RobotEvents API](https://www.robotevents.com/api/v2)
2. Sign in with your RobotEvents account
3. Navigate to your Account settings
4. Click "Generate API Token"
5. Copy the generated token
6. Keep this token secure - don't share it publicly

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/169B/Render-API.git
   cd Render-API
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and add your API token:**
   ```
   ROBOTEVENTS_API_TOKEN=your_actual_token_here
   PORT=3000
   ```

5. **Run the server:**
   ```bash
   # Development mode (auto-restart on changes)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Test the API:**
   ```bash
   curl http://localhost:3000/
   curl http://localhost:3000/api/teams/169B
   ```

### Deploying to Render

1. **Fork this repository** to your GitHub account

2. **Go to [Render Dashboard](https://dashboard.render.com/)**

3. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select this repository

4. **Configure the service:**
   - **Name:** `robot-events-proxy` (or your preferred name)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or your preferred plan)

5. **Add environment variable:**
   - Go to "Environment" tab
   - Add `ROBOTEVENTS_API_TOKEN` with your API token value
   - Add `PORT` (Render sets this automatically, but you can override)

6. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your API will be available at `https://your-service-name.onrender.com`

7. **Test your deployment:**
   ```bash
   curl https://your-service-name.onrender.com/
   ```

## Frontend Integration

### Using with JavaScript (Fetch API)

```javascript
const API_BASE = 'https://robot-events-proxy.onrender.com';
const TEAM_NUMBER = '169B';

// Get upcoming events
async function getUpcomingEvents() {
  try {
    const response = await fetch(`${API_BASE}/api/teams/${TEAM_NUMBER}/events`);
    const data = await response.json();
    return data.data; // Array of events
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Get matches for an event
async function getMatches(eventId) {
  try {
    const response = await fetch(
      `${API_BASE}/api/events/${eventId}/teams/${TEAM_NUMBER}/matches`
    );
    const data = await response.json();
    return data.data; // Array of matches
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

// Example usage
(async () => {
  const events = await getUpcomingEvents();
  console.log('Upcoming events:', events);
  
  if (events.length > 0) {
    const matches = await getMatches(events[0].id);
    console.log('Matches at next event:', matches);
  }
})();
```

### CodePen Example

A complete, ready-to-use dashboard is available in `codepen-template.html`. This includes:

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Auto-Refresh** - Updates every 5 minutes automatically
- **Event Cards** - Clickable cards showing upcoming events
- **Match Schedule** - Table view of all matches with alliance colors
- **Professional Styling** - Gradient purple theme with animations
- **Error Handling** - Graceful handling of API errors and loading states

To use the CodePen template:

1. Open `codepen-template.html` in your browser, or
2. Copy the contents to [CodePen.io](https://codepen.io)
3. Customize the `TEAM_NUMBER` variable at the top of the JavaScript section
4. Enjoy your live dashboard!

**Preview:** The dashboard automatically loads:
- Your team's upcoming events
- The next event's details
- Complete match schedule for the next event

### GitBook Integration

Want to embed the dashboard in your team's GitBook documentation? See `gitbook-embed.md` for complete instructions on:

- Embedding CodePen in GitBook pages
- Creating custom HTML embeds
- Configuring auto-refresh behavior
- Best practices for documentation

## Project Structure

```
.
├── server.js           # Main Express server with API endpoints
├── package.json        # Dependencies and scripts
├── .env.example        # Environment variable template
├── .gitignore         # Git ignore rules
├── README.md          # This file
├── codepen-template.html   # Complete dashboard HTML/CSS/JS
└── gitbook-embed.md   # GitBook embedding guide
```

## Dependencies

- **express** (^4.18.2) - Web framework
- **cors** (^2.8.5) - CORS middleware
- **axios** (^1.6.2) - HTTP client for API requests
- **dotenv** (^16.3.1) - Environment variable management

## Development Dependencies

- **nodemon** (^3.0.2) - Auto-restart server on file changes

## Error Handling

The API includes comprehensive error handling:

- **404 Errors** - Returned when teams or events are not found
- **500 Errors** - Returned for server or API communication errors
- **Detailed Error Messages** - All errors include descriptive messages
- **Console Logging** - Errors are logged server-side for debugging

## Rate Limiting

The RobotEvents API has rate limits. Best practices:

- Cache results when possible
- Use reasonable refresh intervals (5+ minutes recommended)
- Handle rate limit errors gracefully in your frontend

## CORS Support

CORS is enabled for all origins by default. In production, you may want to restrict this:

```javascript
// In server.js, replace:
app.use(cors());

// With:
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

## Support

- **RobotEvents API Documentation:** https://www.robotevents.com/api/v2
- **Issues:** Report bugs or request features via GitHub Issues
- **VEX Robotics:** https://www.vexrobotics.com

## License

MIT License - Feel free to use this project for your team's dashboard!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Created by Team 169B for the VEX Robotics community.

---

**Happy Competing! 🤖🏆**
