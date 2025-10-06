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
    selectedCardType: null,
    timerInterval: null
};

// ===== INITIALISATION =====
// Initialisation de la page
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
    if (typeof checkLiveMode === 'function') {
        checkLiveMode();
    }
    
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
}

// ===== NOTIFICATIONS =====

/**
 * Affichage des notifications
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Créer l'élément de notification s'il n'existe pas
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(container);
    }
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 12px 16px;
        margin: 5px 0;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Suppression automatique
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// ===== GESTION DES JOUEURS =====

/**
 * Ajout d'un joueur à l'équipe
 */
function addPlayerToTeam(playerData) {
    // Validation des données
    if (!playerData.name || !playerData.position) {
        showNotification('Nom et position sont obligatoires !', 'error');
        return null;
    }
    
    // Vérifier si le nom existe déjà
    if (appState.players.some(p => p.name.toLowerCase() === playerData.name.toLowerCase())) {
        showNotification('Une joueuse avec ce nom existe déjà !', 'error');
        return null;
    }
    
    // Vérifier si le numéro est déjà pris
    if (playerData.number && appState.players.some(p => p.number === playerData.number)) {
        showNotification(`Le numéro ${playerData.number} est déjà pris !`, 'error');
        return null;
    }
    
    const player = {
        id: Date.now() + Math.random(),
        name: playerData.name,
        position: playerData.position,
        number: playerData.number || null,
        status: 'available', // available, field, bench, out
        stats: {
            goals: 0,
            shots: 0,
            cards: 0,
            fouls: 0,
            saves: 0
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
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
                    appState.score.team++;
                    break;
                case 'shot':
                    player.stats.shots++;
                    break;
                case 'card':
                    player.stats.cards++;
                    break;
                case 'foul':
                    player.stats.fouls++;
                    break;
                case 'save':
                    player.stats.saves++;
                    break;
            }
        }
    } else if (event.playerId === 'opponent' && event.type === 'goal') {
        appState.score.opponent++;
    }
}

/**
 * Formatage du temps en MM:SS
 */
function formatTime(timeInMinutes) {
    const minutes = Math.floor(timeInMinutes);
    const seconds = Math.floor((timeInMinutes % 1) * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Obtenir la description d'un événement
 */
function getEventDescription(event) {
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

// ===== FONCTIONS D'AFFICHAGE =====

/**
 * Mise à jour de l'affichage du temps
 */
function updateTimeDisplay() {
    const timeElements = ['matchTime', 'liveTime', 'timerDisplay'];
    timeElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formatTime(appState.time);
        }
    });
}

/**
 * Mise à jour de l'affichage du score
 */
function updateScoreDisplay() {
    const scoreElements = [
        { team: 'teamScore', opponent: 'opponentScore' },
        { team: 'liveTeamScore', opponent: 'liveOpponentScore' },
        { team: 'headerTeamScore', opponent: 'headerOpponentScore' }
    ];
    
    scoreElements.forEach(pair => {
        const teamElement = document.getElementById(pair.team);
        const opponentElement = document.getElementById(pair.opponent);
        
        if (teamElement) teamElement.textContent = appState.score.team;
        if (opponentElement) opponentElement.textContent = appState.score.opponent;
    });
}

/**
 * Mise à jour de l'affichage des mi-temps
 */
function updateHalfDisplay() {
    const halfElements = ['matchHalf', 'halfDisplay', 'currentHalf'];
    const halfText = appState.half === 1 ? '1ère Mi-temps' : '2ème Mi-temps';
    
    halfElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = halfText;
        }
    });
}

/**
 * Mise à jour de l'affichage des événements
 */
function updateEventsDisplay() {
    const containers = ['eventsList', 'eventsTimeline', 'matchEvents'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (appState.events.length === 0) {
            container.innerHTML = '<p class="no-events">Aucun événement enregistré</p>';
            return;
        }
        
        // Afficher les événements les plus récents en premier
        appState.events.forEach((event, index) => {
            const eventElement = createEventElement(event, index);
            container.appendChild(eventElement);
        });
    });
}

/**
 * Création d'un élément d'événement pour l'affichage
 */
function createEventElement(event, index) {
    const element = document.createElement('div');
    element.className = `event-item ${event.isTeam ? 'team-event' : 'opponent-event'}`;
    
    const player = appState.players.find(p => p.id === event.playerId);
    const playerName = player ? player.name : (event.playerId === 'opponent' ? 'Équipe Adverse' : 'Joueur');
    
    element.innerHTML = `
        <div class="event-time">${event.time}</div>
        <div class="event-description">${getEventDescription(event)}</div>
        <div class="event-meta">
            ${event.half === 1 ? '1ère' : '2ème'} mi-temps
            ${event.isTeam ? '• Notre équipe' : '• Équipe adverse'}
        </div>
    `;
    
    return element;
}

/**
 * Mise à jour des statistiques rapides
 */
function updateQuickStats() {
    const stats = {
        totalEvents: appState.events.length,
        goals: appState.events.filter(e => e.type === 'goal').length,
        cards: appState.events.filter(e => e.type === 'card').length,
        substitutions: appState.events.filter(e => e.type === 'substitution').length
    };
    
    // Mettre à jour les éléments d'affichage des stats
    const statsElements = [
        { id: 'totalEvents', value: stats.totalEvents },
        { id: 'totalGoals', value: stats.goals },
        { id: 'totalCards', value: stats.cards },
        { id: 'totalSubstitutions', value: stats.substitutions }
    ];
    
    statsElements.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (element) {
            element.textContent = stat.value;
        }
    });
}

/**
 * Mise à jour de l'affichage du bouton play/pause
 */
function updatePlayButton() {
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        if (appState.isPlaying) {
            playBtn.innerHTML = '⏸️ Pause';
            playBtn.className = 'btn btn-warning';
        } else {
            playBtn.innerHTML = '▶️ Démarrer';
            playBtn.className = 'btn btn-success';
        }
    }
}

/**
 * Mise à jour complète de l'affichage du match
 */
function updateMatchDisplay() {
    updateScoreDisplay();
    updateTimeDisplay();
    updateHalfDisplay();
    updateEventsDisplay();
    updateQuickStats();
    updatePlayButton();
    
    // Appeler les fonctions spécifiques de la page si elles existent
    if (typeof updateSpecificMatchDisplay === 'function') {
        updateSpecificMatchDisplay();
    }
}

/**
 * Mise à jour de tous les affichages
 */
function updateAllDisplays() {
    updateMatchDisplay();
    
    // Mise à jour de l'affichage des joueurs
    if (typeof updatePlayersDisplay === 'function') {
        updatePlayersDisplay();
    }
    
    // Mise à jour de l'affichage des statistiques
    if (typeof updateStatsDisplay === 'function') {
        updateStatsDisplay();
    }
}

// ===== GESTION DU LIVE =====

/**
 * Mise à jour du live si actif
 */
function updateLiveIfActive() {
    if (typeof updateLive === 'function') {
        updateLive();
    }
}

// ===== NOUVELLES FONCTIONS POUR RESET ET NOUVEAU MATCH =====

/**
 * Démarrer un nouveau match
 */
function startNewMatch() {
    try {
        // Arrêter le chronomètre s'il tourne
        stopMatchTimer();
        
        // Réinitialiser les données de match
        clearMatchData();
        
        // Créer un nouveau match
        createNewMatch();
        
        // Mettre à jour tous les affichages immédiatement
        updateMatchDisplay();
        updateAllDisplays();
        
        console.log('✅ Nouveau match créé');
        showNotification('🆕 Nouveau match créé ! Prêt à commencer.', 'success');
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la création du nouveau match:', error);
        showNotification('❌ Erreur lors de la création du match', 'error');
        return false;
    }
}

/**
 * Effacer les données de match
 */
function clearMatchData() {
    // Reset de l'état du match
    appState.currentMatch = null;
    appState.events = [];
    appState.score = { team: 0, opponent: 0 };
    appState.time = 0;
    appState.half = 1;
    appState.isPlaying = false;
    
    // Arrêter le chronomètre s'il tourne
    stopMatchTimer();
    
    // Supprimer les données du localStorage
    removeData('currentMatch');
    
    // Mettre à jour l'affichage immédiatement
    updateMatchDisplay();
    
    console.log('📝 Données de match effacées');
}

/**
 * Reset des données de composition
 */
function resetCompositionData() {
    // Remettre tous les joueurs en statut "available"
    appState.players.forEach(player => {
        player.status = 'available';
        // Reset des stats individuelles
        player.stats = {
            goals: 0,
            shots: 0,
            cards: 0,
            fouls: 0,
            saves: 0
        };
    });
    
    saveAppState();
    
    // Mettre à jour l'affichage des joueurs
    if (typeof updatePlayersDisplay === 'function') {
        updatePlayersDisplay();
    }
    
    console.log('🔄 Composition réinitialisée');
}

/**
 * Créer un nouveau match
 */
function createNewMatch() {
    const matchConfig = loadData('matchConfig') || {
        teamName: 'Mon Équipe',
        opponentName: 'Adversaire',
        venue: 'Stade',
        date: new Date().toISOString().split('T')[0]
    };
    
    appState.currentMatch = {
        id: Date.now(),
        config: matchConfig,
        startTime: new Date().toISOString(),
        status: 'created',
        events: [],
        score: { team: 0, opponent: 0 },
        time: 0,
        half: 1
    };
    
    // S'assurer que l'état local correspond
    appState.events = [];
    appState.score = { team: 0, opponent: 0 };
    appState.time = 0;
    appState.half = 1;
    appState.isPlaying = false;
    
    saveAppState();
    
    // Mettre à jour tous les affichages
    updateMatchDisplay();
    
    console.log('⚽ Nouveau match configuré');
}

/**
 * Reset complet de l'application
 */
function resetCompleteApp() {
    try {
        // 1. Arrêter le chronomètre
        stopMatchTimer();
        
        // 2. Effacer toutes les données "footballStats_" (via storage.js)
        if (typeof clearAllData === 'function') {
            clearAllData();
        }
        
        // 3. Effacer toutes les données de match spécifiques
        clearMatchData();
        
        // 4. Reset des sélections de composition
        resetCompositionData();
        
        // 5. Reset de l'état de l'application
        appState.currentMatch = null;
        appState.players = [];
        appState.events = [];
        appState.score = { team: 0, opponent: 0 };
        appState.time = 0;
        appState.half = 1;
        appState.isPlaying = false;
        
        // Sauvegarder l'état vide
        saveAppState();
        
        // 6. Mettre à jour TOUS les affichages immédiatement
        updateMatchDisplay();
        updateAllDisplays();
        
        console.log('✅ Reset complet terminé');
        showNotification('🔄 Toutes les données ont été effacées ! Application remise à zéro.', 'success');
        
        // Recharger la page pour un état complètement propre
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
            }
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors du reset complet:', error);
        showNotification('❌ Erreur lors du reset complet', 'error');
        return false;
    }
}

/**
 * Obtenir les statistiques de la page d'accueil
 */
function getHomePageStats() {
    const players = appState.players || [];
    let currentMatchData = null;
    
    // Charger les données du match actuel
    try {
        const matchStr = localStorage.getItem('footballStats_currentMatch');
        if (matchStr) {
            currentMatchData = JSON.parse(matchStr);
        }
    } catch (e) {
        console.log('Aucune donnée de match valide');
    }
    
    const stats = {
        hasData: players.length > 0 || currentMatchData !== null,
        players: {
            total: players.length,
            field: players.filter(p => p.status === 'field').length,
            bench: players.filter(p => p.status === 'bench').length
        },
        match: null
    };
    
    if (currentMatchData) {
        const matchStats = currentMatchData.stats || { myTeam: { goals: 0 }, opponent: { goals: 0 } };
        const events = currentMatchData.events || [];
        const timer = currentMatchData.timer || {};
        
        stats.match = {
            score: {
                team: matchStats.myTeam.goals || 0,
                opponent: matchStats.opponent.goals || 0
            },
            events: events.length,
            half: timer.currentHalf || 1
        };
    }
    
    return stats;
}

/**
 * Export des données pour sauvegarde
 */
function exportCurrentMatch() {
    const players = appState.players || [];
    const currentMatch = localStorage.getItem('footballStats_currentMatch');
    const matchConfig = loadData('matchConfig');
    
    const exportData = {
        players: players,
        currentMatch: currentMatch ? JSON.parse(currentMatch) : null,
        matchConfig: matchConfig,
        appState: {
            events: appState.events,
            score: appState.score,
            time: appState.time,
            half: appState.half
        },
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    return exportData;
}

/**
 * Import des données depuis une sauvegarde
 */
function importMatchData(data) {
    try {
        // Importer les joueurs
        if (data.players) {
            appState.players = data.players;
            saveData('players', data.players);
        }
        
        // Importer la configuration du match
        if (data.matchConfig) {
            saveData('matchConfig', data.matchConfig);
        }
        
        // Importer les données du match actuel
        if (data.currentMatch) {
            localStorage.setItem('footballStats_currentMatch', JSON.stringify(data.currentMatch));
            appState.currentMatch = data.currentMatch;
        }
        
        // Importer l'état de l'application
        if (data.appState) {
            appState.events = data.appState.events || [];
            appState.score = data.appState.score || { team: 0, opponent: 0 };
            appState.time = data.appState.time || 0;
            appState.half = data.appState.half || 1;
        }
        
        // Sauvegarder l'état mis à jour
        saveAppState();
        
        console.log('✅ Données importées avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        return false;
    }
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
    
    // Affichage principal
    updateAllDisplays,
    updateMatchDisplay,
    updateScoreDisplay,
    updateTimeDisplay,
    updateHalfDisplay,
    updateEventsDisplay,
    updateQuickStats,
    updatePlayButton,
    showNotification,
    
    // Modales
    closeAllModals,
    
    // Chrono
    startTimer: startMatchTimer,
    stopTimer: stopMatchTimer,
    resetTimer: resetMatchTimer,
    
    // Live
    updateLive: updateLiveIfActive,
    
    // ===== NOUVELLES FONCTIONS AJOUTÉES =====
    
    // Gestion des matchs
    startNewMatch,
    resetCompleteApp,
    clearMatchData,
    resetCompositionData,
    createNewMatch,
    
    // Statistiques
    getHomePageStats,
    
    // Import/Export
    exportCurrentMatch,
    importMatchData
};

/**
 * Obtenir le temps actuel formaté
 */
function getCurrentTime() {
    const minutes = Math.floor(appState.time);
    const seconds = Math.floor((appState.time % 1) * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Ajouter à l'export footballApp
window.footballApp.getCurrentTime = getCurrentTime;

/**
 * Obtenir l'icône de position
 */
function getPositionIcon(position) {
    if (!position) return '👤';
    
    const positionLower = position.toLowerCase();
    
    const icons = {
        'gardienne': '🧤',
        'garden': '🧤',
        'défenseuse': '🛡️',
        'milieu': '⚙️',
        'attaquante': '⚽'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
        if (positionLower.includes(key)) {
            return icon;
        }
    }
    
    return '👤';
}

if (typeof window.getPositionIcon === 'undefined') {
    window.getPositionIcon = getPositionIcon;
}

// Exposer globalement si ce n'est pas déjà fait
if (typeof window.getPositionIcon === 'undefined') {
    window.getPositionIcon = getPositionIcon;
}

// Ajouter aussi à footballApp si il existe
if (typeof footballApp !== 'undefined' && !footballApp.getPositionIcon) {
    footballApp.getPositionIcon = getPositionIcon;
}

console.log('🎯 Football Stats App - Fonctions principales chargées');