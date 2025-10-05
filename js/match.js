// ===== GESTION SPÉCIFIQUE DU MATCH =====

/**
 * Module de gestion des fonctionnalités spécifiques au match
 * Inclut: gestion du temps, événements, actions, substitutions
 */

// ===== VARIABLES GLOBALES DU MATCH =====
let matchState = {
    isPlaying: false,
    startTime: null,
    pausedTime: 0,
    timerInterval: null,
    currentTime: 0,
    currentHalf: 1,
    events: [],
    substitutionsUsed: 0,
    maxSubstitutions: 5
};

// ===== GESTION DU CHRONOMÈTRE =====

/**
 * Démarrage du chronomètre de match
 */
function startMatchTimer() {
    if (matchState.isPlaying) return false;
    
    matchState.isPlaying = true;
    matchState.startTime = Date.now() - (matchState.pausedTime * 1000);
    
    matchState.timerInterval = setInterval(() => {
        updateMatchTime();
        
        // Sauvegarder périodiquement
        if (matchState.currentTime % 60 === 0) { // Toutes les minutes
            saveMatchState();
        }
        
        // Mettre à jour le live si actif
        if (typeof updateLiveMatch === 'function') {
            updateLiveMatch();
        }
        
    }, 1000);
    
    addMatchEvent('timer', {
        description: 'Chronomètre démarré',
        isSystem: true
    });
    
    console.log('⏱️ Chronomètre démarré');
    return true;
}

/**
 * Arrêt du chronomètre de match
 */
function stopMatchTimer() {
    if (!matchState.isPlaying) return false;
    
    matchState.isPlaying = false;
    matchState.pausedTime = (Date.now() - matchState.startTime) / 1000;
    
    if (matchState.timerInterval) {
        clearInterval(matchState.timerInterval);
        matchState.timerInterval = null;
    }
    
    addMatchEvent('timer', {
        description: 'Chronomètre arrêté',
        isSystem: true
    });
    
    console.log('⏸️ Chronomètre arrêté');
    return true;
}

/**
 * Remise à zéro du chronomètre
 */
function resetMatchTimer() {
    stopMatchTimer();
    
    matchState.pausedTime = 0;
    matchState.currentTime = 0;
    matchState.startTime = null;
    
    updateTimeDisplay();
    saveMatchState();
    
    addMatchEvent('timer', {
        description: 'Chronomètre remis à zéro',
        isSystem: true
    });
    
    console.log('🔄 Chronomètre remis à zéro');
    return true;
}

/**
 * Mise à jour du temps de match
 */
function updateMatchTime() {
    if (!matchState.isPlaying || !matchState.startTime) return;
    
    const elapsedSeconds = (Date.now() - matchState.startTime) / 1000;
    matchState.currentTime = Math.floor(elapsedSeconds);
    
    updateTimeDisplay();
    
    // Alertes automatiques
    checkTimeAlerts();
}

/**
 * Vérification des alertes de temps
 */
function checkTimeAlerts() {
    const minutes = Math.floor(matchState.currentTime / 60);
    const isFirstHalf = matchState.currentHalf === 1;
    
    // Alerte 45 minutes (fin de première mi-temps)
    if (isFirstHalf && minutes === 45 && matchState.currentTime % 60 === 0) {
        showTimeAlert('Fin de la première mi-temps !');
    }
    
    // Alerte 90 minutes (fin du match)
    if (!isFirstHalf && minutes === 90 && matchState.currentTime % 60 === 0) {
        showTimeAlert('Fin du match !');
        stopMatchTimer();
        addMatchEvent('match', {
            description: 'Fin du match',
            isSystem: true
        });
    }
}

/**
 * Affichage d'une alerte de temps
 */
function showTimeAlert(message) {
    if (typeof showNotification === 'function') {
        showNotification(message, 'warning', 5000);
    } else {
        alert(message);
    }
}

/**
 * Mise à jour de l'affichage du temps
 */
function updateTimeDisplay() {
    const minutes = Math.floor(matchState.currentTime / 60);
    const seconds = matchState.currentTime % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Mettre à jour tous les éléments de temps
    const timeElements = ['matchTime', 'liveMatchTime', 'currentTime'];
    timeElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = timeString;
        }
    });
    
    // Mettre à jour l'état global de l'application
    if (typeof footballApp !== 'undefined' && footballApp.getState) {
        const state = footballApp.getState();
        state.time = matchState.currentTime / 60; // Convertir en minutes pour compatibilité
        state.isPlaying = matchState.isPlaying;
    }
}

/**
 * Passage à la seconde mi-temps
 */
function switchToSecondHalf() {
    if (matchState.currentHalf === 2) {
        console.warn('Déjà en seconde mi-temps');
        return false;
    }
    
    // Arrêter le chrono
    stopMatchTimer();
    
    // Changer de mi-temps
    matchState.currentHalf = 2;
    matchState.currentTime = 45 * 60; // 45 minutes en secondes
    matchState.pausedTime = matchState.currentTime;
    
    // Ajouter l'événement
    addMatchEvent('halfTime', {
        description: 'Début de la seconde mi-temps',
        half: 2,
        isSystem: true
    });
    
    // Mettre à jour l'affichage
    updateHalfDisplay();
    updateTimeDisplay();
    saveMatchState();
    
    console.log('⏭️ Passage en seconde mi-temps');
    return true;
}

/**
 * Mise à jour de l'affichage de la mi-temps
 */
function updateHalfDisplay() {
    const halfText = matchState.currentHalf === 1 ? '1ère Mi-temps' : '2ème Mi-temps';
    
    const halfElements = ['matchHalf', 'liveMatchHalf', 'currentHalf'];
    halfElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = halfText;
        }
    });
    
    // Mettre à jour l'état global
    if (typeof footballApp !== 'undefined' && footballApp.getState) {
        const state = footballApp.getState();
        state.half = matchState.currentHalf;
    }
}

// ===== GESTION DES ÉVÉNEMENTS =====

/**
 * Ajout d'un événement de match
 */
function addMatchEvent(type, data = {}) {
    const event = {
        id: Date.now() + Math.random(),
        type: type,
        time: formatMatchTime(matchState.currentTime),
        timestamp: new Date().toISOString(),
        half: matchState.currentHalf,
        minute: Math.floor(matchState.currentTime / 60),
        ...data
    };
    
    matchState.events.unshift(event); // Ajouter en début de liste
    
    // Ajouter aussi à l'état global de l'application
    if (typeof footballApp !== 'undefined' && footballApp.addEvent) {
        footballApp.addEvent(type, data);
    }
    
    // Mettre à jour l'affichage
    updateEventsDisplay();
    
    // Sauvegarder
    saveMatchState();
    
    console.log('📝 Événement ajouté:', event);
    return event;
}

/**
 * Suppression d'un événement
 */
function removeMatchEvent(eventId) {
    const eventIndex = matchState.events.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
        const removedEvent = matchState.events.splice(eventIndex, 1)[0];
        updateEventsDisplay();
        saveMatchState();
        
        console.log('🗑️ Événement supprimé:', removedEvent);
        return removedEvent;
    }
    
    return null;
}

/**
 * Modification d'un événement
 */
function editMatchEvent(eventId, newData) {
    const event = matchState.events.find(e => e.id === eventId);
    
    if (event) {
        Object.assign(event, newData, {
            lastModified: new Date().toISOString()
        });
        
        updateEventsDisplay();
        saveMatchState();
        
        console.log('✏️ Événement modifié:', event);
        return event;
    }
    
    return null;
}

/**
 * Formatage du temps de match
 */
function formatMatchTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== GESTION DES ACTIONS DE JEU =====

/**
 * Enregistrement d'un but
 */
function recordGoal(playerId, isOwnTeam = true, assistId = null, goalType = 'normal') {
    const event = addMatchEvent('goal', {
        playerId: playerId,
        assistId: assistId,
        isTeam: isOwnTeam,
        goalType: goalType, // normal, penalty, owngoal, freekick
        description: generateGoalDescription(playerId, isOwnTeam, goalType)
    });
    
    // Mettre à jour le score
    updateScore(isOwnTeam ? 'team' : 'opponent', 1);
    
    return event;
}

/**
 * Enregistrement d'un tir
 */
function recordShot(playerId, isOwnTeam = true, shotResult = 'off', targetArea = null) {
    return addMatchEvent('shot', {
        playerId: playerId,
        isTeam: isOwnTeam,
        result: shotResult, // on, off, blocked, post
        targetArea: targetArea, // left, right, center, high, low
        description: generateShotDescription(playerId, isOwnTeam, shotResult)
    });
}

/**
 * Enregistrement d'un carton
 */
function recordCard(playerId, cardType = 'yellow', reason = '') {
    const event = addMatchEvent('card', {
        playerId: playerId,
        cardType: cardType,
        reason: reason,
        isTeam: true,
        description: generateCardDescription(playerId, cardType, reason)
    });
    
    // Gérer les cartons rouges (sanctionner le joueur)
    if (cardType === 'red' && typeof footballApp !== 'undefined') {
        footballApp.updatePlayerStatus(playerId, 'sanctioned');
    }
    
    return event;
}

/**
 * Enregistrement d'une faute
 */
function recordFoul(playerId, isOwnTeam = true, foulType = 'normal', severity = 'minor') {
    return addMatchEvent('foul', {
        playerId: playerId,
        isTeam: isOwnTeam,
        foulType: foulType, // normal, tactical, dangerous
        severity: severity, // minor, major, serious
        description: generateFoulDescription(playerId, isOwnTeam, foulType)
    });
}

/**
 * Enregistrement d'un arrêt de gardienne
 */
function recordSave(playerId, saveType = 'normal', difficulty = 'normal') {
    return addMatchEvent('save', {
        playerId: playerId,
        saveType: saveType, // normal, diving, reflex, penalty
        difficulty: difficulty, // easy, normal, difficult, spectacular
        isTeam: true,
        description: generateSaveDescription(playerId, saveType, difficulty)
    });
}

// ===== FONCTIONS DE GÉNÉRATION DE DESCRIPTIONS =====

function generateGoalDescription(playerId, isOwnTeam, goalType) {
    const playerName = getPlayerName(playerId);
    const teamPrefix = isOwnTeam ? '' : 'But contre son camp - ';
    
    const typeDescriptions = {
        normal: `But de ${playerName}`,
        penalty: `But sur penalty - ${playerName}`,
        owngoal: `But contre son camp - ${playerName}`,
        freekick: `But sur coup franc - ${playerName}`,
        header: `But de la tête - ${playerName}`
    };
    
    return teamPrefix + (typeDescriptions[goalType] || typeDescriptions.normal);
}

function generateShotDescription(playerId, isOwnTeam, shotResult) {
    const playerName = getPlayerName(playerId);
    
    const resultDescriptions = {
        on: `Tir cadré de ${playerName}`,
        off: `Tir non cadré de ${playerName}`,
        blocked: `Tir contré de ${playerName}`,
        post: `Tir sur le poteau de ${playerName}`
    };
    
    return resultDescriptions[shotResult] || `Tir de ${playerName}`;
}

function generateCardDescription(playerId, cardType, reason) {
    const playerName = getPlayerName(playerId);
    const cardNames = {
        yellow: 'jaune',
        red: 'rouge',
        white: 'blanc'
    };
    
    const cardName = cardNames[cardType] || cardType;
    let description = `Carton ${cardName} pour ${playerName}`;
    
    if (reason) {
        description += ` (${reason})`;
    }
    
    return description;
}

function generateFoulDescription(playerId, isOwnTeam, foulType) {
    const playerName = getPlayerName(playerId);
    
    const typeDescriptions = {
        normal: `Faute de ${playerName}`,
        tactical: `Faute tactique de ${playerName}`,
        dangerous: `Jeu dangereux de ${playerName}`
    };
    
    return typeDescriptions[foulType] || typeDescriptions.normal;
}

function generateSaveDescription(playerId, saveType, difficulty) {
    const playerName = getPlayerName(playerId);
    
    const typeDescriptions = {
        normal: `Arrêt de ${playerName}`,
        diving: `Arrêt plongeant de ${playerName}`,
        reflex: `Arrêt réflexe de ${playerName}`,
        penalty: `Arrêt sur penalty de ${playerName}`
    };
    
    const difficultyPrefix = {
        spectacular: 'Arrêt spectaculaire - ',
        difficult: 'Bel arrêt - ',
        easy: '',
        normal: ''
    };
    
    const prefix = difficultyPrefix[difficulty] || '';
    const base = typeDescriptions[saveType] || typeDescriptions.normal;
    
    return prefix + base;
}

// ===== GESTION DES SUBSTITUTIONS =====

/**
 * Effectuer une substitution
 */
function makeSubstitution(outPlayerId, inPlayerId, reason = '', minute = null) {
    if (matchState.substitutionsUsed >= matchState.maxSubstitutions) {
        throw new Error('Nombre maximum de substitutions atteint');
    }
    
    // Vérifier que les joueurs existent et sont dans les bons statuts
    if (typeof footballApp !== 'undefined') {
        const state = footballApp.getState();
        const outPlayer = state.players.find(p => p.id === outPlayerId);
        const inPlayer = state.players.find(p => p.id === inPlayerId);
        
        if (!outPlayer || outPlayer.status !== 'field') {
            throw new Error('Le joueur sortant doit être sur le terrain');
        }
        
        if (!inPlayer || inPlayer.status !== 'bench') {
            throw new Error('Le joueur entrant doit être sur le banc');
        }
        
        // Effectuer la substitution
        footballApp.updatePlayerStatus(outPlayerId, 'bench');
        footballApp.updatePlayerStatus(inPlayerId, 'field');
    }
    
    // Enregistrer l'événement
    const event = addMatchEvent('substitution', {
        outPlayerId: outPlayerId,
        inPlayerId: inPlayerId,
        reason: reason,
        minute: minute || Math.floor(matchState.currentTime / 60),
        isTeam: true,
        description: generateSubstitutionDescription(outPlayerId, inPlayerId, reason)
    });
    
    matchState.substitutionsUsed++;
    
    console.log(`🔄 Substitution effectuée (${matchState.substitutionsUsed}/${matchState.maxSubstitutions})`);
    return event;
}

function generateSubstitutionDescription(outPlayerId, inPlayerId, reason) {
    const outPlayerName = getPlayerName(outPlayerId);
    const inPlayerName = getPlayerName(inPlayerId);
    
    let description = `${inPlayerName} remplace ${outPlayerName}`;
    
    if (reason) {
        description += ` (${reason})`;
    }
    
    return description;
}

// ===== GESTION DU SCORE =====

/**
 * Mise à jour du score
 */
function updateScore(team, increment = 1) {
    if (typeof footballApp !== 'undefined') {
        const state = footballApp.getState();
        
        if (team === 'team') {
            state.score.team += increment;
        } else if (team === 'opponent') {
            state.score.opponent += increment;
        }
        
        // Mettre à jour l'affichage
        updateScoreDisplay();
        footballApp.saveState();
    }
}

/**
 * Mise à jour de l'affichage du score
 */
function updateScoreDisplay() {
    if (typeof footballApp !== 'undefined') {
        const state = footballApp.getState();
        
        const scoreElements = [
            { team: 'teamScore', opponent: 'opponentScore' },
            { team: 'liveTeamScore', opponent: 'liveOpponentScore' },
            { team: 'summaryTeamScore', opponent: 'summaryOpponentScore' }
        ];
        
        scoreElements.forEach(pair => {
            const teamElement = document.getElementById(pair.team);
            const opponentElement = document.getElementById(pair.opponent);
            
            if (teamElement) teamElement.textContent = state.score.team;
            if (opponentElement) opponentElement.textContent = state.score.opponent;
        });
    }
}

// ===== UTILITAIRES =====

/**
 * Mise à jour de l'affichage des événements
 */
function updateEventsDisplay() {
    const containers = ['eventsList', 'eventsTimeline', 'liveEventsTimeline'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (matchState.events.length === 0) {
            container.innerHTML = '<p class="no-events">Aucun événement enregistré</p>';
            return;
        }
        
        matchState.events.forEach((event, index) => {
            const eventElement = createEventElement(event, index);
            container.appendChild(eventElement);
        });
    });
}

/**
 * Création d'un élément d'événement
 */
function createEventElement(event, index) {
    const element = document.createElement('div');
    element.className = `event-item ${event.isTeam ? 'team' : 'opponent'} ${event.isSystem ? 'system' : ''}`;
    
    const icon = getEventIcon(event.type, event);
    const description = event.description || 'Événement';
    
    element.innerHTML = `
        <div class="event-time">${event.time}</div>
        <div class="event-icon">${icon}</div>
        <div class="event-description">${description}</div>
        <div class="event-actions">
            <button class="btn-small edit" onclick="editEvent(${index})" title="Modifier">✏️</button>
            <button class="btn-small delete" onclick="deleteEvent(${index})" title="Supprimer">🗑️</button>
        </div>
    `;
    
    return element;
}

/**
 * Obtenir l'icône d'un événement
 */
function getEventIcon(type, event = {}) {
    const icons = {
        goal: '⚽',
        shot: '🎯',
        card: event.cardType === 'yellow' ? '🟨' : event.cardType === 'red' ? '🟥' : '⚪',
        foul: '⚠️',
        save: '🧤',
        substitution: '🔄',
        timer: '⏱️',
        halfTime: '⏱️',
        match: '🏁',
        freeKick: '⚽'
    };
    
    return icons[type] || '📝';
}

// ===== SAUVEGARDE ET CHARGEMENT =====

/**
 * Sauvegarde de l'état du match
 */
function saveMatchState() {
    try {
        const dataToSave = {
            matchState: matchState,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('footballMatch_current', JSON.stringify(dataToSave));
        
        // Sauvegarder aussi dans l'état global si disponible
        if (typeof footballApp !== 'undefined') {
            footballApp.saveState();
        }
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du match:', error);
    }
}

/**
 * Chargement de l'état du match
 */
function loadMatchState() {
    try {
        const saved = localStorage.getItem('footballMatch_current');
        
        if (saved) {
            const data = JSON.parse(saved);
            
            if (data.matchState) {
                // Fusionner avec l'état par défaut pour assurer la compatibilité
                matchState = {
                    ...matchState,
                    ...data.matchState,
                    // Ne pas restaurer l'interval et l'état de lecture
                    timerInterval: null,
                    isPlaying: false
                };
                
                console.log('État du match chargé:', matchState);
                return true;
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement du match:', error);
    }
    
    return false;
}

/**
 * Export de l'état du match
 */
function exportMatchState() {
    const exportData = {
        match: matchState,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    return exportData;
}

/**
 * Import de l'état du match
 */
function importMatchState(data) {
    try {
        if (data.match) {
            matchState = {
                ...matchState,
                ...data.match,
                timerInterval: null,
                isPlaying: false
            };
            
            updateTimeDisplay();
            updateHalfDisplay();
            updateEventsDisplay();
            updateScoreDisplay();
            
            console.log('État du match importé avec succès');
            return true;
        }
    } catch (error) {
        console.error('Erreur lors de l\'import du match:', error);
    }
    
    return false;
}

// ===== INITIALISATION ET NETTOYAGE =====

/**
 * Initialisation du module match
 */
function initializeMatchModule() {
    console.log('🚀 Initialisation du module Match');
    
    // Charger l'état sauvegardé
    loadMatchState();
    
    // Mettre à jour les affichages
    updateTimeDisplay();
    updateHalfDisplay();
    updateEventsDisplay();
    updateScoreDisplay();
    
    // Configurer la sauvegarde automatique
    setInterval(() => {
        if (matchState.isPlaying) {
            saveMatchState();
        }
    }, 30000); // Toutes les 30 secondes
    
    console.log('✅ Module Match initialisé');
}

/**
 * Nettoyage du module match
 */
function cleanupMatchModule() {
    // Arrêter le chronomètre
    stopMatchTimer();
    
    // Sauvegarder l'état final
    saveMatchState();
    
    console.log('🧹 Module Match nettoyé');
}

// ===== EXPORT DES FONCTIONS =====

// Fonctions disponibles globalement pour les autres modules
if (typeof window !== 'undefined') {
    window.matchModule = {
        // Timer
        start: startMatchTimer,
        stop: stopMatchTimer,
        reset: resetMatchTimer,
        switchHalf: switchToSecondHalf,
        
        // Events
        addEvent: addMatchEvent,
        removeEvent: removeMatchEvent,
        editEvent: editMatchEvent,
        
        // Actions
        recordGoal,
        recordShot,
        recordCard,
        recordFoul,
        recordSave,
        makeSubstitution,
        
        // State
        getState: () => matchState,
        save: saveMatchState,
        load: loadMatchState,
        export: exportMatchState,
        import: importMatchState,
        
        // Initialization
        init: initializeMatchModule,
        cleanup: cleanupMatchModule
    };
}

// Auto-initialisation si on est dans un navigateur
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Initialiser seulement si on est sur une page de match
        if (window.location.pathname.includes('match.html') || 
            document.getElementById('matchTime') || 
            document.querySelector('.match-interface')) {
            initializeMatchModule();
        }
    });
    
    // Nettoyage avant fermeture
    window.addEventListener('beforeunload', cleanupMatchModule);
}

console.log('⚽ Module Match chargé');