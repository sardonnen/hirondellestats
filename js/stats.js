// js/stats.js - Gestion de la page Statistiques

// Variables locales de la page statistiques
let currentPlayerFilter = 'all';
let currentTimelineFilter = 'all';
let matchData = null;
let playersStats = {};

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeStatsPage();
});

/**
 * Initialisation de la page statistiques
 */
function initializeStatsPage() {
    console.log('📊 Initialisation de la page Statistiques');
    
    loadMatchData();
    calculateAllStats();
    updateAllDisplays();
    
    console.log('✅ Page Statistiques initialisée');
}

/**
 * Chargement des données du match
 */
function loadMatchData() {
    const state = footballApp.getState();
    const config = getMatchConfig();
    
    matchData = {
        config: config,
        players: state.players,
        events: state.events,
        score: state.score,
        time: state.time,
        half: state.half,
        timestamp: new Date()
    };
    
    console.log('Données du match chargées:', matchData);
}

/**
 * Calcul de toutes les statistiques
 */
function calculateAllStats() {
    calculateGlobalStats();
    calculatePlayersStats();
    calculateHalftimeStats();
    calculateEfficiencyStats();
    findTopPerformers();
}

/**
 * Calcul des statistiques globales
 */
function calculateGlobalStats() {
    const events = matchData.events || [];
    
    matchData.globalStats = {
        team: { goals: 0, shots: 0, cards: 0, fouls: 0, saves: 0, freeKicks: 0 },
        opponent: { goals: 0, shots: 0, cards: 0, fouls: 0, saves: 0, freeKicks: 0 }
    };
    
    events.forEach(event => {
        const isTeam = event.isTeam === true;
        const stats = isTeam ? matchData.globalStats.team : matchData.globalStats.opponent;
        
        switch (event.type) {
            case 'goal': stats.goals++; break;
            case 'shot': stats.shots++; break;
            case 'card': stats.cards++; break;
            case 'foul': stats.fouls++; break;
            case 'save': if (isTeam) stats.saves++; break;
            case 'freeKick': stats.freeKicks++; break;
        }
    });
}

/**
 * Calcul des statistiques des joueurs
 * 
 * SYSTÈME DE NOTATION :
 * - But : +5 points
 * - Tir : +1 point
 * - Arrêt gardienne : +2 points
 * - Coup franc : +1 point
 * - Carton jaune : -1 point
 * - Carton rouge : -3 points
 * - Carton blanc : -2 points
 * - Faute : -0.5 point
 */
function calculatePlayersStats() {
    const players = matchData.players || [];
    const events = matchData.events || [];
    
    playersStats = {};
    
    // Initialiser les stats pour chaque joueur
    players.forEach(player => {
        playersStats[player.id] = {
            ...player,
            goals: 0,
            shots: 0,
            cards: 0,
            fouls: 0,
            saves: 0,
            freeKicks: 0,
            substitutions: 0,
            injuries: 0,
            yellowCards: 0,
            redCards: 0,
            whiteCards: 0,
            playTime: 0, // Temps de jeu en minutes
            score: 0
        };
    });
    
    // Calculer le temps de jeu (approximatif basé sur le statut)
    const matchTime = matchData.time || 0;
    players.forEach(player => {
        if (playersStats[player.id]) {
            // Si titulaire, temps = temps total du match
            if (player.status === 'field') {
                playersStats[player.id].playTime = Math.floor(matchTime);
            }
            // Si remplaçante entrée en jeu, estimer à 30% du temps
            else if (player.status === 'bench') {
                const subEvent = events.find(e => e.type === 'substitution' && e.playerInName === player.name);
                if (subEvent) {
                    playersStats[player.id].playTime = Math.floor(matchTime * 0.3);
                }
            }
        }
    });
    
    // Compter les événements par joueur
    events.forEach(event => {
        if (event.playerId && event.playerId !== 'opponent' && playersStats[event.playerId]) {
            const playerStat = playersStats[event.playerId];
            
            switch (event.type) {
                case 'goal':
                    playerStat.goals++;
                    playerStat.score += 5;
                    break;
                case 'shot':
                    playerStat.shots++;
                    playerStat.score += 1;
                    break;
                case 'card':
                    playerStat.cards++;
                    if (event.cardType === 'yellow' || event.option === 'Jaune') {
                        playerStat.yellowCards++;
                        playerStat.score -= 1;
                    } else if (event.cardType === 'red' || event.option === 'Rouge') {
                        playerStat.redCards++;
                        playerStat.score -= 3;
                    } else if (event.cardType === 'white' || event.option === 'Blanc') {
                        playerStat.whiteCards++;
                        playerStat.score -= 2;
                    }
                    break;
                case 'foul':
                    playerStat.fouls++;
                    playerStat.score -= 0.5;
                    break;
                case 'save':
                    playerStat.saves++;
                    playerStat.score += 2;
                    break;
                case 'freeKick':
                    playerStat.freeKicks++;
                    playerStat.score += 1;
                    break;
                case 'substitution':
                    if (event.inPlayerId === event.playerId) {
                        playerStat.substitutions++;
                    }
                    break;
                case 'injury':
                    playerStat.injuries++;
                    break;
            }
        }
    });
}

/**
 * Calcul des statistiques par mi-temps
 */
function calculateHalftimeStats() {
    const events = matchData.events || [];
    
    matchData.halftimeStats = {
        firstHalf: { goals: 0, shots: 0, cards: 0, fouls: 0, events: 0 },
        secondHalf: { goals: 0, shots: 0, cards: 0, fouls: 0, events: 0 }
    };
    
    events.forEach(event => {
        const isFirstHalf = event.half === 1;
        const stats = isFirstHalf ? matchData.halftimeStats.firstHalf : matchData.halftimeStats.secondHalf;
        
        stats.events++;
        
        if (event.isTeam === true) {
            switch (event.type) {
                case 'goal': stats.goals++; break;
                case 'shot': stats.shots++; break;
                case 'card': stats.cards++; break;
                case 'foul': stats.fouls++; break;
            }
        }
    });
}

/**
 * Calcul des statistiques d'efficacité
 */
function calculateEfficiencyStats() {
    const teamStats = matchData.globalStats.team;
    
    matchData.efficiency = {
        shotEfficiency: teamStats.shots > 0 ? (teamStats.goals / teamStats.shots * 100) : 0,
        goalsPerShot: teamStats.shots > 0 ? (teamStats.goals / teamStats.shots) : 0,
        defenseRating: calculateDefenseRating()
    };
}

/**
 * Calcul de la note défensive
 */
function calculateDefenseRating() {
    const saves = matchData.globalStats.team.saves;
    const goalsConceded = matchData.globalStats.opponent.goals;
    
    if (saves === 0 && goalsConceded === 0) return 5;
    if (goalsConceded === 0) return 5;
    if (saves > goalsConceded * 2) return 4;
    if (saves > goalsConceded) return 3;
    if (saves === goalsConceded) return 2;
    return 1;
}

/**
 * Recherche des meilleurs performeurs
 */
function findTopPerformers() {
    const players = Object.values(playersStats);
    
    matchData.topPerformers = {
        topScorer: players.reduce((max, p) => p.goals > max.goals ? p : max, { goals: 0, name: '-' }),
        topShooter: players.reduce((max, p) => p.shots > max.shots ? p : max, { shots: 0, name: '-' }),
        topKeeper: players.filter(p => p.position === 'gardienne').reduce((max, p) => p.saves > max.saves ? p : max, { saves: 0, name: '-' }),
        playerOfMatch: players.reduce((max, p) => p.score > max.score ? p : max, { score: 0, name: '-' })
    };
}

/**
 * Mise à jour de tous les affichages
 */
function updateAllDisplays() {
    updateMatchSummary();
    updateGlobalStats();
    updatePlayersStats();
    updateHalftimeAnalysis();
    updateDetailedTimeline();
    updateAdvancedAnalysis();
    updateTopPerformers();
}

/**
 * Mise à jour du résumé du match
 */
function updateMatchSummary() {
    // Vérification de sécurité
    if (!matchData || !matchData.config) {
        console.warn('Données de match incomplètes');
        return;
    }
    
    const config = matchData.config;
    const score = matchData.score || { team: 0, opponent: 0 };
    
    document.getElementById('summaryTeamName').textContent = config.teamName || 'Mon Équipe';
    document.getElementById('summaryOpponentName').textContent = config.opponentName || 'Équipe Adverse';
    document.getElementById('summaryTeamScore').textContent = score.team;
    document.getElementById('summaryOpponentScore').textContent = score.opponent;
    document.getElementById('summaryMatchTime').textContent = footballApp.formatTime(matchData.time || 0);
    
    document.getElementById('summaryVenue').textContent = config.venue || 'Stade Municipal';
    document.getElementById('summaryEvents').textContent = (matchData.events || []).length;
    
    if (config.matchDate) {
        const date = new Date(config.matchDate);
        document.getElementById('summaryDate').textContent = date.toLocaleDateString('fr-FR');
    }
    
    // Statut du match
    const isFinished = (matchData.time || 0) >= 90 || (matchData.half || 1) > 2;
    document.getElementById('summaryMatchStatus').textContent = isFinished ? 'Terminé' : 'En cours';
}

/**
 * Mise à jour des statistiques globales
 */
function updateGlobalStats() {
    // Vérification de sécurité
    if (!matchData || !matchData.globalStats) {
        console.warn('Stats globales non disponibles');
        return;
    }
    
    const teamStats = matchData.globalStats.team;
    const opponentStats = matchData.globalStats.opponent;
    
    document.getElementById('globalTeamGoals').textContent = teamStats.goals;
    document.getElementById('globalOpponentGoals').textContent = opponentStats.goals;
    document.getElementById('globalTeamShots').textContent = teamStats.shots;
    document.getElementById('globalOpponentShots').textContent = opponentStats.shots;
    document.getElementById('globalTeamCards').textContent = teamStats.cards;
    document.getElementById('globalOpponentCards').textContent = opponentStats.cards;
    document.getElementById('globalTeamFouls').textContent = teamStats.fouls;
    document.getElementById('globalOpponentFouls').textContent = opponentStats.fouls;
    document.getElementById('globalTeamSaves').textContent = teamStats.saves;
    document.getElementById('globalOpponentSaves').textContent = opponentStats.saves;
    document.getElementById('globalTeamFreeKicks').textContent = teamStats.freeKicks;
    document.getElementById('globalOpponentFreeKicks').textContent = opponentStats.freeKicks;
}

/**
 * Mise à jour des statistiques des joueurs
 */
function updatePlayersStats() {
    if (!matchData || !playersStats) {
        console.warn('Stats joueurs non disponibles');
        return;
    }
    const container = document.getElementById('playersStatsContainer');
    container.innerHTML = '';
    
    const players = Object.values(playersStats);
    const filteredPlayers = filterPlayersByCategory(players, currentPlayerFilter);
    
    if (filteredPlayers.length === 0) {
        container.innerHTML = '<p class="no-stats">Aucune statistique disponible pour ce filtre.</p>';
        return;
    }
    
    filteredPlayers.forEach(player => {
        const playerCard = createPlayerStatsCard(player);
        container.appendChild(playerCard);
    });
}

/**
 * Filtrage des joueurs par catégorie
 */
function filterPlayersByCategory(players, category) {
    switch (category) {
        case 'field':
            return players.filter(p => p.status === 'field');
        case 'bench':
            return players.filter(p => p.status === 'bench');
        case 'top':
            return players.filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
        default:
            return players.sort((a, b) => b.score - a.score);
    }
}

/**
 * Création d'une carte de statistiques de joueur
 */
function createPlayerStatsCard(player) {
    const card = document.createElement('div');
    card.className = `player-stats-card ${player.position === 'gardienne' ? 'goalkeeper' : ''} ${player.status}`;
    
    card.innerHTML = `
        <div class="player-stats-header">
            <div class="player-info">
                <div class="player-position">${getPositionIcon(player.position)}</div>
                <div class="player-details">
                    <div class="player-name">${player.name}</div>
                    ${player.number ? `<div class="player-number">N° ${player.number}</div>` : ''}
                    <div class="player-status">${getStatusText(player.status)}</div>
                    <div class="player-time">⏱️ ${player.playTime || 0} min</div>
                </div>
            </div>
            <div class="player-score ${player.score > 0 ? 'positive' : player.score < 0 ? 'negative' : 'neutral'}">
                ${player.score.toFixed(1)}
            </div>
        </div>
        
        <div class="player-stats-content">
            <div class="stat-row">
                <span class="stat-icon">⚽</span>
                <span class="stat-label">Buts</span>
                <span class="stat-value">${player.goals}</span>
            </div>
            <div class="stat-row">
                <span class="stat-icon">🎯</span>
                <span class="stat-label">Tirs</span>
                <span class="stat-value">${player.shots}</span>
            </div>
            ${player.position === 'gardienne' ? `
                <div class="stat-row">
                    <span class="stat-icon">🧤</span>
                    <span class="stat-label">Arrêts</span>
                    <span class="stat-value">${player.saves}</span>
                </div>
            ` : ''}
            <div class="stat-row">
                <span class="stat-icon">🟨</span>
                <span class="stat-label">Cartons</span>
                <span class="stat-value">${player.cards}</span>
            </div>
            <div class="stat-row">
                <span class="stat-icon">⚠️</span>
                <span class="stat-label">Fautes</span>
                <span class="stat-value">${player.fouls}</span>
            </div>
            <div class="stat-row">
                <span class="stat-icon">⚽</span>
                <span class="stat-label">Coups Francs</span>
                <span class="stat-value">${player.freeKicks}</span>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Obtenir le texte du statut
 */
function getStatusText(status) {
    const statusTexts = {
        'field': '🟏️ Titulaire',
        'bench': '🪑 Remplaçante',
        'sanctioned': '⚠️ Sanctionnée'
    };
    return statusTexts[status] || status;
}

/**
 * Mise à jour de l'analyse par mi-temps
 */
function updateHalftimeAnalysis() {
    if (!matchData || !matchData.halftimeStats) {
        console.warn('Stats mi-temps non disponibles');
        return;
    }
    const firstHalf = matchData.halftimeStats.firstHalf;
    const secondHalf = matchData.halftimeStats.secondHalf;
    
    updateHalfStats('firstHalfStats', firstHalf);
    updateHalfStats('secondHalfStats', secondHalf);
}

/**
 * Mise à jour des stats d'une mi-temps
 */
function updateHalfStats(containerId, stats) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="half-stat-item">
            <span class="half-stat-icon">⚽</span>
            <span class="half-stat-label">Buts</span>
            <span class="half-stat-value">${stats.goals}</span>
        </div>
        <div class="half-stat-item">
            <span class="half-stat-icon">🎯</span>
            <span class="half-stat-label">Tirs</span>
            <span class="half-stat-value">${stats.shots}</span>
        </div>
        <div class="half-stat-item">
            <span class="half-stat-icon">🟨</span>
            <span class="half-stat-label">Cartons</span>
            <span class="half-stat-value">${stats.cards}</span>
        </div>
        <div class="half-stat-item">
            <span class="half-stat-icon">📝</span>
            <span class="half-stat-label">Événements</span>
            <span class="half-stat-value">${stats.events}</span>
        </div>
    `;
}

/**
 * Mise à jour de la timeline détaillée
 */
function updateDetailedTimeline() {
    // Vérification de sécurité
    if (!matchData || !matchData.events) {
        console.warn('Timeline non disponible');
        return;
    }
    
    const container = document.getElementById('detailedTimeline');
    const events = matchData.events || [];
    
    let filteredEvents = events;
    
    switch (currentTimelineFilter) {
        case 'goals':
            filteredEvents = events.filter(e => e.type === 'goal');
            break;
        case 'cards':
            filteredEvents = events.filter(e => e.type === 'card');
            break;
        case 'subs':
            filteredEvents = events.filter(e => e.type === 'substitution');
            break;
    }
    
    if (filteredEvents.length === 0) {
        container.innerHTML = '<p class="no-timeline">Aucun événement pour ce filtre.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    filteredEvents.forEach(event => {
        const timelineItem = createTimelineItem(event);
        container.appendChild(timelineItem);
    });
}

/**
 * Création d'un élément de timeline
 */
function createTimelineItem(event) {
    const item = document.createElement('div');
    item.className = `timeline-item ${event.isTeam ? 'team' : 'opponent'}`;
    
    const icon = getEventIcon(event);
    const text = getEventText(event);
    
    item.innerHTML = `
        <div class="timeline-time">${event.time}</div>
        <div class="timeline-icon">${icon}</div>
        <div class="timeline-content">
            <div class="timeline-text">${text}</div>
            <div class="timeline-meta">
                ${event.half === 1 ? '1ère' : '2ème'} mi-temps
                ${event.isTeam ? '• Notre équipe' : '• Équipe adverse'}
            </div>
        </div>
    `;
    
    return item;
}

/**
 * Mise à jour des analyses avancées
 */
function updateAdvancedAnalysis() {
    if (!matchData || !matchData.efficiency) {
        console.warn('Analyses avancées non disponibles');
        return;
    }
    const efficiency = matchData.efficiency;
    
    document.getElementById('shotEfficiency').textContent = efficiency.shotEfficiency.toFixed(1) + '%';
    document.getElementById('goalsPerShot').textContent = efficiency.goalsPerShot.toFixed(2);
    document.getElementById('efficiencyProgress').style.width = Math.min(efficiency.shotEfficiency, 100) + '%';
    
    document.getElementById('totalSaves').textContent = matchData.globalStats.team.saves;
    document.getElementById('goalsConceded').textContent = matchData.globalStats.opponent.goals;
    
    const stars = '⭐'.repeat(efficiency.defenseRating) + '☆'.repeat(5 - efficiency.defenseRating);
    document.getElementById('defenseRating').textContent = stars;
    
    // Graphique simple des événements
    updateEventsChart();
}

/**
 * Mise à jour du graphique des événements
 */
function updateEventsChart() {
    // Vérification de sécurité
    if (!matchData || !matchData.events) {
        console.warn('Graphique événements non disponible');
        return;
    }
        
    const container = document.getElementById('eventsChart');
    const events = matchData.events || [];
    
    const eventCounts = {
        goal: 0, shot: 0, card: 0, foul: 0, save: 0, freeKick: 0, substitution: 0
    };
    
    events.forEach(event => {
        if (eventCounts.hasOwnProperty(event.type)) {
            eventCounts[event.type]++;
        }
    });
    
    const total = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        container.innerHTML = '<p class="no-chart">Aucun événement à afficher</p>';
        return;
    }
    
    container.innerHTML = '';
    
    Object.entries(eventCounts).forEach(([type, count]) => {
        if (count > 0) {
            const percentage = (count / total * 100);
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.innerHTML = `
                <div class="chart-label">${getEventTypeLabel(type)}</div>
                <div class="chart-progress">
                    <div class="chart-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${count}</div>
            `;
            container.appendChild(bar);
        }
    });
}

/**
 * Obtenir le label d'un type d'événement
 */
function getEventTypeLabel(type) {
    const labels = {
        goal: 'Buts',
        shot: 'Tirs',
        card: 'Cartons',
        foul: 'Fautes',
        save: 'Arrêts',
        freeKick: 'Coups Francs',
        substitution: 'Changements'
    };
    return labels[type] || type;
}

/**
 * Mise à jour des meilleurs performeurs
 */
function updateTopPerformers() {
    if (!matchData || !matchData.topPerformers) {
        console.warn('Top performers non disponibles');
        return;
    }
    const performers = matchData.topPerformers;
    
    updateTopPerformer('topScorer', performers.topScorer, 'but(s)');
    updateTopPerformer('topShooter', performers.topShooter, 'tir(s)');
    updateTopPerformer('topKeeper', performers.topKeeper, 'arrêt(s)');
    
    const motmElement = document.getElementById('playerOfMatch');
    motmElement.querySelector('.player-name').textContent = performers.playerOfMatch.name || '-';
    motmElement.querySelector('.player-stat').textContent = `Score: ${performers.playerOfMatch.score?.toFixed(1) || 0}`;
}

/**
 * Mise à jour d'un meilleur performeur
 */
function updateTopPerformer(elementId, performer, unit) {
    const element = document.getElementById(elementId);
    const statValue = performer.goals !== undefined ? performer.goals :
                     performer.shots !== undefined ? performer.shots :
                     performer.saves !== undefined ? performer.saves : 0;
    
    element.querySelector('.player-name').textContent = performer.name || '-';
    element.querySelector('.player-stat').textContent = `${statValue} ${unit}`;
}

// Fonctions de filtrage
function filterPlayers(category) {
    currentPlayerFilter = category;
    
    // Mise à jour des boutons de filtre
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        }
    });
    
    updatePlayersStats();
}

function filterTimeline(category) {
    currentTimelineFilter = category;
    
    // Mise à jour des boutons de filtre
    document.querySelectorAll('.timeline-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        }
    });
    
    updateDetailedTimeline();
}

// Fonctions d'export et de rapport
function generateReport() {
    const report = createMatchReport();
    document.getElementById('reportContent').innerHTML = report;
    document.getElementById('reportModal').style.display = 'block';
}

function createMatchReport() {
    const config = matchData.config;
    const score = matchData.score;
    const date = new Date();
    
    return `
        <div class="report-header">
            <h2>📋 Rapport de Match</h2>
            <p>Généré le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}</p>
        </div>
        
        <div class="report-section">
            <h3>🏆 Résultat Final</h3>
            <p><strong>${config.teamName}</strong> ${score.team} - ${score.opponent} <strong>${config.opponentName}</strong></p>
            <p>Durée: ${footballApp.formatTime(matchData.time)} | Lieu: ${config.venue || 'Non spécifié'}</p>
        </div>
        
        <div class="report-section">
            <h3>📊 Statistiques Principales</h3>
            <ul>
                <li>Tirs: ${matchData.globalStats.team.shots} - ${matchData.globalStats.opponent.shots}</li>
                <li>Cartons: ${matchData.globalStats.team.cards} - ${matchData.globalStats.opponent.cards}</li>
                <li>Fautes: ${matchData.globalStats.team.fouls} - ${matchData.globalStats.opponent.fouls}</li>
                <li>Arrêts: ${matchData.globalStats.team.saves}</li>
            </ul>
        </div>
        
        <div class="report-section">
            <h3>🏆 Meilleurs Performeurs</h3>
            <ul>
                <li>Meilleure buteuse: ${matchData.topPerformers.topScorer.name} (${matchData.topPerformers.topScorer.goals} but(s))</li>
                <li>Meilleure tireuse: ${matchData.topPerformers.topShooter.name} (${matchData.topPerformers.topShooter.shots} tir(s))</li>
                <li>Joueuse du match: ${matchData.topPerformers.playerOfMatch.name} (Score: ${matchData.topPerformers.playerOfMatch.score?.toFixed(1)})</li>
            </ul>
        </div>
        
        <div class="report-section">
            <h3>📝 Événements Marquants</h3>
            <ul>
                ${matchData.events.filter(e => e.type === 'goal' || e.type === 'card').map(e => 
                    `<li>${e.time} - ${getEventText(e)}</li>`
                ).join('')}
            </ul>
        </div>
    `;
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function downloadReport() {
    const reportContent = document.getElementById('reportContent').innerHTML;
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_match_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Rapport téléchargé !');
}

function exportStats() {
    const statsData = {
        match: matchData,
        globalStats: matchData.globalStats,
        playersStats: playersStats,
        halftimeStats: matchData.halftimeStats,
        efficiency: matchData.efficiency,
        topPerformers: matchData.topPerformers,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(statsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stats_match_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Statistiques exportées !');
}

function printStats() {
    window.print();
}

// Fonctions utilitaires
function getEventIcon(event) {
    const icons = {
        'goal': '⚽',
        'shot': '🎯',
        'card': event.cardType === 'yellow' ? '🟨' : event.cardType === 'red' ? '🟥' : '⬜',
        'foul': '⚠️',
        'save': '🧤',
        'freeKick': '⚽',
        'substitution': '🔄',
        'halfTime': '⏱️',
        'timeout': '⏰',
        'injury': '🏥',
        'offside': '🚩'
    };
    return icons[event.type] || '📝';
}

function getEventText(event) {
    if (event.description) return event.description;
    
    const playerName = event.playerId === 'opponent' ? 'Équipe Adverse' : 
                      playersStats[event.playerId]?.name || 'Joueur';
    
    switch (event.type) {
        case 'goal': return `But de ${playerName}`;
        case 'shot': return `Tir de ${playerName}`;
        case 'card': 
            const cardName = event.cardType === 'yellow' ? 'jaune' : 
                           event.cardType === 'red' ? 'rouge' : 'blanc';
            return `Carton ${cardName} pour ${playerName}`;
        case 'foul': return `Faute de ${playerName}`;
        case 'save': return `Arrêt de ${playerName}`;
        case 'freeKick': return `Coup de pied arrêté - ${playerName}`;
        default: return event.type || 'Événement';
    }
}

function getPositionIcon(position) {
    const icons = {
        'gardienne': '🥅',
        'défenseuse': '🛡️',
        'milieu': '⚙️',
        'attaquante': '⚽'
    };
    return icons[position] || '👤';
}

// Fonction spécialisée pour cette page
function updateSpecificStatsDisplay() {
    loadMatchData();
    calculateAllStats();
    updateAllDisplays();
}

console.log('📊 Module stats.js chargé');