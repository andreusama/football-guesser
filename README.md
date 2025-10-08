# Football Results Guesser

A web-based game where you guess the final scores of **real football matches** from Europe's top 5 leagues: Premier League, La Liga, Serie A, Bundesliga, and Ligue 1.

Uses real match data from the **2024-25 season** via [OpenFootball](https://github.com/openfootball/football.json) - a free, open-source football database.

## How to Play

1. Open `index.html` in your web browser
2. Wait for real match data to load from OpenFootball
3. You'll see a random match from one of the top 5 European leagues
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

1. Open browser console (F12) to see badge loading logs
2. Play the game - matches without badges will be automatically skipped
3. After playing, run `exportMissingTeams()` in console to see which teams need manual badges

### Why Local Server is Required

Browsers block API requests from local files (`file://` protocol) for security. Opening `index.html` directly will cause CORS errors and badges won't load. Using `http://localhost` solves this.

## Project Structure

```
FootballGuesser/
│
├── index.html         # Main game page
├── style.css          # Styling and layout
├── game.js            # Game logic with multi-source badge system
├── test.html          # Test OpenFootball API connection
├── test-badges.html   # Test TheSportsDB badge loading
├── debug-badges.html  # Debug tool for badge search attempts
├── README.md          # Project documentation
├── BADGE_FIXES.md     # Badge loading fixes and CORS guide
└── DEBUG_GUIDE.md     # Comprehensive debugging guide
```

## Data Sources

### Match Data: OpenFootball
The game uses **OpenFootball** - a free, open-source football database:
- **Source**: [OpenFootball GitHub](https://github.com/openfootball/football.json)
- **Season**: 2024-25
- **Leagues**: Premier League, La Liga, Serie A, Bundesliga, Ligue 1
- **No API key required**
- **Data loaded dynamically** when you start the game

### Team Badges & League Logos: TheSportsDB Only
Team badges are fetched from **TheSportsDB** - a reliable, high-quality badge source:

**Badge Source: TheSportsDB**
- **Source**: [TheSportsDB.com](https://www.thesportsdb.com/)
- High-quality official team badges
- Free API, no registration required
- Cached results minimize API calls

**How It Works:**
1. Game fetches badges from TheSportsDB for both teams
2. If BOTH badges found → Match is displayed
3. If ANY badge missing → Match is skipped, team added to missing list
4. You can export missing teams and manually add badges

**Benefits:**
- Only reliable, official badges shown
- No unreliable fallback sources
- Clean, professional appearance
- Easy to identify and fix missing badges

### Testing the APIs
- **Match Data**: Open `test.html` to verify OpenFootball connection and see available matches
- **Badges**: Open `test-badges.html` to test TheSportsDB badge loading for all leagues

## Debugging & Logging

The game includes comprehensive console logging to track badge loading:

### Console Commands
Open browser console (F12) while playing and use these commands:

- `showMissingTeams()` - Display teams that needed placeholder badges
- `exportMissingTeams()` - Download `MissingTeams.txt` file with all teams missing badges

### Log Format
All badge operations are logged with clear prefixes:
- `[CACHE]` - Badge from cache
- `[SUCCESS]` - Operation succeeded
- `[FAILED]` - Trying next source
- `[ERROR]` - Error occurred
- `[TRACKED]` - Team added to missing list

**See `DEBUG_GUIDE.md` for detailed debugging information.**

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
To use a different season, edit the URLs in `game.js`:

```javascript
const OPENFOOTBALL_URLS = {
    'Premier League': 'https://raw.githubusercontent.com/openfootball/football.json/master/2023-24/en.1.json',
    // Change 2024-25 to 2023-24, 2022-23, etc.
};
```

Available seasons in OpenFootball: 2024-25, 2023-24, 2022-23, 2021-22, and many more historical seasons.

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
