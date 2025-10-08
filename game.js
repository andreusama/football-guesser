// OpenFootball API URLs for the top 5 European leagues (2024-25 season)
const OPENFOOTBALL_URLS = {
    'Premier League': 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json',
    'La Liga': 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/es.1.json',
    'Serie A': 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/it.1.json',
    'Bundesliga': 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/de.1.json',
    'Ligue 1': 'https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/fr.1.json'
};

const LEAGUE_FLAGS = {
    'Premier League': '🏴',
    'La Liga': '🇪🇸',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷'
};

// TheSportsDB API configuration
const THESPORTSDB_API = 'https://www.thesportsdb.com/api/v1/json/3';

// League IDs in TheSportsDB
const LEAGUE_IDS = {
    'Premier League': '4328',
    'La Liga': '4335',
    'Serie A': '4332',
    'Bundesliga': '4331',
    'Ligue 1': '4334'
};

// Will hold all loaded matches from OpenFootball
let matchDatabase = [];

// Cache for team badges to avoid repeated API calls
const teamBadgeCache = {};

// Track teams that needed placeholders (for debugging/analysis)
const missingTeamBadges = [];

// Team name mapping for TheSportsDB API (cleaned OpenFootball name -> TheSportsDB search name)
const TEAM_NAME_MAPPING = {
    // Premier League (after FC removal)
    'Manchester United': 'Man Utd',
    'Manchester City': 'Man City',
    'Newcastle United': 'Newcastle',
    'Tottenham Hotspur': 'Tottenham',
    'West Ham United': 'West Ham',
    'Nottingham Forest': "Nott'm Forest",
    'Brighton & Hove Albion': 'Brighton',
    'Wolverhampton Wanderers': 'Wolves',
    'AFC Bournemouth': 'Bournemouth',
    'Aston Villa': 'Aston Villa',
    'Brentford': 'Brentford',
    'Crystal Palace': 'Crystal Palace',
    'Chelsea': 'Chelsea',
    'Arsenal': 'Arsenal',
    'Liverpool': 'Liverpool',
    'Fulham': 'Fulham',
    'Everton': 'Everton',
    'Leicester City': 'Leicester',
    'Ipswich Town': 'Ipswich',
    'Southampton': 'Southampton',

    // Ligue 1 (after FC removal)
    'Paris Saint-Germain': 'Paris SG',
    'Olympique de Marseille': 'Marseille',
    'Olympique Lyonnais': 'Lyon',
    'AS Monaco': 'Monaco',
    'OGC Nice': 'Nice',
    'Racing Club de Lens': 'Lens',
    'Stade Rennais 1901': 'Rennes',
    'Lille OSC': 'Lille',
    'Stade de Reims': 'Reims',
    'Montpellier HSC': 'Montpellier',
    'Toulouse': 'Toulouse',
    'Nantes': 'Nantes',
    'Stade Brestois 29': 'Brest',
    'Le Havre AC': 'Le Havre',
    'AS Saint-Étienne': 'Saint-Etienne',
    'RC Strasbourg Alsace': 'Strasbourg',
    'AJ Auxerre': 'Auxerre',
    'Angers SCO': 'Angers',

    // La Liga
    'Atlético Madrid': 'Atletico Madrid',
    'Athletic Club': 'Athletic Bilbao',
    'Real Betis': 'Real Betis',
    'Celta de Vigo': 'Celta Vigo',
    'Deportivo Alavés': 'Alaves',
    'RCD Espanyol': 'Espanyol',
    'Rayo Vallecano': 'Rayo Vallecano',
    'Real Sociedad': 'Real Sociedad',
    'Villarreal': 'Villarreal',
    'Getafe': 'Getafe',
    'Osasuna': 'Osasuna',
    'Girona': 'Girona',
    'Mallorca': 'Mallorca',
    'Las Palmas': 'Las Palmas',
    'Valladolid': 'Valladolid',
    'Leganés': 'Leganes',

    // Serie A
    'AC Milan': 'AC Milan',
    'Inter': 'Inter Milan',
    'Internazionale': 'Inter Milan',
    'Juventus': 'Juventus',
    'AS Roma': 'Roma',
    'SSC Napoli': 'Napoli',
    'Lazio': 'Lazio',
    'Atalanta': 'Atalanta',
    'Fiorentina': 'Fiorentina',
    'Torino': 'Torino',
    'Bologna': 'Bologna',
    'Udinese': 'Udinese',
    'Empoli': 'Empoli',
    'Cagliari': 'Cagliari',
    'Parma': 'Parma',
    'Como': 'Como',
    'Hellas Verona': 'Hellas Verona',
    'Lecce': 'Lecce',
    'Genoa': 'Genoa',
    'Venezia': 'Venezia',
    'Monza': 'Monza',

    // Bundesliga
    'Borussia Dortmund': 'Borussia Dortmund',
    'Borussia M\'gladbach': 'Monchengladbach',
    'Bayern Munich': 'Bayern Munich',
    'Bayern München': 'Bayern Munich',
    'FC Köln': 'FC Cologne',
    '1. FSV Mainz 05': 'Mainz',
    'Eintracht Frankfurt': 'Eintracht Frankfurt',
    'VfL Wolfsburg': 'Wolfsburg',
    'RB Leipzig': 'RB Leipzig',
    'Bayer Leverkusen': 'Bayer Leverkusen',
    'SC Freiburg': 'Freiburg',
    'Union Berlin': 'Union Berlin',
    'VfB Stuttgart': 'Stuttgart',
    'Werder Bremen': 'Werder Bremen',
    'TSG Hoffenheim': 'Hoffenheim',
    'FC Augsburg': 'Augsburg',
    'VfL Bochum': 'Bochum',
    'FC St. Pauli': 'St Pauli',
    'Holstein Kiel': 'Holstein Kiel',
    'FC Heidenheim': 'Heidenheim'
};

class FootballGuesser {
    constructor() {
        this.currentRound = 0;
        this.totalRounds = 10;
        this.score = 0;
        this.currentMatch = null;
        this.usedMatches = [];
        this.isLoading = true;

        this.initializeElements();
        this.attachEventListeners();
        this.loadMatchData();
    }

    async loadMatchData() {
        try {
            console.log('Loading match data from OpenFootball...');
            const allMatches = [];

            // Fetch data from all 5 leagues
            for (const [leagueName, url] of Object.entries(OPENFOOTBALL_URLS)) {
                try {
                    const response = await fetch(url);
                    const data = await response.json();

                    // Process matches from this league
                    if (data.matches && Array.isArray(data.matches)) {
                        data.matches.forEach(match => {
                            // Only include matches with final scores
                            if (match.score && match.score.ft && match.score.ft.length === 2) {
                                allMatches.push({
                                    league: leagueName,
                                    home: this.cleanTeamName(match.team1),
                                    away: this.cleanTeamName(match.team2),
                                    homeScore: match.score.ft[0],
                                    awayScore: match.score.ft[1],
                                    date: match.date,
                                    flag: LEAGUE_FLAGS[leagueName]
                                });
                            }
                        });
                    }
                    console.log(`Loaded ${leagueName}: ${data.matches.length} matches`);
                } catch (error) {
                    console.error(`Error loading ${leagueName}:`, error);
                }
            }

            matchDatabase = allMatches;
            console.log(`Total matches loaded: ${matchDatabase.length}`);

            this.isLoading = false;

            // Hide loading screen and show game
            this.loadingScreen.classList.add('hidden');
            this.gameContainer.classList.remove('hidden');

            this.startNewGame();
        } catch (error) {
            console.error('Error loading match data:', error);
            this.loadingScreen.innerHTML = '<p style="color: #721c24;">Failed to load match data. Please refresh the page.</p>';
        }
    }

    cleanTeamName(name) {
        // Remove common suffixes like "FC", "AFC", etc. for cleaner display
        return name
            .replace(/ FC$/, '')
            .replace(/ AFC$/, '')
            .replace(/ CF$/, '')
            .replace(/ United FC$/, ' United')
            .trim();
    }

    async fetchTeamBadge(teamName) {
        // ===== CHECK CACHE =====
        // Return cached badge if available to avoid duplicate API calls
        if (teamBadgeCache[teamName]) {
            console.log(`[CACHE] Using cached badge for "${teamName}"`);
            return teamBadgeCache[teamName];
        }

        console.log(`\n[START] Fetching badge for "${teamName}"...`);

        // ===== ONLY SOURCE: TheSportsDB =====
        // Try to find badge from TheSportsDB - if not found, return null to skip this match
        console.log(`[SEARCHING] TheSportsDB...`);
        const sportsDBBadge = await this.fetchFromSportsDB(teamName);
        if (sportsDBBadge) {
            console.log(`[SUCCESS] Badge found via TheSportsDB for "${teamName}"\n`);
            return sportsDBBadge;
        }

        // ===== BADGE NOT FOUND =====
        // Track this team as missing and return null to skip the match
        console.log(`[FAILED] TheSportsDB did not have badge for "${teamName}"`);

        if (!missingTeamBadges.includes(teamName)) {
            missingTeamBadges.push(teamName);
            console.log(`[TRACKED] Added "${teamName}" to missing teams list`);
        }

        console.log(`[SKIP] Match will be skipped - no badge available\n`);
        teamBadgeCache[teamName] = null; // Cache the failure to avoid retrying
        return null;
    }

    async fetchFromSportsDB(teamName) {
        // Generate multiple search term variations to maximize chance of finding team
        const searchTerms = this.generateSearchTerms(teamName);
        console.log(`  → Will try ${searchTerms.length} search variations: ${searchTerms.join(', ')}`);

        // Try each search term sequentially until one works
        for (let i = 0; i < searchTerms.length; i++) {
            const searchTerm = searchTerms[i];

            try {
                console.log(`  → Attempt ${i + 1}/${searchTerms.length}: Searching for "${searchTerm}"`);

                // URL encode the search term for API call
                const searchName = encodeURIComponent(searchTerm);
                const response = await fetch(`${THESPORTSDB_API}/searchteams.php?t=${searchName}`);

                // ===== ERROR: Rate Limit =====
                if (response.status === 429) {
                    console.error(`  [ERROR] Rate limit hit! Waiting 1 second before retry...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                // ===== ERROR: Bad Response =====
                if (!response.ok) {
                    console.error(`  [ERROR] API returned status ${response.status}`);
                    continue;
                }

                const data = await response.json();

                // ===== SUCCESS: Team Found =====
                if (data.teams && data.teams.length > 0) {
                    // Prefer soccer/football teams over other sports
                    const footballTeam = data.teams.find(team => team.strSport === 'Soccer');

                    if (footballTeam) {
                        const badge = footballTeam.strBadge;
                        teamBadgeCache[teamName] = badge;
                        console.log(`  [SUCCESS] Found soccer team: ${footballTeam.strTeam}`);
                        return badge;
                    }

                    // No soccer team found, use first result
                    const badge = data.teams[0].strBadge;
                    teamBadgeCache[teamName] = badge;
                    console.log(`  [SUCCESS] Found team: ${data.teams[0].strTeam} (${data.teams[0].strSport})`);
                    return badge;
                }

                // No results for this search term
                console.log(`  → No results for "${searchTerm}"`);

            } catch (error) {
                // ===== ERROR: Network or Parse Error =====
                console.error(`  [ERROR] ${error.message}`);
                continue;
            }
        }

        // All search attempts failed
        return null;
    }

    async fetchFromWikipedia(teamName) {
        try {
            // Generate multiple Wikipedia search variations
            const searchVariations = this.generateWikipediaSearchTerms(teamName);
            console.log(`  → Will try ${searchVariations.length} Wikipedia variations: ${searchVariations.join(', ')}`);

            // Try each variation until we find a page with an image
            for (let i = 0; i < searchVariations.length; i++) {
                const searchTerm = searchVariations[i];
                console.log(`  → Attempt ${i + 1}/${searchVariations.length}: Searching for "${searchTerm}"`);

                const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(searchTerm)}&prop=pageimages&pithumbsize=300`;
                const response = await fetch(wikiSearchUrl);

                // ===== ERROR: Bad Response =====
                if (!response.ok) {
                    console.error(`  [ERROR] Wikipedia API returned status ${response.status}`);
                    continue;
                }

                const data = await response.json();

                // Check if page exists and has thumbnail
                if (data.query && data.query.pages) {
                    const pages = data.query.pages;
                    const pageId = Object.keys(pages)[0];

                    // ===== SUCCESS: Found page with image =====
                    if (pageId !== '-1' && pages[pageId].thumbnail) {
                        const badgeUrl = pages[pageId].thumbnail.source;
                        teamBadgeCache[teamName] = badgeUrl;
                        console.log(`  [SUCCESS] Found badge on Wikipedia page "${searchTerm}"`);
                        return badgeUrl;
                    }
                }

                console.log(`  → No image found for "${searchTerm}"`);

                // Small delay between attempts to be respectful to Wikipedia API
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // All variations failed
            return null;

        } catch (error) {
            // ===== ERROR: Network or Parse Error =====
            console.error(`  [ERROR] Wikipedia fetch failed: ${error.message}`);
            return null;
        }
    }

    generateWikipediaSearchTerms(teamName) {
        // Generate multiple Wikipedia page title variations
        // Wikipedia often uses "Team Name F.C." format with ampersands
        const variations = [];

        // 1. Original name
        variations.push(teamName);

        // 2. With F.C. (with periods)
        variations.push(`${teamName} F.C.`);

        // 3. With FC (no periods)
        variations.push(`${teamName} FC`);

        // 4. Replace "and" with "&"
        if (teamName.toLowerCase().includes(' and ')) {
            const withAmpersand = teamName.replace(/ and /gi, ' & ');
            variations.push(withAmpersand);
            variations.push(`${withAmpersand} F.C.`);
            variations.push(`${withAmpersand} FC`);
        }

        // 5. Replace "&" with "and"
        if (teamName.includes('&')) {
            const withAnd = teamName.replace(/&/g, 'and');
            variations.push(withAnd);
            variations.push(`${withAnd} F.C.`);
            variations.push(`${withAnd} FC`);
        }

        // Remove duplicates and return
        return [...new Set(variations)];
    }

    generatePlaceholderBadge(teamName) {
        // Extract initials from team name (up to 3 letters)
        // Example: "Paris Saint-Germain" -> "PSG", "Real Madrid" -> "RM"
        const initials = teamName
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 3)
            .toUpperCase();

        // Generate consistent color based on team name hash
        // Same team will always get same color
        let hash = 0;
        for (let i = 0; i < teamName.length; i++) {
            hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360; // Convert hash to hue (0-360)
        const color = `hsl(${hue}, 60%, 45%)`; // Saturation 60%, Lightness 45%

        // Create SVG badge with circular background and initials
        const svg = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="${color}" stroke="#ffffff" stroke-width="3"/>
                <text x="50" y="50" text-anchor="middle" dominant-baseline="middle"
                      font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff">
                    ${initials}
                </text>
            </svg>
        `)}`;

        console.log(`  [SUCCESS] Generated placeholder badge: "${initials}" with color ${color}`);
        return svg;
    }

    generateSearchTerms(teamName) {
        const terms = [];

        // 1. Try mapped name first
        const mappedName = TEAM_NAME_MAPPING[teamName];
        if (mappedName) {
            terms.push(mappedName);
        }

        // 2. Try original cleaned name
        terms.push(teamName);

        // 3. Try first word only (e.g., "Hellas Verona" -> "Hellas")
        const firstWord = teamName.split(' ')[0];
        if (firstWord !== teamName && firstWord.length > 3) {
            terms.push(firstWord);
        }

        // 4. Try last word only (e.g., "Hellas Verona" -> "Verona")
        const words = teamName.split(' ');
        const lastWord = words[words.length - 1];
        if (lastWord !== teamName && lastWord.length > 3) {
            terms.push(lastWord);
        }

        // 5. Try without common prefixes
        const withoutPrefix = teamName
            .replace(/^FC /, '')
            .replace(/^CF /, '')
            .replace(/^AC /, '')
            .replace(/^AS /, '')
            .replace(/^SC /, '')
            .replace(/^US /, '')
            .replace(/^RC /, '');
        if (withoutPrefix !== teamName) {
            terms.push(withoutPrefix);
        }

        // Remove duplicates
        return [...new Set(terms)];
    }

    async fetchLeagueBadge(leagueName) {
        // Check cache first
        const cacheKey = `league_${leagueName}`;
        if (teamBadgeCache[cacheKey]) {
            return teamBadgeCache[cacheKey];
        }

        try {
            const leagueId = LEAGUE_IDS[leagueName];
            const response = await fetch(`${THESPORTSDB_API}/lookupleague.php?id=${leagueId}`);
            const data = await response.json();

            if (data.leagues && data.leagues.length > 0) {
                const badge = data.leagues[0].strBadge;
                teamBadgeCache[cacheKey] = badge;
                return badge;
            }

            return null;
        } catch (error) {
            console.error(`Error fetching badge for ${leagueName}:`, error);
            return null;
        }
    }

    initializeElements() {
        // UI elements
        this.scoreDisplay = document.getElementById('score');
        this.roundDisplay = document.getElementById('round');
        this.leagueName = document.getElementById('league-name');
        this.matchDate = document.getElementById('match-date');
        this.homeTeam = document.getElementById('home-team');
        this.awayTeam = document.getElementById('away-team');
        this.homeScoreInput = document.getElementById('home-score');
        this.awayScoreInput = document.getElementById('away-score');
        this.submitBtn = document.getElementById('submit-guess');
        this.nextBtn = document.getElementById('next-round');
        this.resultSection = document.getElementById('result-section');
        this.actualHome = document.getElementById('actual-home');
        this.actualAway = document.getElementById('actual-away');
        this.pointsMessage = document.getElementById('points-message');
        this.gameContainer = document.getElementById('game-container');
        this.gameOver = document.getElementById('game-over');
        this.finalScore = document.getElementById('final-score');
        this.performanceMessage = document.getElementById('performance-message');
        this.playAgainBtn = document.getElementById('play-again');
        this.teamLogos = document.querySelectorAll('.team-logo');
        this.loadingScreen = document.getElementById('loading-screen');
    }

    attachEventListeners() {
        this.submitBtn.addEventListener('click', () => this.submitGuess());
        this.nextBtn.addEventListener('click', () => this.nextRound());
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());

        // Allow Enter key to submit
        this.homeScoreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitGuess();
        });
        this.awayScoreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitGuess();
        });
    }

    startNewGame() {
        if (this.isLoading || matchDatabase.length === 0) {
            console.log('Still loading match data...');
            return;
        }

        this.currentRound = 0;
        this.score = 0;
        this.usedMatches = [];
        this.gameOver.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        this.updateScore();
        this.nextRound();
    }

    getRandomMatch() {
        // Get matches that haven't been used yet
        const availableMatches = matchDatabase.filter(
            match => !this.usedMatches.includes(match)
        );

        if (availableMatches.length === 0) {
            // If all matches used, reset
            this.usedMatches = [];
            return matchDatabase[Math.floor(Math.random() * matchDatabase.length)];
        }

        const randomMatch = availableMatches[Math.floor(Math.random() * availableMatches.length)];
        this.usedMatches.push(randomMatch);
        return randomMatch;
    }

    async nextRound() {
        if (this.currentRound >= this.totalRounds) {
            this.endGame();
            return;
        }

        this.currentRound++;

        // Try to find a match with available badges
        let matchFound = false;
        let attempts = 0;
        const maxAttempts = 50; // Prevent infinite loop

        while (!matchFound && attempts < maxAttempts) {
            attempts++;
            this.currentMatch = this.getRandomMatch();

            // Check if badges exist for both teams
            const homeBadge = await this.fetchTeamBadge(this.currentMatch.home);
            await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit delay
            const awayBadge = await this.fetchTeamBadge(this.currentMatch.away);

            // If both badges found, use this match
            if (homeBadge && awayBadge) {
                matchFound = true;
            } else {
                console.log(`[SKIP] Skipping match: ${this.currentMatch.home} vs ${this.currentMatch.away}`);
            }
        }

        if (!matchFound) {
            console.error('[ERROR] Could not find match with available badges after 50 attempts');
            alert('Unable to load matches. Please check console and export missing teams.');
            return;
        }

        // Update UI
        this.roundDisplay.textContent = this.currentRound;
        this.leagueName.textContent = this.currentMatch.league;
        this.homeTeam.textContent = this.currentMatch.home;
        this.awayTeam.textContent = this.currentMatch.away;

        // Display actual match date
        this.matchDate.textContent = this.formatDate(this.currentMatch.date);

        // Display team badges (already fetched above)
        this.loadTeamBadges();

        // Fetch and display league logo
        this.loadLeagueLogo();

        // Reset inputs
        this.homeScoreInput.value = 0;
        this.awayScoreInput.value = 0;

        // Show guess section, hide result
        this.resultSection.classList.add('hidden');
        this.submitBtn.disabled = false;
    }

    async loadTeamBadges() {
        const teamLogosArray = Array.from(this.teamLogos);

        // Show loading placeholder
        teamLogosArray.forEach(logo => {
            logo.innerHTML = '<div class="badge-loader"></div>';
        });

        // Fetch badges for both teams with a small delay to avoid rate limiting
        const homeBadge = await this.fetchTeamBadge(this.currentMatch.home);

        // Small delay between requests to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 300));

        const awayBadge = await this.fetchTeamBadge(this.currentMatch.away);

        // Update home team badge
        if (homeBadge && teamLogosArray[0]) {
            teamLogosArray[0].innerHTML = `<img src="${homeBadge}" alt="${this.currentMatch.home}" class="team-badge">`;
        } else if (teamLogosArray[0]) {
            teamLogosArray[0].innerHTML = '';
        }

        // Update away team badge
        if (awayBadge && teamLogosArray[1]) {
            teamLogosArray[1].innerHTML = `<img src="${awayBadge}" alt="${this.currentMatch.away}" class="team-badge">`;
        } else if (teamLogosArray[1]) {
            teamLogosArray[1].innerHTML = '';
        }
    }

    async loadLeagueLogo() {
        const leagueBadgeElement = document.getElementById('league-badge-img');
        if (!leagueBadgeElement) return;

        leagueBadgeElement.style.display = 'none';

        const leagueBadge = await this.fetchLeagueBadge(this.currentMatch.league);
        if (leagueBadge) {
            leagueBadgeElement.src = leagueBadge;
            leagueBadgeElement.style.display = 'inline-block';
        }
    }

    formatDate(dateString) {
        // Convert date from YYYY-MM-DD to readable format
        if (!dateString) return 'Unknown date';

        const date = new Date(dateString);
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    submitGuess() {
        const guessedHome = parseInt(this.homeScoreInput.value);
        const guessedAway = parseInt(this.awayScoreInput.value);

        const actualHome = this.currentMatch.homeScore;
        const actualAway = this.currentMatch.awayScore;

        // Calculate points
        const points = this.calculatePoints(guessedHome, guessedAway, actualHome, actualAway);
        this.score += points;

        // Show results
        this.actualHome.textContent = actualHome;
        this.actualAway.textContent = actualAway;
        this.displayResult(points, guessedHome, guessedAway, actualHome, actualAway);

        // Update score display
        this.updateScore();

        // Show result section
        this.resultSection.classList.remove('hidden');
        this.submitBtn.disabled = true;
    }

    calculatePoints(guessedHome, guessedAway, actualHome, actualAway) {
        // Exact score: 10 points
        if (guessedHome === actualHome && guessedAway === actualAway) {
            return 10;
        }

        // Correct goal difference and result: 7 points
        const guessedDiff = guessedHome - guessedAway;
        const actualDiff = actualHome - actualAway;
        const guessedResult = guessedDiff > 0 ? 'home' : guessedDiff < 0 ? 'away' : 'draw';
        const actualResult = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'draw';

        if (guessedDiff === actualDiff && guessedResult === actualResult) {
            return 7;
        }

        // Correct result (winner or draw): 5 points
        if (guessedResult === actualResult) {
            return 5;
        }

        // One score correct: 3 points
        if (guessedHome === actualHome || guessedAway === actualAway) {
            return 3;
        }

        // No points
        return 0;
    }

    displayResult(points, guessedHome, guessedAway, actualHome, actualAway) {
        let message = '';
        let className = '';

        if (points === 10) {
            message = `Perfect! Exact score! +${points} points`;
            className = 'excellent';
        } else if (points === 7) {
            message = `Great! Correct goal difference! +${points} points`;
            className = 'excellent';
        } else if (points === 5) {
            message = `Good! Correct result! +${points} points`;
            className = 'good';
        } else if (points === 3) {
            message = `Not bad! One score correct! +${points} points`;
            className = 'okay';
        } else {
            message = `Wrong guess! +${points} points`;
            className = 'poor';
        }

        this.pointsMessage.textContent = message;
        this.pointsMessage.className = `points-earned ${className}`;
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score;
    }

    endGame() {
        this.gameContainer.classList.add('hidden');
        this.gameOver.classList.remove('hidden');
        this.finalScore.textContent = this.score;

        const maxScore = this.totalRounds * 10;
        const percentage = (this.score / maxScore) * 100;

        let message = '';
        if (percentage >= 80) {
            message = 'Outstanding! You\'re a football expert!';
        } else if (percentage >= 60) {
            message = 'Great job! You know your football!';
        } else if (percentage >= 40) {
            message = 'Good effort! Keep practicing!';
        } else {
            message = 'Room for improvement! Try again!';
        }

        this.performanceMessage.textContent = message;
    }
}

// Function to export missing teams to a downloadable file
function exportMissingTeams() {
    if (missingTeamBadges.length === 0) {
        console.log('[EXPORT] No missing teams to export - all badges found!');
        alert('Great! All teams have badges from TheSportsDB. No missing teams to export.');
        return;
    }

    // Create file content
    const content = `# Missing Team Badges Report
# Generated: ${new Date().toISOString()}
# Teams not found in TheSportsDB - matches with these teams were SKIPPED
# Total: ${missingTeamBadges.length} teams

${missingTeamBadges.map((team, index) => `${index + 1}. ${team}`).join('\n')}

---
IMPORTANT: These teams need badges to appear in the game.

Next Steps:
1. Search for each team manually on https://www.thesportsdb.com/
2. If found with different name, add mapping to TEAM_NAME_MAPPING in game.js
3. If not found, manually add the badge URL to the code
4. Refresh and test again
`;

    // Create download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MissingTeams.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[EXPORT] Successfully exported ${missingTeamBadges.length} missing teams to MissingTeams.txt`);
}

// Function to show missing teams in console
function showMissingTeams() {
    console.log('\n========================================');
    console.log('MISSING TEAMS REPORT');
    console.log('========================================');

    if (missingTeamBadges.length === 0) {
        console.log('No missing teams! All badges found.');
    } else {
        console.log(`Total teams using placeholders: ${missingTeamBadges.length}\n`);
        missingTeamBadges.forEach((team, index) => {
            console.log(`${index + 1}. ${team}`);
        });
    }

    console.log('========================================\n');
    console.log('To export this list, run: exportMissingTeams()');
}

// Make functions globally available
window.exportMissingTeams = exportMissingTeams;
window.showMissingTeams = showMissingTeams;

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new FootballGuesser();

    // Log available debug commands
    console.log('\n========================================');
    console.log('DEBUG COMMANDS AVAILABLE:');
    console.log('========================================');
    console.log('showMissingTeams()    - Display missing teams in console');
    console.log('exportMissingTeams()  - Download MissingTeams.txt file');
    console.log('========================================\n');
});
