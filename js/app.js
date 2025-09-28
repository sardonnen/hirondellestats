// ===== VARIABLES GLOBALES =====
let appState = {
    currentMatch: null,
    players: [],
    events: [],
    score: { team: 0, opponent: 0 },
    time: 0,
    half: 1,
    isPlaying: false,
    selectedPlayer: null,
    selectedCardType: null
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialisation de l'application
 */
function initializeApp() {
    console.log('🚀 Initialisation de Football Stats App');
    
    // Charger les données sauvegardées
    loadAppState();
    
    // Vérifier si on est en mode live
    checkLiveMode();
    
    // Initialiser les event listeners
    setupEventListeners();
    
    // Mise à jour de l'affichage
    updateAllDisplays();
    
    console.log('✅ Application initialisée');
}

/**
 * Chargement de l'état de l'application
 */
function loadAppState() {
    try {
        appState.players = loadData('players') || [];
        appState.currentMatch = loadData('currentMatch') || null;
        
        if (appState.currentMatch) {
            appState.events = appState.currentMatch.events || [];
            appState.score = appState.currentMatch.score || { team: 0, opponent: 0 };
            appState.time = appState.currentMatch.time || 0;
            appState.half = appState.currentMatch.half || 1;
        }
        
        console.log('État de l\'application chargé:', appState);
    } catch (error) {
        console.error('Erreur lors du chargement de l\'état:', error);
    }
}

/**
 * Sauvegarde de l'état de l'application
 */
function saveAppState() {
    try {
        if (appState.players.length > 0) {
            saveData('players', appState.players);
        }
        
        if (appState.currentMatch) {
            appState.currentMatch.events = appState.events;
            appState.currentMatch.score = appState.score;
            appState.currentMatch.time = appState.time;
            appState.currentMatch.half = appState.half;
            appState.currentMatch.lastUpdated = new Date().toISOString();
            
            saveData('currentMatch', appState.currentMatch);
        }
        
        console.log('État de l\'application sauvegardé');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

// ===== GESTION DES ÉVÉNEMENTS =====

/**
 * Configuration des event listeners
 */
function setupEventListeners() {
    // Fermeture des modales en cliquant à l'extérieur
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Gestion des touches du clavier
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Sauvegarde automatique avant fermeture de la page
    window.addEventListener('beforeunload', function() {
        saveAppState();
    });
}

// ===== GESTION DES MODALES =====

/**
 * Fermeture de toutes les modales
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset des sélections
    appState.selectedPlayer = null;
    appState.selectedCardType = null;
    
    // Reset des feedbacks visuels
    resetVisualFeedbacks();
}

/**
 * Reset des feedbacks visuels
 */
function resetVisualFeedbacks() {
    // Reset sélection des joueurs
    const playerButtons = document.querySelectorAll('.player-btn');
    playerButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Reset sélection des cartons
    const cardButtons = document.querySelectorAll('.card-btn');
    cardButtons.forEach(btn => btn.style.opacity = '1');
}

// ===== GESTION DES JOUEURS =====

/**
 * Ajout d'un joueur
 */
function addPlayerToTeam(playerData) {
    const player = {
        id: Date.now() + Math.random(),
        name: playerData.name,
        position: playerData.position,
        status: 'bench', // bench, field, sanctioned
        stats: {
            goals: 0,
            shots: 0,
            cards: 0,
            fouls: 0,
            saves: 0,
            freeKicks: 0
        },
        createdAt: new Date().toISOString()
    };
    
    // Vérifier qu'il n'y ait qu'une seule gardienne
    if (player.position === 'gardienne') {
        const existingGoalkeeper = appState.players.find(p => p.position === 'gardienne');
        if (existingGoalkeeper) {
            showNotification('Il ne peut y avoir qu\'une seule gardienne dans l\'équipe !', 'error');
            return null;
        }
    }
    
    appState.players.push(player);
    saveAppState();
    
    console.log('Joueur ajouté:', player);
    return player;
}

/**
 * Suppression d'un joueur
 */
function removePlayerFromTeam(playerId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette joueuse ?')) {
        return false;
    }
    
    const playerIndex = appState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        const removedPlayer = appState.players.splice(playerIndex, 1)[0];
        saveAppState();
        
        console.log('Joueur supprimé:', removedPlayer);
        showNotification(`${removedPlayer.name} a été supprimée de l'équipe.`);
        return true;
    }
    return false;
}

/**
 * Mise à jour du statut d'un joueur
 */
function updatePlayerStatus(playerId, newStatus) {
    const player = appState.players.find(p => p.id === playerId);
    if (player) {
        player.status = newStatus;
        player.lastUpdated = new Date().toISOString();
        saveAppState();
        return player;
    }
    return null;
}

/**
 * Obtenir les joueurs par statut
 */
function getPlayersByStatus(status) {
    return appState.players.filter(p => p.status === status);
}

/**
 * Obtenir l'icône de position
 */
function getPositionIcon(position) {
    const icons = {
        'gardienne': '🥅',
        'défenseuse': '🛡️',
        'milieu': '⚙️',
        'attaquante': '⚽'
    };
    return icons[position] || '👤';
}

// ===== GESTION DES ÉVÉNEMENTS DE MATCH =====

/**
 * Ajout d'un événement de match
 */
function addMatchEvent(type, data) {
    const event = {
        id: Date.now() + Math.random(),
        type: type,
        time: formatTime(appState.time),
        timestamp: new Date().toISOString(),
        half: appState.half,
        ...data
    };
    
    appState.events.unshift(event); // Ajouter en début de liste
    
    // Mettre à jour les statistiques
    updateStatsFromEvent(event);
    
    // Sauvegarder
    saveAppState();
    
    // Mettre à jour le live si actif
    updateLiveIfActive();
    
    console.log('Événement ajouté:', event);
    return event;
}

/**
 * Mise à jour des statistiques à partir d'un événement
 */
function updateStatsFromEvent(event) {
    if (event.playerId && event.playerId !== 'opponent') {
        const player = appState.players.find(p => p.id === event.playerId);
        if (player) {
            switch (event.type) {
                case 'goal':
                    player.stats.goals++;
                    if (event.isTeam) appState.score.team++;
                    break;
                case 'shot':
                    player.stats.shots++;
                    break;
                case 'card':
                    player.stats.cards++;
                    if (event.cardType === 'red') {
                        player.status = 'sanctioned';
                    }
                    break;
                case 'foul':
                    player.stats.fouls++;
                    break;
                case 'save':
                    player.stats.saves++;
                    break;
                case 'freeKick':
                    player.stats.freeKicks++;
                    break;
            }
        }
    } else if (event.type === 'goal' && !event.isTeam) {
        appState.score.opponent++;
    }
}

/**
 * Formatage du temps de match
 */
function formatTime(minutes) {
    const displayMinutes = Math.floor(minutes);
    const seconds = Math.floor((minutes - displayMinutes) * 60);
    return `${displayMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ===== GESTION DU LIVE =====

/**
 * Vérification du mode live
 */
function checkLiveMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const liveId = urlParams.get('live');
    const binId = urlParams.get('bin');
    
    if (liveId) {
        console.log('Mode live détecté:', liveId);
        initializeLiveMode(liveId, binId);
        return true;
    }
    return false;
}

/**
 * Initialisation du mode live
 */
async function initializeLiveMode(liveId, binId = null) {
    try {
        const liveData = await getLiveData(liveId, binId);
        
        if (liveData) {
            // Charger les données live
            appState.events = liveData.events || [];
            appState.score = liveData.score || { team: 0, opponent: 0 };
            appState.time = liveData.time || 0;
            appState.half = liveData.half || 1;
            appState.players = liveData.players || [];
            
            // Masquer les contrôles d'édition
            hideEditControls();
            
            // Démarrer la mise à jour automatique
            startLiveUpdates(liveId, binId);
            
            showNotification('Mode spectateur activé - Suivi live du match', 'info');
        } else {
            showNotification('Impossible de charger les données du match', 'error');
        }
    } catch (error) {
        console.error('Erreur initialisation mode live:', error);
        showNotification('Erreur lors du chargement du match live', 'error');
    }
}

/**
 * Masquer les contrôles d'édition en mode live
 */
function hideEditControls() {
    const editElements = document.querySelectorAll('.edit-only');
    editElements.forEach(el => el.style.display = 'none');
    
    // Ajouter une classe pour le mode spectateur
    document.body.classList.add('spectator-mode');
}

/**
 * Démarrage des mises à jour live
 */
function startLiveUpdates(liveId, binId) {
    setInterval(async () => {
        try {
            const liveData = await getLiveData(liveId, binId);
            if (liveData && liveData.lastUpdated !== appState.lastUpdate) {
                // Mettre à jour les données
                appState.events = liveData.events || appState.events;
                appState.score = liveData.score || appState.score;
                appState.time = liveData.time || appState.time;
                appState.half = liveData.half || appState.half;
                appState.lastUpdate = liveData.lastUpdated;
                
                // Mettre à jour l'affichage
                updateAllDisplays();
                
                console.log('Données live mises à jour');
            }
        } catch (error) {
            console.error('Erreur mise à jour live:', error);
        }
    }, 5000); // Mise à jour toutes les 5 secondes
}

/**
 * Mise à jour du live si actif
 */
async function updateLiveIfActive() {
    if (appState.currentMatch && appState.currentMatch.liveId) {
        try {
            await updateLiveData(appState.currentMatch.liveId, {
                events: appState.events,
                score: appState.score,
                time: appState.time,
                half: appState.half,
                players: appState.players
            });
        } catch (error) {
            console.error('Erreur mise à jour live:', error);
        }
    }
}

// ===== NOTIFICATIONS =====

/**
 * Affichage d'une notification
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// ===== UTILITAIRES D'AFFICHAGE =====

/**
 * Mise à jour de tous les affichages
 */
function updateAllDisplays() {
    updateScoreDisplay();
    updateTimeDisplay();
    updateEventsDisplay();
    updatePlayersDisplay();
    updateStatsDisplay();
}

/**
 * Mise à jour de l'affichage du score
 */
function updateScoreDisplay() {
    const teamScoreEl = document.getElementById('teamScore');
    const opponentScoreEl = document.getElementById('opponentScore');
    
    if (teamScoreEl) teamScoreEl.textContent = appState.score.team;
    if (opponentScoreEl) opponentScoreEl.textContent = appState.score.opponent;
}

/**
 * Mise à jour de l'affichage du temps
 */
function updateTimeDisplay() {
    const timeEl = document.getElementById('matchTime');
    const halfEl = document.getElementById('halfDisplay');
    
    if (timeEl) timeEl.textContent = formatTime(appState.time);
    if (halfEl) halfEl.textContent = appState.half === 1 ? '1ère Mi-temps' : '2ème Mi-temps';
}

/**
 * Mise à jour de l'affichage des événements
 */
function updateEventsDisplay() {
    const eventsContainers = ['eventsList', 'liveEventsList'];
    
    eventsContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        appState.events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';
            
            const icon = getEventIcon(event);
            const text = getEventText(event);
            
            eventDiv.innerHTML = `
                <span class="event-time">${event.time}</span>
                <span class="event-icon">${icon}</span>
                <span class="event-text">${text}</span>
            `;
            
            container.appendChild(eventDiv);
        });
    });
}

/**
 * Obtenir l'icône d'un événement
 */
function getEventIcon(event) {
    const icons = {
        'goal': '⚽',
        'shot': '🎯',
        'card': event.cardType === 'yellow' ? '🟨' : event.cardType === 'red' ? '🟥' : '⚪',
        'foul': '⚠️',
        'save': '🧤',
        'freeKick': '⚽',
        'substitution': '🔄',
        'halfTime': '⏱️'
    };
    return icons[event.type] || '📝';
}

/**
 * Obtenir le texte d'un événement
 */
function getEventText(event) {
    const player = appState.players.find(p => p.id === event.playerId);
    const playerName = player ? player.name : (event.playerId === 'opponent' ? 'Équipe Adverse' : 'Joueur');
    
    switch (event.type) {
        case 'goal':
            return `But de ${playerName}`;
        case 'shot':
            return `Tir de ${playerName}`;
        case 'card':
            const cardName = event.cardType === 'yellow' ? 'jaune' : event.cardType === 'red' ? 'rouge' : 'blanc';
            return `Carton ${cardName} pour ${playerName}`;
        case 'foul':
            return `Faute de ${playerName}`;
        case 'save':
            return `Arrêt de ${playerName} (${event.saveType === 'line' ? 'sur sa ligne' : 'en sortie'})`;
        case 'freeKick':
            return `Coup de pied arrêté - ${playerName}`;
        case 'substitution':
            return event.description || 'Substitution';
        case 'halfTime':
            return event.description || 'Mi-temps';
        default:
            return event.description || 'Événement';
    }
}

/**
 * Mise à jour de l'affichage des joueurs
 */
function updatePlayersDisplay() {
    // Cette fonction sera implémentée dans chaque page spécifique
    if (typeof updateSpecificPlayersDisplay === 'function') {
        updateSpecificPlayersDisplay();
    }
}

/**
 * Mise à jour de l'affichage des statistiques
 */
function updateStatsDisplay() {
    // Cette fonction sera implémentée dans la page des statistiques
    if (typeof updateSpecificStatsDisplay === 'function') {
        updateSpecificStatsDisplay();
    }
}

// ===== CHRONOMÈTRE =====

/**
 * Démarrage du chronomètre de match
 */
function startMatchTimer() {
    if (appState.isPlaying) return;
    
    appState.isPlaying = true;
    appState.timerInterval = setInterval(() => {
        appState.time += 1/60; // Ajouter 1 seconde (en minutes)
        updateTimeDisplay();
        saveAppState();
    }, 1000);
    
    console.log('Chronomètre démarré');
}

/**
 * Arrêt du chronomètre de match
 */
function stopMatchTimer() {
    if (!appState.isPlaying) return;
    
    appState.isPlaying = false;
    if (appState.timerInterval) {
        clearInterval(appState.timerInterval);
        appState.timerInterval = null;
    }
    
    console.log('Chronomètre arrêté');
}

/**
 * Reset du chronomètre
 */
function resetMatchTimer() {
    stopMatchTimer();
    appState.time = 0;
    updateTimeDisplay();
    saveAppState();
    
    console.log('Chronomètre remis à zéro');
}

// ===== EXPORT DES FONCTIONS GLOBALES =====

// Fonctions disponibles globalement
window.footballApp = {
    // État
    getState: () => appState,
    saveState: saveAppState,
    
    // Joueurs
    addPlayer: addPlayerToTeam,
    removePlayer: removePlayerFromTeam,
    updatePlayerStatus,
    getPlayersByStatus,
    getPositionIcon,
    
    // Événements
    addEvent: addMatchEvent,
    formatTime,
    
    // Affichage
    updateAllDisplays,
    showNotification,
    
    // Modales
    closeAllModals,
    
    // Chrono
    startTimer: startMatchTimer,
    stopTimer: stopMatchTimer,
    resetTimer: resetMatchTimer,
    
    // Live
    updateLive: updateLiveIfActive
};

console.log('🎯 Football Stats App - Fonctions principales chargées');