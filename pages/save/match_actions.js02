// match-actions.js - Gestion des actions de match

// Variables globales pour les sélections
let currentActionType = null;
let selectedOption = null;
let selectedPlayerId = null;
let isOpponentAction = false;

// Variables pour les changements
let substitutionTeam = null;
let playerOutId = null;
let playerInId = null;

// Gestion des timers carton blanc
let whiteCardTimers = [];

/**
 * Configuration des actions avec leurs options
 */
const ACTION_CONFIG = {
    goal: {
        title: 'But',
        options: ['But', 'Penalty', 'Coup franc', 'Corner', 'Contre son camp']
    },
    assist: {
        title: 'Passe Décisive',
        options: null // Pas d'options
    },
    shot: {
        title: 'Tir',
        options: ['Cadré', 'Non cadré', 'Contré', 'Poteau', 'Arrêté par gardien']
    },
    save: {
        title: 'Arrêt Gardien',
        options: ['Sur sa ligne', 'En sortie']
    },
    foul: {
        title: 'Faute',
        options: ['Penalty', 'Coup franc']
    },
    card: {
        title: 'Carton',
        options: ['Jaune', 'Rouge', 'Blanc']
    },
    corner: {
        title: 'Corner',
        options: null
    },
    offside: {
        title: 'Hors-jeu',
        options: null
    }
};

/**
 * Afficher la modale d'action unifiée
 */
function showUnifiedActionModal(actionType) {
    currentActionType = actionType;
    selectedOption = null;
    selectedPlayerId = null;
    isOpponentAction = false;
    
    const config = ACTION_CONFIG[actionType];
    if (!config) return;
    
    // Titre
    document.getElementById('unifiedActionTitle').textContent = config.title;
    
    // Options (si applicable)
    const optionsZone = document.getElementById('actionOptionsZone');
    const optionsButtons = document.getElementById('actionOptionsButtons');
    
    if (config.options && config.options.length > 0) {
        optionsZone.style.display = 'block';
        optionsButtons.innerHTML = '';
        
        config.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'btn option-btn';
            btn.textContent = option;
            btn.onclick = () => selectActionOption(option, btn);
            optionsButtons.appendChild(btn);
        });
    } else {
        optionsZone.style.display = 'none';
    }
    
    // Charger les joueurs
    loadTeamPlayers();
    
    // Réinitialiser le bouton adversaire
    const opponentBtn = document.getElementById('opponentBtn');
    opponentBtn.classList.remove('selected');
    
    // Désactiver le bouton sauvegarder
    document.getElementById('saveUnifiedActionBtn').disabled = true;
    
    // Afficher la modale
    document.getElementById('unifiedActionModal').style.display = 'block';
}

/**
 * Sélectionner une option
 */
function selectActionOption(option, btnElement) {
    selectedOption = option;
    
    // Feedback visuel
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
    
    checkUnifiedActionReadiness();
}

/**
 * Charger les joueurs de l'équipe
 */
function loadTeamPlayers() {
    const container = document.getElementById('teamPlayerButtons');
    container.innerHTML = '';
    
    // Récupérer les joueurs depuis footballApp
    const players = footballApp.getState().players || [];
    
    // Filtrer selon le type d'action
    let availablePlayers = [];
    
    if (currentActionType === 'save') {
        // Uniquement les gardiennes sur le terrain
        availablePlayers = players.filter(p => 
            p.position === 'gardienne' && p.status === 'field'
        );
    } else {
        // Tous les joueurs sur le terrain
        availablePlayers = players.filter(p => p.status === 'field');
    }
    
    if (availablePlayers.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 10px;">Aucune joueuse sur le terrain</p>';
        return;
    }
    
    availablePlayers.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'player-btn';
        
        // Icône de statut
        let statusIcon = '🟢'; // Sur le terrain
        if (player.position === 'gardienne') {
            statusIcon = '🧤';
        }
        
        btn.innerHTML = `
            <div>${statusIcon} ${player.name}</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">${player.position || ''}</div>
        `;
        
        btn.onclick = () => selectPlayer(player.id, btn);
        container.appendChild(btn);
    });
}

/**
 * Sélectionner un joueur
 */
function selectPlayer(playerId, btnElement) {
    selectedPlayerId = playerId;
    isOpponentAction = false;
    
    // Feedback visuel
    const buttons = document.querySelectorAll('#teamPlayerButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
    
    // Retirer la sélection adversaire
    document.getElementById('opponentBtn').classList.remove('selected');
    
    checkUnifiedActionReadiness();
}

/**
 * Sélectionner adversaire
 */
function selectOpponent() {
    isOpponentAction = true;
    selectedPlayerId = null;
    
    // Feedback visuel
    const opponentBtn = document.getElementById('opponentBtn');
    opponentBtn.classList.add('selected');
    
    // Retirer les sélections de joueurs
    const buttons = document.querySelectorAll('#teamPlayerButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    checkUnifiedActionReadiness();
}

/**
 * Vérifier si l'action peut être sauvegardée
 */
function checkUnifiedActionReadiness() {
    const saveBtn = document.getElementById('saveUnifiedActionBtn');
    const config = ACTION_CONFIG[currentActionType];
    
    let canSave = false;
    
    // Il faut soit un joueur, soit adversaire
    const hasSelection = selectedPlayerId !== null || isOpponentAction;
    
    // Si options requises, vérifier qu'une option est sélectionnée
    if (config.options && config.options.length > 0) {
        canSave = hasSelection && selectedOption !== null;
    } else {
        canSave = hasSelection;
    }
    
    saveBtn.disabled = !canSave;
}

/**
 * Sauvegarder l'action
 */
function saveUnifiedAction() {
    if (!currentActionType) return;
    
    // Construire l'événement
    const eventData = {
        type: currentActionType,
        time: getCurrentMatchTime(),
        half: footballApp.getState().half || 1,
        isTeam: !isOpponentAction
    };
    
    // Ajouter l'option si applicable
    if (selectedOption) {
        eventData.option = selectedOption;
    }
    
    // Ajouter le joueur si applicable
    if (selectedPlayerId) {
        const player = footballApp.getState().players.find(p => p.id === selectedPlayerId);
        eventData.playerId = selectedPlayerId;
        eventData.playerName = player ? player.name : 'Inconnue';
    } else {
        eventData.playerName = 'Adversaire';
    }
    
    // Cas spéciaux
    handleSpecialCases(eventData);
    
    // Ajouter l'événement
    footballApp.addEvent(currentActionType, eventData);
    
    // Mettre à jour l'affichage
    updateMatchDisplay();
    
    // Mettre à jour le live
    if (typeof footballApp.updateLive === 'function') {
        footballApp.updateLive();
    }
    
    // Fermer la modale
    closeUnifiedActionModal();
    
    showNotification('Action enregistrée !', 'success');
}

/**
 * Gérer les cas spéciaux
 */
function handleSpecialCases(eventData) {
    // Carton rouge : retirer du terrain
    if (currentActionType === 'card' && selectedOption === 'Rouge' && selectedPlayerId) {
        const players = footballApp.getState().players;
        const player = players.find(p => p.id === selectedPlayerId);
        if (player) {
            player.status = 'out';
            footballApp.updatePlayer(selectedPlayerId, { status: 'out' });
        }
    }
    
    // Carton blanc : démarrer timer 10min
    if (currentActionType === 'card' && selectedOption === 'Blanc' && selectedPlayerId) {
        startWhiteCardTimer(selectedPlayerId);
    }
    
    // But : mettre à jour le score
    if (currentActionType === 'goal') {
        const score = footballApp.getState().score;
        if (isOpponentAction) {
            score.opponent++;
        } else {
            score.team++;
        }
        footballApp.updateScore(score);
    }
}

/**
 * Démarrer un timer de carton blanc
 */
function startWhiteCardTimer(playerId) {
    const player = footballApp.getState().players.find(p => p.id === playerId);
    if (!player) return;
    
    const timer = {
        id: Date.now(),
        playerId: playerId,
        playerName: player.name,
        startTime: Date.now(),
        duration: 10 * 60 * 1000, // 10 minutes en ms
        remaining: 10 * 60 * 1000
    };
    
    whiteCardTimers.push(timer);
    displayWhiteCardTimers();
    
    // Démarrer le décompte
    timer.interval = setInterval(() => {
        updateWhiteCardTimer(timer.id);
    }, 1000);
}

/**
 * Mettre à jour un timer de carton blanc
 */
function updateWhiteCardTimer(timerId) {
    const timer = whiteCardTimers.find(t => t.id === timerId);
    if (!timer) return;
    
    const elapsed = Date.now() - timer.startTime;
    timer.remaining = timer.duration - elapsed;
    
    if (timer.remaining <= 0) {
        clearInterval(timer.interval);
        timer.remaining = 0;
    }
    
    displayWhiteCardTimers();
}

/**
 * Afficher les timers de carton blanc
 */
function displayWhiteCardTimers() {
    const zone = document.getElementById('whiteCardTimersZone');
    const list = document.getElementById('whiteCardTimersList');
    
    if (whiteCardTimers.length === 0) {
        zone.style.display = 'none';
        return;
    }
    
    zone.style.display = 'block';
    list.innerHTML = '';
    
    whiteCardTimers.forEach(timer => {
        const div = document.createElement('div');
        div.className = 'white-card-timer' + (timer.remaining <= 0 ? ' expired' : '');
        
        const minutes = Math.floor(timer.remaining / 60000);
        const seconds = Math.floor((timer.remaining % 60000) / 1000);
        
        div.innerHTML = `
            <div class="timer-name">⬜ ${timer.playerName}</div>
            <div class="timer-countdown">${minutes}:${seconds.toString().padStart(2, '0')}</div>
            ${timer.remaining <= 0 ? '<div style="color: #4CAF50;">✓ Terminé</div>' : ''}
        `;
        
        list.appendChild(div);
    });
}

/**
 * Fermer la modale d'action
 */
function closeUnifiedActionModal() {
    document.getElementById('unifiedActionModal').style.display = 'none';
    currentActionType = null;
    selectedOption = null;
    selectedPlayerId = null;
    isOpponentAction = false;
}

// ============================================
// GESTION DES CHANGEMENTS
// ============================================

/**
 * Afficher la modale de changement
 */
function showSubstitutionModal() {
    substitutionTeam = null;
    playerOutId = null;
    playerInId = null;
    
    // Réinitialiser les boutons d'équipe
    document.getElementById('subMyTeamBtn').style.opacity = '1';
    document.getElementById('subOpponentBtn').style.opacity = '1';
    
    // Cacher la section mon équipe
    document.getElementById('myTeamSubSection').style.display = 'none';
    
    // Désactiver le bouton de sauvegarde
    document.getElementById('saveSubstitutionBtn').disabled = true;
    
    // Afficher la modale
    document.getElementById('substitutionModal').style.display = 'block';
}

/**
 * Sélectionner l'équipe pour le changement
 */
function selectSubstitutionTeam(team) {
    substitutionTeam = team;
    
    // Feedback visuel
    if (team === 'myTeam') {
        document.getElementById('subMyTeamBtn').style.opacity = '1';
        document.getElementById('subOpponentBtn').style.opacity = '0.5';
        document.getElementById('myTeamSubSection').style.display = 'block';
        
        // Charger les joueurs
        loadSubstitutionPlayers();
    } else {
        // Adversaire : sauvegarder directement
        document.getElementById('subOpponentBtn').style.opacity = '1';
        document.getElementById('subMyTeamBtn').style.opacity = '0.5';
        document.getElementById('myTeamSubSection').style.display = 'none';
        
        // Activer le bouton de sauvegarde
        document.getElementById('saveSubstitutionBtn').disabled = false;
    }
}

/**
 * Charger les joueurs pour le changement
 */
function loadSubstitutionPlayers() {
    const players = footballApp.getState().players || [];
    
    // Joueurs sur le terrain
    const outContainer = document.getElementById('playerOutButtons');
    outContainer.innerHTML = '';
    
    const fieldPlayers = players.filter(p => p.status === 'field');
    fieldPlayers.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'player-btn';
        
        let icon = '🟢';
        if (player.position === 'gardienne') icon = '🧤';
        
        btn.innerHTML = `
            <div>${icon} ${player.name}</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">${player.position || ''}</div>
        `;
        
        btn.onclick = () => selectPlayerOut(player.id, btn);
        outContainer.appendChild(btn);
    });
    
    // Joueurs sur le banc
    const inContainer = document.getElementById('playerInButtons');
    inContainer.innerHTML = '';
    
    const benchPlayers = players.filter(p => p.status === 'bench');
    benchPlayers.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'player-btn';
        btn.innerHTML = `
            <div>🔵 ${player.name}</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">${player.position || ''}</div>
        `;
        
        btn.onclick = () => selectPlayerIn(player.id, btn);
        inContainer.appendChild(btn);
    });
}

/**
 * Sélectionner le joueur qui sort
 */
function selectPlayerOut(playerId, btnElement) {
    playerOutId = playerId;
    
    // Feedback visuel
    const buttons = document.querySelectorAll('#playerOutButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
    
    checkSubstitutionReadiness();
}

/**
 * Sélectionner le joueur qui entre
 */
function selectPlayerIn(playerId, btnElement) {
    playerInId = playerId;
    
    // Feedback visuel
    const buttons = document.querySelectorAll('#playerInButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
    
    checkSubstitutionReadiness();
}

/**
 * Vérifier si le changement peut être sauvegardé
 */
function checkSubstitutionReadiness() {
    const saveBtn = document.getElementById('saveSubstitutionBtn');
    
    if (substitutionTeam === 'opponent') {
        saveBtn.disabled = false;
    } else if (substitutionTeam === 'myTeam') {
        saveBtn.disabled = !(playerOutId && playerInId);
    } else {
        saveBtn.disabled = true;
    }
}

/**
 * Sauvegarder le changement
 */
function saveSubstitution() {
    if (substitutionTeam === 'opponent') {
        // Changement adverse : juste ajouter à la timeline
        const eventData = {
            type: 'substitution',
            time: getCurrentMatchTime(),
            half: footballApp.getState().half || 1,
            isTeam: false,
            playerName: 'Changement adverse'
        };
        
        footballApp.addEvent('substitution', eventData);
        
    } else if (substitutionTeam === 'myTeam' && playerOutId && playerInId) {
        // Changement de notre équipe
        const players = footballApp.getState().players;
        const playerOut = players.find(p => p.id === playerOutId);
        const playerIn = players.find(p => p.id === playerInId);
        
        if (!playerOut || !playerIn) return;
        
        // Gérer le cas du gardien
        const isGoalkeeperChange = playerOut.position === 'gardienne' || playerIn.position === 'gardienne';
        
        if (isGoalkeeperChange) {
            if (playerOut.position === 'gardienne') {
                // Le gardien sort : retirer la position
                footballApp.updatePlayer(playerOutId, { 
                    status: 'bench',
                    position: playerOut.originalPosition || playerOut.position
                });
                
                // Le joueur entrant devient gardien
                footballApp.updatePlayer(playerInId, { 
                    status: 'field',
                    originalPosition: playerIn.position,
                    position: 'gardienne'
                });
            } else {
                // Un joueur entre comme gardien
                footballApp.updatePlayer(playerInId, { 
                    status: 'field',
                    originalPosition: playerIn.position,
                    position: 'gardienne'
                });
                
                footballApp.updatePlayer(playerOutId, { 
                    status: 'bench'
                });
            }
        } else {
            // Changement normal
            footballApp.updatePlayer(playerOutId, { status: 'bench' });
            footballApp.updatePlayer(playerInId, { status: 'field' });
        }
        
        // Ajouter l'événement
        const eventData = {
            type: 'substitution',
            time: getCurrentMatchTime(),
            half: footballApp.getState().half || 1,
            isTeam: true,
            playerOutName: playerOut.name,
            playerInName: playerIn.name
        };
        
        footballApp.addEvent('substitution', eventData);
    }
    
    // Mettre à jour l'affichage
    updateMatchDisplay();
    
    if (typeof footballApp.updateLive === 'function') {
        footballApp.updateLive();
    }
    
    closeSubstitutionModal();
    showNotification('Changement enregistré !', 'success');
}

/**
 * Fermer la modale de changement
 */
function closeSubstitutionModal() {
    document.getElementById('substitutionModal').style.display = 'none';
    substitutionTeam = null;
    playerOutId = null;
    playerInId = null;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Obtenir le temps actuel du match
 */
function getCurrentMatchTime() {
    if (typeof footballApp.getCurrentTime === 'function') {
        return footballApp.getCurrentTime();
    }
    return '00:00';
}

/**
 * Afficher une notification
 */
function showNotification(message, type) {
    if (typeof footballApp.showNotification === 'function') {
        footballApp.showNotification(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

/**
 * Mettre à jour l'affichage du match
 */
function updateMatchDisplay() {
    if (typeof footballApp.updateDisplay === 'function') {
        footballApp.updateDisplay();
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Module match-actions.js chargé');
});