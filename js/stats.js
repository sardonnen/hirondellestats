// js/stats.js - Gestion de la page Statistiques

// Variables locales de la page statistiques
let currentPlayerFilter = 'all';
let currentTimelineFilter = 'all';
let matchData = null;
let playersStats = {};

// Initialisation de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeStatsPage();
    
    // Rafraîchissement automatique toutes les 3 secondes
    setInterval(function() {
        loadMatchData();
        calculateAllStats();
        updateAllDisplays();
    }, 3000);
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
    const savedMatch = localStorage.getItem('footballStats_currentMatch');
    const config = getMatchConfig();
    
    if (savedMatch) {
        const matchDataRaw = JSON.parse(savedMatch);
        
        // Calculer le temps actuel du match
        let currentTime = 0;
        if (matchDataRaw.timer) {
            if (matchDataRaw.timer.isRunning && matchDataRaw.timer.startTime) {
                // Timer en cours : calculer le temps écoulé depuis le démarrage
                const startTime = new Date(matchDataRaw.timer.startTime).getTime();
                const now = Date.now();
                currentTime = (now - startTime) / 1000; // en secondes
            } else {
                // Timer en pause : utiliser pausedTime
                currentTime = matchDataRaw.timer.pausedTime || 0;
            }
            
            // Ajouter 45 minutes si on est en 2ème mi-temps
            if (matchDataRaw.timer.currentHalf === 2 && currentTime < 45 * 60) {
                currentTime += 45 * 60;
            }
        }
        
        // Convertir le temps en minutes
        const timeInMinutes = currentTime / 60;
        
        // CORRECTION : Récupérer le score depuis plusieurs sources possibles
        let teamScore = 0;
        let opponentScore = 0;
        
        // Source 1 : matchDataRaw.stats (format de match.html)
        if (matchDataRaw.stats) {
            teamScore = matchDataRaw.stats.myTeam?.goals || 0;
            opponentScore = matchDataRaw.stats.opponent?.goals || 0;
        }
        
        // Source 2 : matchDataRaw.score (format alternatif)
        if (matchDataRaw.score) {
            teamScore = matchDataRaw.score.team || teamScore;
            opponentScore = matchDataRaw.score.opponent || opponentScore;
        }
        
        // Source 3 : Compter depuis les événements
        if (matchDataRaw.events && matchDataRaw.events.length > 0) {
            const goalsTeam = matchDataRaw.events.filter(e => e.type === 'goal' && e.isTeam === true).length;
            const goalsOpponent = matchDataRaw.events.filter(e => e.type === 'goal' && e.isTeam === false).length;
            
            // Utiliser le comptage des événements si plus fiable
            if (goalsTeam > 0 || goalsOpponent > 0) {
                teamScore = goalsTeam;
                opponentScore = goalsOpponent;
            }
        }
        
        matchData = {
            config: config,
            players: matchDataRaw.players || footballApp.getState().players,
            events: matchDataRaw.events || [],
            score: {
                team: teamScore,
                opponent: opponentScore
            },
            time: timeInMinutes,
            half: matchDataRaw.timer?.currentHalf || 1,
            timestamp: new Date()
        };
    } else {
        // Fallback si pas de match en cours
        const state = footballApp.getState();
        matchData = {
            config: config,
            players: state.players,
            events: state.events,
            score: state.score || { team: 0, opponent: 0 },
            time: state.time || 0,
            half: state.half || 1,
            timestamp: new Date()
        };
    }
    
    console.log('📊 Données du match chargées:', matchData);
    console.log('🎯 Score:', matchData.score.team, '-', matchData.score.opponent);
    console.log('⏱️ Temps:', matchData.time.toFixed(2), 'min');
}

/**
 * Calcul de toutes les statistiques
 */
function calculateAllStats() {
    if (!matchData) {
        console.warn('⚠️ matchData non initialisé, impossible de calculer les stats');
        return;
    }
    
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
    if (!matchData) {
        console.warn('⚠️ matchData non disponible pour calculateGlobalStats');
        return;
    }
    
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
    
    // Synchroniser le score global avec le comptage des événements
    matchData.score.team = matchData.globalStats.team.goals;
    matchData.score.opponent = matchData.globalStats.opponent.goals;
}

// ... (le reste du code reste identique jusqu'à updateMatchSummary)

/**
 * Mise à jour du résumé du match
 */
function updateMatchSummary() {
    // Vérification de sécurité avec initialisation par défaut
    if (!matchData) {
        console.warn('⚠️ matchData non disponible, utilisation de valeurs par défaut');
        // Essayer de recharger
        loadMatchData();
        if (!matchData) return;
    }
    
    const config = matchData.config || { teamName: 'Mon Équipe', opponentName: 'Équipe Adverse' };
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
    
    console.log('✅ Résumé du match mis à jour - Score:', score.team, '-', score.opponent, '| Temps:', matchData.time.toFixed(2));
}

/**
 * Mise à jour des statistiques globales
 */
function updateGlobalStats() {
    // Vérification de sécurité avec initialisation
    if (!matchData || !matchData.globalStats) {
        console.warn('⚠️ Stats globales non disponibles, recalcul...');
        if (matchData) {
            calculateGlobalStats();
        } else {
            loadMatchData();
            calculateAllStats();
        }
        if (!matchData || !matchData.globalStats) return;
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