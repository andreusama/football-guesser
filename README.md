# Football Results Guesser

A web-based game where you guess the final scores of **real football matches** from Europe's top 5 leagues: Premier League, La Liga, Serie A, Bundesliga, and Ligue 1.

Uses real match data from the **2024-25 season** via [TheSportsDB](https://www.thesportsdb.com/) - a comprehensive sports database with match results, scores, and team badges.

## How to Play

1. Open `index.html` in your web browser
2. Wait for real match data to load from TheSportsDB
3. You'll see a random match from one of the top 5 European leagues with team badges
4. Guess the final score for both teams
5. Submit your guess and earn points based on accuracy
6. Play 10 rounds and see your final score!

## Scoring System

- **10 points**: Exact score (perfect guess!)
- **7 points**: Correct goal difference and result
- **5 points**: Correct result (winner or draw)
- **3 points**: One team's score correct
- **0 points**: Completely wrong

## Getting Started

### REQUIRED: Use a Local Server

**Team badges REQUIRE a local web server due to CORS (Cross-Origin Resource Sharing) restrictions.**

### Step 1: Start a Local Server

Open a terminal/command prompt in the project directory and run:

```bash
# Windows (Python):
python -m http.server 8000

# Mac/Linux (Python):
python3 -m http.server 8000

# Or if you have Node.js:
npx serve

# Or if you have PHP:
php -S localhost:8000
```

### Step 2: Open in Browser

Open your web browser and go to:
```
http://localhost:8000
```

### Step 3: Play and Test

1. Open browser console (F12) to see data loading logs
2. Play the game - all matches include team badges
3. Check console for match loading statistics

### Why Local Server is Required

Browsers block API requests from local files (`file://` protocol) for security. Opening `index.html` directly will cause CORS errors and badges won't load. Using `http://localhost` solves this.

## Project Structure

```
FootballGuesser/
│
├── index.html                  # Main game page
├── style.css                   # Styling and layout
├── game.js                     # Game logic (V3 - TheSportsDB only)
├── test-thesportsdb-only.html  # Test current architecture
├── README.md                   # Project documentation
├── CLAUDE.md                   # Architecture documentation
└── .gitignore                  # Git ignore rules
```

## Data Source

### Single Source of Truth: TheSportsDB
The game now uses **only TheSportsDB** for everything:

- **Source**: [TheSportsDB.com](https://www.thesportsdb.com/)
- **API**: `eventsseason.php` - season events endpoint
- **What it provides**:
  - ✅ Match results with scores
  - ✅ Team names
  - ✅ Team badges (high-quality official badges)
  - ✅ Match dates
  - ✅ League information
- **Season**: 2024-25
- **Leagues**: Premier League, La Liga, Serie A, Bundesliga, Ligue 1
- **No API key required** - uses free tier
- **No name matching needed** - everything from same source

**How It Works:**
1. Load events from TheSportsDB for each league
2. Filter to finished matches with scores
3. Display matches with badges already included
4. 100% badge coverage guaranteed

**Benefits:**
- ✅ Single API - simpler, more reliable
- ✅ No name matching issues
- ✅ 100% badge coverage - every match has badges
- ✅ Faster loading
- ✅ Cleaner code

### Testing
- Open `test-thesportsdb-only.html` to verify API connection and data loading

## Debugging & Logging

The game includes comprehensive console logging to track data loading:

### Console Output Example
```
Loading match data from TheSportsDB...
Using single source of truth - all data comes from TheSportsDB events
Premier League: 150 matches loaded from TheSportsDB
La Liga: 140 matches loaded from TheSportsDB
Serie A: 145 matches loaded from TheSportsDB
Bundesliga: 130 matches loaded from TheSportsDB
Ligue 1: 125 matches loaded from TheSportsDB

========================================
MATCH LOADING SUMMARY
========================================
Total events processed: 1752
Finished matches loaded: 690
Source: TheSportsDB (single API, no matching needed)
========================================
```

All matches are guaranteed to have team badges since they come from the same source.

## Future Enhancements

Here are some ideas for future improvements:

### 1. **Additional Features**
- Difficulty levels (select different seasons: 2023-24, 2022-23, etc.)
- Player-specific challenges (guess goalscorers)
- Leaderboard with localStorage
- Share results on social media
- Historical stats tracking
- Specific league selection mode
- Daily challenge mode
- Filter by specific matchdays or date ranges

### 2. **Switch to Live Data API**
For live/real-time data, consider upgrading to:
- **API-Football** (api-football.com) - 100 requests/day free
- **football-data.org** - 10 requests/minute free
- **TheSportsDB** - Free API with basic live data

### 3. **UI Improvements**
- Team logos and colors
- Match highlights or images
- Animations for correct/incorrect guesses
- Sound effects
- Dark mode toggle
- Mobile app version

## Customization

### Changing Seasons
To use a different season, edit the season parameter in `game.js`:

```javascript
// In loadMatchData(), change the season parameter:
const response = await fetch(`${THESPORTSDB_API}/eventsseason.php?id=${leagueId}&s=2023-2024`);
// Change s=2024-2025 to s=2023-2024, s=2022-2023, etc.
```

### Changing Number of Rounds
In `game.js`, modify:
```javascript
this.totalRounds = 10; // Change to any number
```

### Adjusting Point Values
Modify the `calculatePoints()` method in `game.js` to change scoring rules.

## License

Feel free to use, modify, and distribute this game!

## Contributing

Want to improve the game? Feel free to:
- Add more matches to the database
- Integrate real APIs
- Improve the UI/UX
- Add new game modes
- Fix bugs

Enjoy the game!
