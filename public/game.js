// League configuration
const LEAGUE_FLAGS = {
    'Premier League': 'ENG',
    'La Liga': '🇪🇸',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷'
};

// TheSportsDB API configuration - using Vercel serverless function to avoid CORS
const THESPORTSDB_API = '/api/sportsdb';

// League IDs in TheSportsDB
const LEAGUE_IDS = {
    'Premier League': '4328',
    'La Liga': '4335',
    'Serie A': '4332',
    'Bundesliga': '4331',
    'Ligue 1': '4334'
};

// Will hold all loaded matches from TheSportsDB
let matchDatabase = [];

// Cache for league badges to avoid repeated API calls
const leagueBadgeCache = {};

class FootballGuesser {
    constructor() {
        this.currentRound = 0;
        this.totalRounds = 10;
        this.score = 0;
        this.currentMatch = null;
        this.usedMatches = [];
        this.isLoading = true;
        this.selectedLeague = null; // null means "All Leagues"
        this.selectedTeam = null; // null means "All Teams"
        this.availableMatches = []; // Filtered matches based on selected league/team

        this.initializeElements();
        this.attachEventListeners();
        this.loadMatchData();
    }

    async loadMatchData() {
        try {
            console.log('Loading match data from TheSportsDB...');
            console.log('Using single source of truth - all data comes from TheSportsDB events');
            const allMatches = [];
            let totalEventsProcessed = 0;

            // Fetch events from all 5 leagues
            for (const leagueName of Object.keys(LEAGUE_IDS)) {
                try {
                    const leagueId = LEAGUE_IDS[leagueName];
                    const response = await fetch(`${THESPORTSDB_API}?endpoint=eventsseason.php&id=${leagueId}&s=2024-2025`);
                    const data = await response.json();

                    // Process events from this league
                    if (data.events && Array.isArray(data.events)) {
                        totalEventsProcessed += data.events.length;

                        for (const event of data.events) {
                            // Only include finished matches with scores
                            if (event.strStatus === 'Match Finished' &&
                                event.intHomeScore !== null &&
                                event.intAwayScore !== null) {

                                allMatches.push({
                                    league: leagueName,
                                    home: event.strHomeTeam,
                                    away: event.strAwayTeam,
                                    homeScore: parseInt(event.intHomeScore),
                                    awayScore: parseInt(event.intAwayScore),
                                    date: event.dateEvent,
                                    flag: LEAGUE_FLAGS[leagueName],
                                    // Store team data directly from event
                                    homeTeamData: {
                                        idTeam: event.idHomeTeam,
                                        strTeam: event.strHomeTeam,
                                        strBadge: event.strHomeTeamBadge
                                    },
                                    awayTeamData: {
                                        idTeam: event.idAwayTeam,
                                        strTeam: event.strAwayTeam,
                                        strBadge: event.strAwayTeamBadge
                                    }
                                });
                            }
                        }
                    }

                    const includedCount = allMatches.filter(m => m.league === leagueName).length;
                    console.log(`${leagueName}: ${includedCount} matches loaded from TheSportsDB`);
                } catch (error) {
                    console.error(`Error loading ${leagueName}:`, error);
                }
            }

            matchDatabase = allMatches;

            console.log('\n========================================');
            console.log('MATCH LOADING SUMMARY');
            console.log('========================================');
            console.log(`Total events processed: ${totalEventsProcessed}`);
            console.log(`Finished matches loaded: ${matchDatabase.length}`);
            console.log(`Source: TheSportsDB (single API, no matching needed)`);
            console.log('========================================\n');

            this.isLoading = false;

            // Hide loading screen and show league selection
            this.loadingScreen.classList.add('hidden');
            this.showLeagueSelection();
        } catch (error) {
            console.error('Error loading match data:', error);
            this.loadingScreen.innerHTML = '<p style="color: #721c24;">Failed to load match data. Please refresh the page.</p>';
        }
    }

    getTeamBadge(teamData) {
        // Direct badge URL lookup from TheSportsDB team data
        // teamData is already pre-loaded and stored in match object during loadMatchData()
        return teamData ? teamData.strBadge : null;
    }

    async fetchLeagueBadge(leagueName) {
        // Check cache first
        if (leagueBadgeCache[leagueName]) {
            return leagueBadgeCache[leagueName];
        }

        try {
            const leagueId = LEAGUE_IDS[leagueName];
            const response = await fetch(`${THESPORTSDB_API}?endpoint=lookupleague.php&id=${leagueId}`);
            const data = await response.json();

            if (data.leagues && data.leagues.length > 0) {
                const badge = data.leagues[0].strBadge;
                leagueBadgeCache[leagueName] = badge;
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
        this.changeLeagueBtn = document.getElementById('change-league');
        this.teamLogos = document.querySelectorAll('.team-logo');
        this.loadingScreen = document.getElementById('loading-screen');
        this.leagueSelection = document.getElementById('league-selection');
        this.leagueCards = document.querySelectorAll('.league-card');
        this.teamSelection = document.getElementById('team-selection');
        this.teamGrid = document.getElementById('team-grid');
        this.playAllTeamsBtn = document.getElementById('play-all-teams');
        this.backToLeaguesBtn = document.getElementById('back-to-leagues');
        this.selectedLeagueNameSpan = document.getElementById('selected-league-name');
    }

    attachEventListeners() {
        this.submitBtn.addEventListener('click', () => this.submitGuess());
        this.nextBtn.addEventListener('click', () => this.nextRound());
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        this.changeLeagueBtn.addEventListener('click', () => this.showLeagueSelection());
        this.playAllTeamsBtn.addEventListener('click', () => this.selectTeam(null));
        this.backToLeaguesBtn.addEventListener('click', () => this.showLeagueSelection());

        // League selection cards
        this.leagueCards.forEach(card => {
            card.addEventListener('click', () => {
                const league = card.getAttribute('data-league');
                this.selectLeague(league);
            });
        });

        // Allow Enter key to submit
        this.homeScoreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitGuess();
        });
        this.awayScoreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitGuess();
        });
    }

    async showLeagueSelection() {
        // Update match counts for each league
        const leagueCounts = {};
        matchDatabase.forEach(match => {
            leagueCounts[match.league] = (leagueCounts[match.league] || 0) + 1;
        });

        document.getElementById('count-premier').textContent = `${leagueCounts['Premier League'] || 0} matches`;
        document.getElementById('count-laliga').textContent = `${leagueCounts['La Liga'] || 0} matches`;
        document.getElementById('count-seriea').textContent = `${leagueCounts['Serie A'] || 0} matches`;
        document.getElementById('count-bundesliga').textContent = `${leagueCounts['Bundesliga'] || 0} matches`;
        document.getElementById('count-ligue1').textContent = `${leagueCounts['Ligue 1'] || 0} matches`;
        document.getElementById('count-all').textContent = `${matchDatabase.length} matches`;

        // Load league badges for selection screen
        await this.loadLeagueBadgesForSelection();

        // Show league selection, hide ALL other screens
        this.leagueSelection.classList.remove('hidden');
        this.teamSelection.classList.add('hidden');
        this.gameContainer.classList.add('hidden');
        this.gameOver.classList.add('hidden');

        // Reset selections
        this.selectedLeague = null;
        this.selectedTeam = null;
    }

    async loadLeagueBadgesForSelection() {
        const leagueBadgeMap = {
            'Premier League': 'badge-premier',
            'La Liga': 'badge-laliga',
            'Serie A': 'badge-seriea',
            'Bundesliga': 'badge-bundesliga',
            'Ligue 1': 'badge-ligue1'
        };

        for (const [leagueName, badgeId] of Object.entries(leagueBadgeMap)) {
            const badgeElement = document.getElementById(badgeId);
            const flagElement = badgeElement.nextElementSibling;

            // Fetch league badge
            const badge = await this.fetchLeagueBadge(leagueName);
            if (badge && badgeElement) {
                badgeElement.src = badge;
                badgeElement.style.display = 'block';
                if (flagElement) {
                    flagElement.style.display = 'none';
                }
            }
        }
    }

    selectLeague(league) {
        console.log(`League selected: ${league}`);
        this.selectedLeague = league;

        // "All Leagues" goes directly to game (no team selection)
        if (league === 'All Leagues') {
            this.availableMatches = matchDatabase;
            this.selectedTeam = null;
            console.log(`Available matches: ${this.availableMatches.length}`);

            // Hide league selection and start game
            this.leagueSelection.classList.add('hidden');
            this.startNewGame();
        } else {
            // Show team selection for specific leagues
            this.showTeamSelection(league);
        }
    }

    async showTeamSelection(leagueName) {
        this.selectedLeagueNameSpan.textContent = leagueName;

        // Get unique teams from selected league
        const leagueMatches = matchDatabase.filter(match => match.league === leagueName);
        const teamsMap = new Map();

        leagueMatches.forEach(match => {
            // Add home team
            if (!teamsMap.has(match.homeTeamData.idTeam)) {
                teamsMap.set(match.homeTeamData.idTeam, {
                    id: match.homeTeamData.idTeam,
                    name: match.homeTeamData.strTeam,
                    badge: match.homeTeamData.strBadge
                });
            }
            // Add away team
            if (!teamsMap.has(match.awayTeamData.idTeam)) {
                teamsMap.set(match.awayTeamData.idTeam, {
                    id: match.awayTeamData.idTeam,
                    name: match.awayTeamData.strTeam,
                    badge: match.awayTeamData.strBadge
                });
            }
        });

        const teams = Array.from(teamsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        // Build team grid
        this.teamGrid.innerHTML = '';
        teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.setAttribute('data-team-id', team.id);
            teamCard.innerHTML = `
                <img src="${team.badge}" alt="${team.name}" class="team-card-badge">
                <span class="team-card-name">${team.name}</span>
            `;
            teamCard.addEventListener('click', () => this.selectTeam(team.name));
            this.teamGrid.appendChild(teamCard);
        });

        // Hide league selection, show team selection
        this.leagueSelection.classList.add('hidden');
        this.teamSelection.classList.remove('hidden');
    }

    selectTeam(teamName) {
        this.selectedTeam = teamName;

        if (teamName === null) {
            // Play with all teams from selected league
            this.availableMatches = matchDatabase.filter(match => match.league === this.selectedLeague);
            console.log(`Playing with all teams from ${this.selectedLeague}: ${this.availableMatches.length} matches`);
        } else {
            // Filter to matches where selected team plays (home or away)
            this.availableMatches = matchDatabase.filter(match =>
                match.league === this.selectedLeague &&
                (match.home === teamName || match.away === teamName)
            );
            console.log(`Playing with ${teamName}: ${this.availableMatches.length} matches`);
        }

        // Hide team selection and start game
        this.teamSelection.classList.add('hidden');
        this.startNewGame();
    }

    startNewGame() {
        if (this.isLoading || matchDatabase.length === 0) {
            console.log('Still loading match data...');
            return;
        }

        if (this.availableMatches.length === 0) {
            console.log('No league selected yet');
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
        // Get matches from selected league that haven't been used yet
        const unusedMatches = this.availableMatches.filter(
            match => !this.usedMatches.includes(match)
        );

        if (unusedMatches.length === 0) {
            // If all matches used, reset
            this.usedMatches = [];
            return this.availableMatches[Math.floor(Math.random() * this.availableMatches.length)];
        }

        const randomMatch = unusedMatches[Math.floor(Math.random() * unusedMatches.length)];
        this.usedMatches.push(randomMatch);
        return randomMatch;
    }

    async nextRound() {
        if (this.currentRound >= this.totalRounds) {
            this.endGame();
            return;
        }

        this.currentRound++;

        // All matches in database have confirmed badges - just pick one randomly
        this.currentMatch = this.getRandomMatch();

        // Update UI
        this.roundDisplay.textContent = this.currentRound;
        this.leagueName.textContent = this.currentMatch.league;
        this.homeTeam.textContent = this.currentMatch.home;
        this.awayTeam.textContent = this.currentMatch.away;

        // Display actual match date
        this.matchDate.textContent = this.formatDate(this.currentMatch.date);

        // Display team badges (data already loaded in match object)
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

    loadTeamBadges() {
        const teamLogosArray = Array.from(this.teamLogos);

        // Get badge URLs directly from pre-loaded team data
        const homeBadge = this.getTeamBadge(this.currentMatch.homeTeamData);
        const awayBadge = this.getTeamBadge(this.currentMatch.awayTeamData);

        // Update home team badge
        if (homeBadge && teamLogosArray[0]) {
            teamLogosArray[0].innerHTML = `<img src="${homeBadge}" alt="${this.currentMatch.home}" class="team-badge">`;
        }

        // Update away team badge
        if (awayBadge && teamLogosArray[1]) {
            teamLogosArray[1].innerHTML = `<img src="${awayBadge}" alt="${this.currentMatch.away}" class="team-badge">`;
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

// Start the game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new FootballGuesser();
});
