// League configuration
const LEAGUE_FLAGS = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'La Liga': '🇪🇸',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷',
    'Champions League': '🏆'
};

// Football-Data.org API configuration - using Vercel serverless function to avoid CORS
const FOOTBALL_DATA_API = '/api/football-data';

// Competition codes in Football-Data.org
const COMPETITION_CODES = {
    'Premier League': 'PL',
    'La Liga': 'PD',
    'Serie A': 'SA',
    'Bundesliga': 'BL1',
    'Ligue 1': 'FL1',
    'Champions League': 'CL'
};

// TheSportsDB API for league badges - using Vercel serverless function
const THESPORTSDB_API = '/api/sportsdb';

// League IDs in TheSportsDB for badges
const LEAGUE_IDS = {
    'Premier League': '4328',
    'La Liga': '4335',
    'Serie A': '4332',
    'Bundesliga': '4331',
    'Ligue 1': '4334',
    'Champions League': '4480'
};

// Will hold all loaded matches from Football-Data.org
let matchDatabase = [];

// Cache for league emblems from TheSportsDB
const leagueEmblemCache = {};

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
            console.log('Loading match data from Football-Data.org...');
            console.log('Season: 2024-2025');
            const allMatches = [];
            let totalMatchesProcessed = 0;

            // Fetch matches from all 5 leagues
            for (const leagueName of Object.keys(COMPETITION_CODES)) {
                try {
                    const competitionCode = COMPETITION_CODES[leagueName];
                    const response = await fetch(`${FOOTBALL_DATA_API}?competition=${competitionCode}&season=2024`);
                    const data = await response.json();

                    // Process matches from this league
                    if (data.matches && Array.isArray(data.matches)) {
                        totalMatchesProcessed += data.matches.length;

                        for (const match of data.matches) {
                            // Only include finished matches with scores
                            if (match.status === 'FINISHED' &&
                                match.score.fullTime.home !== null &&
                                match.score.fullTime.away !== null) {

                                allMatches.push({
                                    league: leagueName,
                                    home: match.homeTeam.shortName,
                                    away: match.awayTeam.shortName,
                                    homeScore: match.score.fullTime.home,
                                    awayScore: match.score.fullTime.away,
                                    date: match.utcDate.split('T')[0], // Extract date only
                                    flag: LEAGUE_FLAGS[leagueName],
                                    matchday: match.matchday,
                                    // Store team data from match
                                    homeTeamData: {
                                        id: match.homeTeam.id,
                                        name: match.homeTeam.name,
                                        shortName: match.homeTeam.shortName,
                                        crest: match.homeTeam.crest
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

                    const includedCount = allMatches.filter(m => m.league === leagueName).length;
                    console.log(`${leagueName}: ${includedCount} matches loaded`);
                } catch (error) {
                    console.error(`Error loading ${leagueName}:`, error);
                }
            }

            matchDatabase = allMatches;

            console.log('\n========================================');
            console.log('MATCH LOADING SUMMARY');
            console.log('========================================');
            console.log(`Total matches processed: ${totalMatchesProcessed}`);
            console.log(`Finished matches loaded: ${matchDatabase.length}`);
            console.log(`Source: Football-Data.org`);
            console.log('========================================\n');

            // Load league badges from TheSportsDB
            console.log('Loading league badges from TheSportsDB...');
            await this.loadLeagueBadgesFromSportsDB();

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
        // Direct crest URL lookup from Football-Data.org team data
        // teamData is already pre-loaded and stored in match object during loadMatchData()
        return teamData ? teamData.crest : null;
    }

    async loadLeagueBadgesFromSportsDB() {
        // Fetch league badges from TheSportsDB for all leagues
        for (const leagueName of Object.keys(LEAGUE_IDS)) {
            try {
                const leagueId = LEAGUE_IDS[leagueName];
                const response = await fetch(`${THESPORTSDB_API}?endpoint=lookupleague.php&id=${leagueId}`);
                const data = await response.json();

                if (data.leagues && data.leagues.length > 0 && data.leagues[0].strBadge) {
                    leagueEmblemCache[leagueName] = data.leagues[0].strBadge;
                    console.log(`✓ ${leagueName} badge loaded from TheSportsDB`);
                }
            } catch (error) {
                console.error(`Error loading badge for ${leagueName}:`, error);
            }
        }
    }

    getLeagueEmblem(leagueName) {
        // Use local file for Champions League badge
        if (leagueName === 'Champions League') {
            return 'UEFA_Champions_League.svg.png';
        }
        // League emblems are cached from TheSportsDB
        return leagueEmblemCache[leagueName] || null;
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
        // New elements for transformation
        this.guessHeading = document.getElementById('guess-heading');
        this.resultMessage = document.getElementById('result-message');
        this.actualScoreDisplay = document.getElementById('actual-score-display');
    }

    attachEventListeners() {
        this.submitBtn.addEventListener('click', () => {
            if (this.submitBtn.textContent === 'Submit Guess') {
                this.submitGuess();
            } else {
                this.nextRound();
            }
        });
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

        // Allow Enter key to submit/next
        this.homeScoreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.submitBtn.textContent === 'Submit Guess') this.submitGuess();
        });
        this.awayScoreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.submitBtn.textContent === 'Submit Guess') this.submitGuess();
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
        document.getElementById('count-ucl').textContent = `${leagueCounts['Champions League'] || 0} matches`;
        document.getElementById('count-all').textContent = `${matchDatabase.length} matches`;

        // Load league badges for selection screen
        this.loadLeagueBadgesForSelection();

        // Show league selection, hide ALL other screens
        this.leagueSelection.classList.remove('hidden');
        this.teamSelection.classList.add('hidden');
        this.gameContainer.classList.add('hidden');
        this.gameOver.classList.add('hidden');

        // Reset selections
        this.selectedLeague = null;
        this.selectedTeam = null;
    }

    loadLeagueBadgesForSelection() {
        const leagueBadgeMap = {
            'Premier League': 'badge-premier',
            'La Liga': 'badge-laliga',
            'Serie A': 'badge-seriea',
            'Bundesliga': 'badge-bundesliga',
            'Ligue 1': 'badge-ligue1',
            'Champions League': 'badge-ucl'
        };

        for (const [leagueName, badgeId] of Object.entries(leagueBadgeMap)) {
            const badgeElement = document.getElementById(badgeId);
            const flagElement = badgeElement.nextElementSibling;

            // Get league emblem from cache (already loaded during loadMatchData)
            const emblem = this.getLeagueEmblem(leagueName);
            if (emblem && badgeElement) {
                badgeElement.src = emblem;
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
            if (!teamsMap.has(match.homeTeamData.id)) {
                teamsMap.set(match.homeTeamData.id, {
                    id: match.homeTeamData.id,
                    name: match.homeTeamData.shortName,
                    badge: match.homeTeamData.crest
                });
            }
            // Add away team
            if (!teamsMap.has(match.awayTeamData.id)) {
                teamsMap.set(match.awayTeamData.id, {
                    id: match.awayTeamData.id,
                    name: match.awayTeamData.shortName,
                    badge: match.awayTeamData.crest
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

        // Reset panel to guess state
        this.resetGuessPanel();
    }

    resetGuessPanel() {
        // Reset inputs - clear values so placeholder shows
        this.homeScoreInput.value = '';
        this.awayScoreInput.value = '';
        this.homeScoreInput.readOnly = false;
        this.awayScoreInput.readOnly = false;

        // Reset heading and button
        this.guessHeading.textContent = 'Guess the final score:';
        this.submitBtn.textContent = 'Submit Guess';
        this.submitBtn.className = 'btn-primary';
        this.submitBtn.disabled = false;

        // Hide result elements (invisible keeps space)
        this.resultMessage.classList.add('invisible');
        this.actualScoreDisplay.classList.add('invisible');
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

    loadLeagueLogo() {
        const leagueBadgeElement = document.getElementById('league-badge-img');
        if (!leagueBadgeElement) return;

        leagueBadgeElement.style.display = 'none';

        const leagueEmblem = this.getLeagueEmblem(this.currentMatch.league);
        if (leagueEmblem) {
            leagueBadgeElement.src = leagueEmblem;
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
        // Treat empty inputs as 0
        const guessedHome = this.homeScoreInput.value === '' ? 0 : parseInt(this.homeScoreInput.value);
        const guessedAway = this.awayScoreInput.value === '' ? 0 : parseInt(this.awayScoreInput.value);

        // If inputs were empty, show 0
        if (this.homeScoreInput.value === '') this.homeScoreInput.value = '0';
        if (this.awayScoreInput.value === '') this.awayScoreInput.value = '0';

        const actualHome = this.currentMatch.homeScore;
        const actualAway = this.currentMatch.awayScore;

        // Calculate points
        const points = this.calculatePoints(guessedHome, guessedAway, actualHome, actualAway);
        this.score += points;

        // Transform panel to result state
        this.transformToResultPanel(points, actualHome, actualAway);

        // Update score display
        this.updateScore();
    }

    transformToResultPanel(points, actualHome, actualAway) {
        // Make inputs read-only
        this.homeScoreInput.readOnly = true;
        this.awayScoreInput.readOnly = true;

        // Change heading to show context
        this.guessHeading.textContent = 'Your guessing was:';

        // Show result message
        this.displayResult(points);
        this.resultMessage.classList.remove('invisible');

        // Show actual score
        this.actualHome.textContent = actualHome;
        this.actualAway.textContent = actualAway;
        this.actualScoreDisplay.classList.remove('invisible');

        // Transform button to gold "Next Round"
        this.submitBtn.textContent = 'Next Round';
        this.submitBtn.className = 'btn-secondary';
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

    displayResult(points) {
        let message = '';
        let className = '';

        if (points === 10) {
            message = `Perfect! Exact score! +${points} pts`;
            className = 'excellent';
        } else if (points === 7) {
            message = `Close! Goal difference correct +${points} pts`;
            className = 'very-good';
        } else if (points === 5) {
            message = `Good! Correct winning side +${points} pts`;
            className = 'good';
        } else if (points === 3) {
            message = `One score correct +${points} pts`;
            className = 'okay';
        } else {
            message = `Wrong +${points} pts`;
            className = 'poor';
        }

        this.pointsMessage.textContent = message;
        this.pointsMessage.parentElement.className = `points-earned ${className}`;
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
