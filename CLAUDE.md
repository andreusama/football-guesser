# HYBRID SYSTEM - Football-Data.org + TheSportsDB

## Architecture Evolution

**V1 (Original):** OpenFootball results → Search TheSportsDB for badges → Wikipedia fallback → Placeholder
**V2 (Attempted):** TheSportsDB teams → Filter OpenFootball matches → Name matching required
**V3 (Previous):** TheSportsDB eventsseason.php - Single source (limited to 50 events per league)
**V4 (Current):** ✅ **Football-Data.org for matches + TheSportsDB for league badges**

## Why V4 is Better

### Problem with V3:
- TheSportsDB free API limited to **50 events per league** (only ~10 games per team)
- Incomplete season data - couldn't get all 380 matches per league
- Only recent/partial matches available

### V4 Solution:
- **Football-Data.org** for complete match data (380 matches per league)
  - Free tier: 10 API calls/minute
  - Full season coverage (2024-2025)
  - Team crests included in API response
- **TheSportsDB** for league badges only
  - Current official league emblems
  - 5 API calls total (one per league)
- **Vercel serverless functions** to proxy both APIs and avoid CORS
- Simpler, complete data, best of both worlds

## Current Implementation

### Data Loading Flow

```javascript
async loadMatchData() {
    // 1. Load matches from Football-Data.org (5 API calls)
    for (const leagueName of Object.keys(COMPETITION_CODES)) {
        const competitionCode = COMPETITION_CODES[leagueName]; // PL, PD, SA, BL1, FL1
        const response = await fetch(`${FOOTBALL_DATA_API}?competition=${competitionCode}&season=2024`);
        const data = await response.json();

        for (const match of data.matches) {
            if (match.status === 'FINISHED' &&
                match.score.fullTime.home !== null &&
                match.score.fullTime.away !== null) {

                allMatches.push({
                    league: leagueName,
                    home: match.homeTeam.shortName,
                    away: match.awayTeam.shortName,
                    homeScore: match.score.fullTime.home,
                    awayScore: match.score.fullTime.away,
                    date: match.utcDate.split('T')[0],
                    homeTeamData: {
                        id: match.homeTeam.id,
                        name: match.homeTeam.name,
                        shortName: match.homeTeam.shortName,
                        crest: match.homeTeam.crest // Football-Data.org crest URL
                    },
                    awayTeamData: {
                        id: match.awayTeam.id,
                        name: match.awayTeam.name,
                        shortName: match.awayTeam.shortName,
                        crest: match.awayTeam.crest
                    }
                });
            }
        }
    }

    // 2. Load league badges from TheSportsDB (5 API calls)
    await loadLeagueBadgesFromSportsDB();
}
```

### Match Data Structure (Football-Data.org)

Each match contains:
- **Team Names**: `homeTeam.shortName`, `awayTeam.shortName`
- **Team IDs**: `homeTeam.id`, `awayTeam.id`
- **Team Crests**: `homeTeam.crest`, `awayTeam.crest` (from Football-Data.org)
- **Scores**: `score.fullTime.home`, `score.fullTime.away`
- **Date**: `utcDate`
- **Status**: `status` (filter for "FINISHED")
- **Matchday**: `matchday`

### League Badges (TheSportsDB)

League emblems fetched separately:
- Endpoint: `lookupleague.php?id={leagueId}`
- Cached in `leagueEmblemCache`
- Used in league selection screen and match display

## Removed Code

### From V2 → V3:
- ❌ `OPENFOOTBALL_URLS` - No longer using OpenFootball
- ❌ `sportsDBTeamsByLeague` cache - Don't need separate team loading
- ❌ `teamLookupCache` - No name matching needed
- ❌ `excludedMatches` / `excludedTeams` - No exclusions (everything has badges)
- ❌ `fetchLeagueTeams()` - Teams come from events
- ❌ `generateTeamSearchVariations()` - No name matching!
- ❌ `findTeamInSportsDB()` - No searching!
- ❌ `showExcludedTeams()` / `exportExcludedTeams()` - No exclusions
- ❌ All complex name matching logic with prefixes/suffixes

### From V1 → V2 (already removed):
- ❌ `TEAM_NAME_MAPPING` (100+ hardcoded mappings)
- ❌ `fetchFromWikipedia()` - Wikipedia fallback
- ❌ `generatePlaceholderBadge()` - SVG generator
- ❌ Multi-source fallback system

## Benefits

✅ **Single API** - Only TheSportsDB, no OpenFootball dependency
✅ **No name matching** - Everything from same source, names always match
✅ **100% badge coverage** - Every match has badges built-in
✅ **Simpler code** - Removed 200+ lines of matching logic
✅ **Faster loading** - One endpoint per league (5 total)
✅ **More reliable** - No matching failures, no exclusions
✅ **Easier maintenance** - Single source of truth

## API Endpoints

### Football-Data.org (Primary - Match Data)

**Endpoint:** `https://api.football-data.org/v4/competitions/{code}/matches?season=2024`
- **Authentication:** API Token in `X-Auth-Token` header
- **Rate Limit:** 10 calls per minute (free tier)
- **Returns:** Complete season data (380 matches per league)
- **Proxied via:** `/api/football-data` (Vercel serverless function)

**Competition Codes:**
- Champions League: `CL` (6 API calls)
- Premier League: `PL`
- La Liga: `PD`
- Serie A: `SA`
- Bundesliga: `BL1`
- Ligue 1: `FL1`

### TheSportsDB (Secondary - League Badges Only)

**Endpoint:** `https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id={leagueId}`
- **Authentication:** None (free tier with API key 3)
- **Rate Limit:** Reasonable (not specified)
- **Returns:** League information including badge URL
- **Proxied via:** `/api/sportsdb` (Vercel serverless function)

**League IDs:**
- Premier League: `4328`
- La Liga: `4335`
- Serie A: `4332`
- Bundesliga: `4331`
- Ligue 1: `4334`
- Champions League: `4480` (⚠️ Uses local badge file instead: `UEFA_Champions_League.svg.png`)

### Why Not Use TheSportsDB for Everything?

❌ **`eventsseason.php`** - Limited to 50 events per league (free tier)
❌ **`lookup_all_teams.php`** - Data corruption issues
❌ **`lookuptable.php`** - Incomplete team lists

## Vercel Serverless Functions

### `/api/football-data.js`
Proxies Football-Data.org API requests:
- Handles CORS by making server-side requests
- Securely stores API token server-side
- Query params: `?competition=PD&season=2024`

### `/api/sportsdb.js`
Proxies TheSportsDB API requests:
- Handles CORS for league badge fetching
- Query params: `?endpoint=lookupleague.php&id=4335`

## UI/UX Improvements (October 2025)

### Design System
**See STYLE.md for complete color palette documentation**

**Football Pitch Theme:**
- Dark pitch green background (`#1a3a2e`)
- Grass texture on green buttons only (`grass.jpg`)
- Gold gradient buttons for secondary actions
- White cards with clean surfaces

**Typography:**
- **Cursed Timer font** (`CursedTimerUlil-Aznm.ttf`) applied ONLY to:
  - Score input fields
  - Actual score display
- Rest of app uses Segoe UI

### In-Place Result Transformation
**Problem:** Separate result section caused layout shift and badge movement
**Solution:** Transform guess panel in-place without layout changes

**Implementation:**
- Heading text changes: "Guess the final score:" → "Your guessing was:"
- Inputs become read-only (grayed background)
- Result elements use `visibility: hidden` (reserves space, no layout shift)
- Button transforms: Green "Submit Guess" → Gold "Next Round"
- Result elements positioned as siblings (not children) of guess section
- Spacing reduced to 12px for tighter layout

**Button Consistency:**
- Both states: `width: 100%; max-width: 300px`
- Green button: `border: 2px solid #4dd21d` with grass texture
- Gold button: `border: 2px solid #ff9800` with solid gradient
- Same padding, font-size, and background-size properties

### Feedback System
Simplified to 3 visual states with palette-aligned gradients:
- **10 points (Perfect)**: Green gradient - "Perfect! Exact score! +10 pts"
- **7 points (Very Good)**: Gold gradient - "Close! Goal difference correct +7 pts"
- **5 points (Good)**: Gold gradient - "Good! Correct winning side +5 pts"
- **3 points (Okay)**: Gold gradient - "One score correct +3 pts"
- **0 points (Wrong)**: Dark green gradient - "Wrong +0 pts"

**Why the changes:**
- Unified middle-ground scores with gold (7/5/3 pts)
- "Correct winning side" instead of "Correct result" (clearer)
- Removed disruptive red - replaced with dark pitch green
- All gradients flow darker → lighter consistently
- Shortened "pts" for mobile responsiveness

### Debug Mode
Press `D` key to toggle debug panel:
- **1**: League Selection screen
- **2**: Team Selection screen
- **3**: Game Screen (guess mode)
- **4**: Result Screen (transformed state)
- **5**: Game Over screen

Quick visualization with placeholder data for testing layouts.

## Testing

Run locally with Vercel dev server:
```bash
vercel dev
```

Expected console output (6 leagues):
```
Loading match data from Football-Data.org...
Season: 2024-2025
Champions League: 125+ matches loaded
Premier League: 380 matches loaded
La Liga: 380 matches loaded
Serie A: 380 matches loaded
Bundesliga: 306 matches loaded
Ligue 1: 306 matches loaded

========================================
MATCH LOADING SUMMARY
========================================
Total matches processed: ~2000+
Finished matches loaded: ~1900+
Source: Football-Data.org
========================================

Loading league badges from TheSportsDB...
✓ Premier League badge loaded from TheSportsDB
✓ La Liga badge loaded from TheSportsDB
✓ Serie A badge loaded from TheSportsDB
✓ Bundesliga badge loaded from TheSportsDB
✓ Ligue 1 badge loaded from TheSportsDB
ℹ Champions League using local badge file
```

## Files

### Main Application
- ✅ `public/game.js` - Hybrid system using Football-Data.org + TheSportsDB
- ✅ `public/index.html` - Main game interface with debug mode
- ✅ `public/style.css` - Football pitch theme with responsive mobile support
- ✅ `public/grass.jpg` - Background texture for green buttons
- ✅ `public/UEFA_Champions_League.svg.png` - Local Champions League badge
- ✅ `public/fonts/CursedTimerUlil-Aznm.ttf` - Score display font

### Vercel Serverless Functions
- ✅ `api/football-data.js` - Proxy for Football-Data.org API
- ✅ `api/sportsdb.js` - Proxy for TheSportsDB API
- ✅ `vercel.json` - Vercel configuration

### Testing & Documentation
- ✅ `test-football-data-api.html` - Test Football-Data.org integration
- ✅ `test-thesportsdb-only.html` - Test TheSportsDB integration
- ✅ `CLAUDE.md` - This technical documentation file
- ✅ `STYLE.md` - Color palette documentation (isolated from logic)
- ✅ `README.md` - Project overview
- ⚠️ `token.txt` - Football-Data.org API token (DO NOT COMMIT)

## Security Notes

**IMPORTANT:** The file `token.txt` contains the Football-Data.org API token and should NOT be committed to version control. Add to `.gitignore`:
```
token.txt
*.json
```

The token is safely stored in the Vercel serverless function (`api/football-data.js`) for production.
