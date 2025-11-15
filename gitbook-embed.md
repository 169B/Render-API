# Embedding the VEX Robotics Dashboard in GitBook

This guide explains how to embed the live VEX Robotics dashboard into your team's GitBook documentation.

## Method 1: CodePen Embed (Recommended)

The easiest way to embed the dashboard is using CodePen.

### Step 1: Create a CodePen

1. Go to [CodePen.io](https://codepen.io) and create a free account
2. Create a new pen
3. Copy the contents from `codepen-template.html`:
   - Copy HTML section to the HTML panel
   - Copy CSS section (inside `<style>` tags) to the CSS panel
   - Copy JavaScript section (inside `<script>` tags) to the JS panel
4. Update the `TEAM_NUMBER` variable in the JavaScript panel to your team number
5. Save your pen and note the pen ID from the URL

### Step 2: Embed in GitBook

In your GitBook page, add an embed block:

```markdown
{% embed url="https://codepen.io/YOUR_USERNAME/pen/YOUR_PEN_ID" %}
VEX Robotics Live Dashboard for Team 169B
{% endembed %}
```

Replace:
- `YOUR_USERNAME` with your CodePen username
- `YOUR_PEN_ID` with your pen's ID

**Example:**
```markdown
{% embed url="https://codepen.io/team169b/pen/abcDEF" %}
Live match schedule and event tracker
{% endembed %}
```

### Advantages of CodePen Embed:
- ✅ Easy to update without changing GitBook
- ✅ Responsive design works automatically
- ✅ CodePen handles hosting and performance
- ✅ Can be reused across multiple pages

## Method 2: Direct HTML Embed

For more control, you can embed the dashboard directly using HTML.

### Option A: Full Page Embed

Create a new page in GitBook and use the HTML embed block:

```html
<iframe 
  src="https://robot-events-proxy.onrender.com/dashboard.html" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
</iframe>
```

### Option B: Embed from Your Own Hosting

If you host the `codepen-template.html` file on your own server:

```html
<iframe 
  src="https://your-team-website.com/dashboard.html" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
</iframe>
```

### Customizing the iFrame:

```html
<iframe 
  src="YOUR_DASHBOARD_URL" 
  width="100%" 
  height="1000px"
  frameborder="0"
  loading="lazy"
  style="
    border: none; 
    border-radius: 15px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    margin: 20px 0;
  ">
</iframe>
```

**Height recommendations:**
- Compact view: `600px`
- Standard view: `800px`
- Full view: `1000px+`

## Method 3: GitBook API Embed Block

GitBook supports custom embed blocks for external content.

### Step 1: Enable API Embeds

In your GitBook space settings:
1. Go to Integrations
2. Enable "Custom Embeds"
3. Add the dashboard URL pattern

### Step 2: Use the Embed Block

In your page content:

```
{% embed url="https://robot-events-proxy.onrender.com" %}
```

GitBook will automatically create an embed preview.

## Customization Tips

### Change Team Number

In the JavaScript code, modify:

```javascript
const TEAM_NUMBER = '169B'; // Change to your team number
```

### Adjust Auto-Refresh Interval

By default, the dashboard refreshes every 5 minutes. To change this:

```javascript
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Examples:
const REFRESH_INTERVAL = 2 * 60 * 1000;  // 2 minutes
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const REFRESH_INTERVAL = 30 * 1000;       // 30 seconds (not recommended)
```

**Best practices:**
- Use 5+ minutes for typical dashboards
- Use 2-3 minutes during active competitions
- Avoid intervals less than 1 minute to respect API rate limits

### Customize Colors

To match your team colors, modify the CSS:

```css
/* Change the gradient background */
body {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

/* Change the primary accent color */
.header h1,
.section h2 {
    color: #YOUR_PRIMARY_COLOR;
}

/* Change event card gradients */
.event-card {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

**Popular VEX team color schemes:**

```css
/* Red theme */
background: linear-gradient(135deg, #e53935 0%, #c62828 100%);

/* Blue theme */
background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);

/* Green theme */
background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%);

/* Orange theme */
background: linear-gradient(135deg, #fb8c00 0%, #ef6c00 100%);
```

## Advanced: Multiple Teams

To show multiple teams on one dashboard, you can modify the JavaScript to loop through an array of teams:

```javascript
const TEAMS = ['169B', '229A', '315X']; // Add your teams

async function fetchAllTeamsEvents() {
    for (const team of TEAMS) {
        const response = await fetch(`${API_BASE}/api/teams/${team}/events`);
        const data = await response.json();
        // Display logic here
    }
}
```

## Responsive Design

The dashboard is fully responsive and works on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktop monitors (1440px+)

No additional configuration needed!

## Troubleshooting

### Dashboard Not Loading

1. **Check the API URL**: Ensure `API_BASE` is set correctly
2. **Check team number**: Verify your team number exists on RobotEvents
3. **Check browser console**: Press F12 and look for error messages
4. **CORS issues**: The proxy handles CORS, but some hosting platforms may block iframes

### Events Not Showing

1. **No upcoming events**: The dashboard only shows future events
2. **Wrong season**: Make sure events exist for the current season
3. **API token**: Verify the server has a valid RobotEvents API token

### Slow Loading

1. **API response time**: RobotEvents API can be slow during peak times
2. **Reduce refresh rate**: Increase the `REFRESH_INTERVAL` value
3. **Cache data**: Consider implementing local storage caching

### iframe Not Displaying in GitBook

1. **GitBook restrictions**: Some GitBook plans restrict iframes
2. **Use CodePen**: CodePen embeds are better supported
3. **Check embed settings**: Ensure custom embeds are enabled

## Best Practices

### For Competition Days

- ✅ Set refresh interval to 2-3 minutes
- ✅ Test the dashboard before the event
- ✅ Have a backup static schedule
- ✅ Check mobile responsiveness

### For Team Documentation

- ✅ Use 5-10 minute refresh intervals
- ✅ Include a "Last Updated" timestamp
- ✅ Add context about what the dashboard shows
- ✅ Link to RobotEvents for full details

### For Public Pages

- ✅ Consider rate limiting impact
- ✅ Add error handling instructions
- ✅ Include contact information
- ✅ Test across different browsers

## Example GitBook Page Structure

```markdown
# Live Event Tracker

Stay up to date with our team's competition schedule!

{% embed url="https://codepen.io/team169b/pen/abcDEF" %}
Real-time match schedule and event information
{% endembed %}

## About This Dashboard

This dashboard automatically updates every 5 minutes and shows:
- Upcoming events we're registered for
- Details about our next competition
- Live match schedule with alliance assignments

Data is provided by the RobotEvents API via our proxy server.

## Questions?

Contact the team at team169b@example.com
```

## Additional Resources

- **RobotEvents API**: https://www.robotevents.com/api/v2
- **CodePen**: https://codepen.io
- **GitBook Documentation**: https://docs.gitbook.com
- **API Source Code**: https://github.com/169B/Render-API

## Support

If you encounter issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Open an issue on GitHub
4. Contact your team's webmaster

---

**Happy documenting! 📚🤖**
