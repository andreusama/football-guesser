# Debug Guide - Badge Loading System

## Console Logging Format

The badge loading system uses clear, structured console logging to help you understand what's happening:

### Log Prefixes

- `[CACHE]` - Badge retrieved from cache (no API call needed)
- `[START]` - Beginning badge fetch process
- `[TIER 1/2/3]` - Which badge source is being tried
- `[SUCCESS]` - Operation succeeded
- `[FAILED]` - Operation failed, trying next option
- `[ERROR]` - An error occurred
- `[TRACKED]` - Team added to missing badges list
- `[EXPORT]` - Export operation status

### Example Console Output

```
[START] Fetching badge for "Angers SCO"...
[TIER 1] Trying TheSportsDB...
  → Will try 4 search variations: Angers, Angers SCO, Angers, SCO
  → Attempt 1/4: Searching for "Angers"
  → No results for "Angers"
  → Attempt 2/4: Searching for "Angers SCO"
  → No results for "Angers SCO"
[FAILED] TheSportsDB did not have badge for "Angers SCO"
[TIER 2] Trying Wikipedia fallback...
  → Attempting Wikipedia search for "Angers SCO"
  [SUCCESS] Found badge on Wikipedia page "Angers SCO"
[SUCCESS] Badge found via Wikipedia for "Angers SCO"
```

### When Placeholder is Generated

```
[START] Fetching badge for "Unknown Team"...
[TIER 1] Trying TheSportsDB...
[FAILED] TheSportsDB did not have badge for "Unknown Team"
[TIER 2] Trying Wikipedia fallback...
  [ERROR] Wikipedia fetch failed: Network error
[FAILED] Wikipedia did not have badge for "Unknown Team"
[TIER 3] Generating placeholder badge...
  [SUCCESS] Generated placeholder badge: "UNK" with color hsl(245, 60%, 45%)
[TRACKED] Added "Unknown Team" to missing teams list
[SUCCESS] Generated placeholder for "Unknown Team"
```

## Debug Commands

When you load the game, two commands become available in the browser console:

### 1. `showMissingTeams()`

Displays all teams that required placeholder badges in the console.

**Example:**
```javascript
showMissingTeams()
```

**Output:**
```
========================================
MISSING TEAMS REPORT
========================================
Total teams using placeholders: 3

1. Angers SCO
2. Le Havre AC
3. Auxerre

========================================
To export this list, run: exportMissingTeams()
```

### 2. `exportMissingTeams()`

Downloads a `MissingTeams.txt` file with all teams that needed placeholders.

**Example:**
```javascript
exportMissingTeams()
```

**Output File (MissingTeams.txt):**
```
# Missing Team Badges Report
# Generated: 2025-01-15T10:30:45.123Z
# Teams that needed placeholder badges (not found in TheSportsDB or Wikipedia)
# Total: 3 teams

1. Angers SCO
2. Le Havre AC
3. Auxerre

---
Note: These teams are using generated placeholder badges.
Consider adding manual mappings for these teams in TEAM_NAME_MAPPING.
```

## Error Types

### TheSportsDB Errors

**Rate Limit:**
```
[ERROR] Rate limit hit! Waiting 1 second before retry...
```
Solution: Wait a moment, the system automatically retries.

**Bad Response:**
```
[ERROR] API returned status 404
```
Solution: TheSportsDB might be down or team doesn't exist.

**Network Error:**
```
[ERROR] Failed to fetch
```
Solution: Check internet connection or CORS (use local server).

### Wikipedia Errors

**Bad Response:**
```
[ERROR] Wikipedia API returned status 500
```
Solution: Wikipedia might be temporarily unavailable.

**Network Error:**
```
[ERROR] Wikipedia fetch failed: Network error
```
Solution: Check internet connection.

## Debugging Workflow

1. **Open browser console** (F12)
2. **Start the game** and play a few rounds
3. **Check console logs** for any [ERROR] or [FAILED] messages
4. **Run `showMissingTeams()`** to see which teams needed placeholders
5. **Run `exportMissingTeams()`** to download the list
6. **Add mappings** to `TEAM_NAME_MAPPING` in `game.js` for missing teams

## Common Issues

### All Teams Using Placeholders

**Symptoms:**
- Every team shows `[TIER 3] Generating placeholder badge...`
- No `[SUCCESS]` messages from TIER 1 or TIER 2

**Causes:**
- CORS error (not using local server)
- Network connectivity issues
- API services down

**Solution:**
1. Make sure you're using a local server (`python -m http.server 8000`)
2. Check browser console for CORS errors
3. Check internet connection

### Some Teams Missing Badges

**Symptoms:**
- Most teams work, but a few use placeholders
- You see `[FAILED]` for both TIER 1 and TIER 2

**Causes:**
- Team name doesn't match database entries
- Team is too obscure for both APIs

**Solution:**
1. Run `showMissingTeams()` to identify them
2. Manually search TheSportsDB for correct team name
3. Add mapping to `TEAM_NAME_MAPPING`

### Rate Limiting

**Symptoms:**
- `[ERROR] Rate limit hit!` messages
- Slow badge loading

**Causes:**
- Too many API requests in short time
- Game reloaded multiple times

**Solution:**
- System automatically waits and retries
- Badges are cached, so reload helps
- Wait a minute if you see many rate limit errors

## Performance Tips

1. **Cache is your friend** - Badges are cached, so second/third games are faster
2. **Check logs after full game** - Play all 10 rounds to see all teams
3. **Export before closing** - Run `exportMissingTeams()` before closing browser
4. **Use local server** - Prevents CORS issues and improves reliability

## Reporting Issues

If you find teams that should have badges but don't:

1. Run `exportMissingTeams()`
2. Check `MissingTeams.txt`
3. Manually search https://www.thesportsdb.com for each team
4. If found, add correct name to `TEAM_NAME_MAPPING` in `game.js`
5. If not found, the placeholder system is working as intended
