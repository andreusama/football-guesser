# Badge Loading Fixes

## Critical: CORS Error Prevention

### The Problem
If you open `index.html` directly by double-clicking it, you'll see this error in the console:
```
Access to fetch at 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=...'
from origin 'null' has been blocked by CORS policy
```

### The Solution
**You MUST use a local web server** to load badges. Run one of these commands:

```bash
python -m http.server 8000    # Python
npx serve                      # Node.js
php -S localhost:8000          # PHP
```

Then open `http://localhost:8000` in your browser.

### Why This Happens
- Opening files directly uses `file://` protocol (origin = "null")
- TheSportsDB API blocks requests from "null" origin for security
- OpenFootball data works because GitHub allows CORS from anywhere
- Local server gives proper `http://localhost` origin, which APIs accept

---

## Other Issues Found

1. **Incomplete team mappings** - Only ~40 teams mapped, but 100+ teams across all leagues
2. **Single search attempt** - If first search failed, no fallback attempts
3. **No rate limit handling** - API could return 429 errors when too many requests
4. **Verona not found** - Mapped to "Verona" but TheSportsDB requires "Hellas Verona"

## Solutions Implemented

### 1. Comprehensive Team Mappings (100+ teams)
Added complete mappings for all teams in:
- Premier League (20 teams)
- Ligue 1 (18 teams)
- La Liga (20 teams)
- Serie A (20 teams)
- Bundesliga (18 teams)

### 2. Intelligent Fallback Search
New `generateSearchTerms()` function tries multiple search variations:
1. Mapped name (if exists in TEAM_NAME_MAPPING)
2. Original cleaned name
3. First word only (e.g., "Hellas Verona" → "Hellas")
4. Last word only (e.g., "Hellas Verona" → "Verona")
5. Without common prefixes (FC, CF, AC, AS, SC, US, RC)

Example for "Hellas Verona":
- Try: "Hellas Verona" (mapped) ✓ FOUND
- Try: "Hellas Verona" (original)
- Try: "Hellas" (first word)
- Try: "Verona" (last word)

### 3. Rate Limit Protection
- Detects 429 HTTP status (rate limit exceeded)
- Waits 1 second before retrying
- Adds 300ms delay between home/away badge requests
- Caches results (including failures) to avoid repeated requests

### 4. Enhanced Logging
Console now shows:
- `Attempt 1/5: Fetching badge for "Team" -> Searching: "SearchTerm"`
- `✓ Found badge for "Team": TheSportsDB Name (attempt 2)`
- `✗ No badge found for "Team" after 5 attempts`
- `⚠ Rate limit hit for "Team"`

## Fixed Teams

### Serie A
- **Hellas Verona** - Now correctly searches "Hellas Verona" (was "Verona")

### Ligue 1
- **Paris Saint-Germain** - Maps to "Paris SG"
- **Olympique de Marseille** - Maps to "Marseille"
- **Olympique Lyonnais** - Maps to "Lyon"
- **Stade Rennais 1901** - Maps to "Rennes"

### Premier League
- **Manchester United** - Maps to "Man Utd"
- **Manchester City** - Maps to "Man City"
- **Wolverhampton Wanderers** - Maps to "Wolves"
- **Brighton & Hove Albion** - Maps to "Brighton"
- **Nottingham Forest** - Maps to "Nott'm Forest"

## How to Debug

1. **Open browser console** (F12)
2. **Play the game**
3. **Watch console logs** for:
   - Which teams are being searched
   - Which search terms are being tried
   - Success/failure for each team

Example console output:
```
Attempt 1/4: Fetching badge for "Hellas Verona" -> Searching: "Hellas Verona"
✓ Found badge for "Hellas Verona": Hellas Verona (attempt 1)
```

## Testing Tools

- **debug-badges.html** - Test specific teams to see all search attempts
- Browser console - Real-time logging during gameplay

## Multi-Source Badge System

To ensure **all teams have badges** (no game bias), the system now uses a 3-tier fallback:

### Tier 1: TheSportsDB (Primary)
- Tries all search term variations
- Best quality badges
- Most comprehensive for popular teams

### Tier 2: Wikipedia (Fallback)
- Fetches team page images from Wikipedia API
- Tries team name and "Team FC" variations
- Good coverage for less popular teams
- Free and reliable

### Tier 3: Generated Placeholder (Last Resort)
- Creates SVG badge with team initials (e.g., "PSG", "RMA")
- Consistent color per team (based on name hash)
- Ensures every team has a visual identifier

### Example Console Output:
```
TheSportsDB attempt 1/4: "Angers SCO" -> "Angers"
  → No results for "Angers"
✗ TheSportsDB: No badge found for "Angers SCO"
Trying Wikipedia fallback for "Angers SCO"...
✓ Wikipedia: Found badge for "Angers SCO"
```

Or if Wikipedia also fails:
```
Generating placeholder for "Unknown Team"...
✓ Generated placeholder for "Unknown Team": UNK
```

## API Rate Limits

TheSportsDB free API has rate limits (exact numbers not documented). The code now:
- Detects rate limit errors (HTTP 429)
- Waits and retries
- Adds delays between requests
- Caches all results
- Falls back to Wikipedia if TheSportsDB is unavailable

## Still Having Issues?

If a badge still won't load:
1. Check browser console for the exact error
2. Note which search terms were tried
3. Manually test at: `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=TEAM_NAME`
4. Add correct mapping to TEAM_NAME_MAPPING in game.js
