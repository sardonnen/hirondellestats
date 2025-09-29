// match_actions.js - Gestion des actions de match (VERSION CORRIGÉE)

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
        options: null
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
    
    console.log('📱 Ouverture modal:', actionType);
    
    document.getElementById('unifiedActionTitle').textContent = config.title;
    
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
    
    loadTeamPlayers();
    
    const opponentBtn = document.getElementById('opponentBtn');
    if (opponentBtn) {
        opponentBtn.classList.remove('selected');
    }
    
    document.getElementById('saveUnifiedActionBtn').disabled = true;
    document.getElementById('unifiedActionModal').style.display = 'block';
}

/**
 * Sélectionner une option (avec toggle)
 */
function selectActionOption(option, btnElement) {
    // Si déjà sélectionné, désélectionner
    if (selectedOption === option) {
        selectedOption = null;
        btnElement.classList.remove('selected');
    } else {
        // Sinon, sélectionner
        selectedOption = option;
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        btnElement.classList.add('selected');
    }
    
    checkUnifiedActionReadiness();
}

/**
 * Charger les joueurs de l'équipe
 */
function loadTeamPlayers() {
    const container = document.getElementById('teamPlayerButtons');
    if (!container) return;
    
    container.innerHTML = '';
    
    const players = footballApp.getState().players || [];
    
    let availablePlayers = [];
    
    if (currentActionType === 'save') {
        availablePlayers = players.filter(p => 
            p.position === 'gardienne' && p.status === 'field'
        );
    } else {
        availablePlayers = players.filter(p => p.status === 'field');
    }
    
    console.log(`👥 ${availablePlayers.length} joueurs disponibles pour l'action`);
    
    if (availablePlayers.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 10px;">Aucune joueuse sur le terrain</p>';
        return;
    }
    
    availablePlayers.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'player-btn';
        
        let statusIcon = '🟢';
        if (player.position === 'gardienne') {
            statusIcon = '🧤';
        }
        
        btn.innerHTML = `
            <div>${statusIcon} ${player.name}</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">${player.position || ''}</div>
        `;
        
        // CORRECTION : Utiliser window.selectPlayerUnified
        btn.onclick = () => window.selectPlayerUnified(player.id, btn);
        container.appendChild(btn);
    });
}

/**
 * Sélectionner un joueur (avec toggle)
 */
function selectPlayer(playerId, btnElement) {
    console.log('🔵 selectPlayer appelée:', playerId);
    
    // Si déjà sélectionné, désélectionner
    if (selectedPlayerId === playerId) {
        selectedPlayerId = null;
        isOpponentAction = false;
        btnElement.classList.remove('selected');
        console.log('❌ Joueur désélectionné');
    } else {
        // Sinon, sélectionner
        selectedPlayerId = playerId;
        isOpponentAction = false;
        
        const buttons = document.querySelectorAll('#teamPlayerButtons .player-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        btnElement.classList.add('selected');
        
        const opponentBtn = document.getElementById('opponentBtn');
        if (opponentBtn) {
            opponentBtn.classList.remove('selected');
        }
        
        console.log('✅ Joueur sélectionné:', playerId);
    }
    
    checkUnifiedActionReadiness();
}

/**
 * Sélectionner adversaire (avec toggle)
 */
function selectOpponent() {
    const opponentBtn = document.getElementById('opponentBtn');
    
    console.log('🔴 selectOpponent appelée');
    
    // Si déjà sélectionné, désélectionner
    if (isOpponentAction) {
        isOpponentAction = false;
        selectedPlayerId = null;
        if (opponentBtn) {
            opponentBtn.classList.remove('selected');
        }
        console.log('❌ Adversaire désélectionné');
    } else {
        // Sinon, sélectionner
        isOpponentAction = true;
        selectedPlayerId = null;
        
        if (opponentBtn) {
            opponentBtn.classList.add('selected');
        }
        
        const buttons = document.querySelectorAll('#teamPlayerButtons .player-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        console.log('✅ Adversaire sélectionné');
    }
    
    checkUnifiedActionReadiness();
}

/**
 * Vérifier si l'action peut être sauvegardée
 */
function checkUnifiedActionReadiness() {
    const saveBtn = document.getElementById('saveUnifiedActionBtn');
    if (!saveBtn) return;
    
    const config = ACTION_CONFIG[currentActionType];
    
    let canSave = false;
    const hasSelection = selectedPlayerId !== null || isOpponentAction;
    
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
    
    console.log('💾 Sauvegarde action:', currentActionType);
    console.log('📍 Joueur sélectionné:', selectedPlayerId);
    console.log('🔴 Adversaire:', isOpponentAction);
    console.log('⚙️ Option:', selectedOption);
    
    const eventData = {
        type: currentActionType,
        time: getCurrentMatchTime(),
        half: footballApp.getState().half || 1,
        isTeam: !isOpponentAction
    };
    
    if (selectedOption) {
        eventData.option = selectedOption;
    }
    
    if (selectedPlayerId) {
        const player = footballApp.getState().players.find(p => p.id === selectedPlayerId);
        eventData.playerId = selectedPlayerId;
        eventData.playerName = player ? player.name : 'Inconnue';
    } else {
        eventData.playerName = 'Adversaire';
    }
    
    handleSpecialCases(eventData);
    
    console.log('📝 Ajout événement:', eventData);
    footballApp.addEvent(currentActionType, eventData);
    
    // Mettre à jour la timeline
    console.log('🔄 Mise à jour timeline...');
    updateTimelineDisplay();
    
    // Mettre à jour le live
    if (typeof footballApp.updateLive === 'function') {
        footballApp.updateLive();
    }
    
    // Sauvegarder l'état
    footballApp.saveState();
    
    // Appeler autoSave de match.html si disponible
    if (typeof autoSave === 'function') {
        autoSave();
    }
    
    closeUnifiedActionModal();
    showNotification('Action enregistrée !', 'success');
    
    console.log('✅ Action sauvegardée avec succès');
}

/**
 * Gérer les cas spéciaux
 */
function handleSpecialCases(eventData) {
    const state = footballApp.getState();
    
    // Carton rouge : retirer du terrain
    if (currentActionType === 'card' && selectedOption === 'Rouge' && selectedPlayerId) {
        const players = state.players;
        const playerIndex = players.findIndex(p => p.id === selectedPlayerId);
        if (playerIndex !== -1) {
            players[playerIndex].status = 'out';
            footballApp.saveState();
        }
    }
    
    // Carton blanc : démarrer timer 10min
    if (currentActionType === 'card' && selectedOption === 'Blanc' && selectedPlayerId) {
        startWhiteCardTimer(selectedPlayerId);
    }
    
    // But : mettre à jour le score
    if (currentActionType === 'goal') {
        if (isOpponentAction) {
            state.score.opponent++;
        } else {
            state.score.team++;
        }
        footballApp.saveState();
        
        // Mettre à jour l'affichage du score
        const teamScoreEl = document.getElementById('teamScore');
        const opponentScoreEl = document.getElementById('opponentScore');
        if (teamScoreEl) teamScoreEl.textContent = state.score.team;
        if (opponentScoreEl) opponentScoreEl.textContent = state.score.opponent;
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
        duration: 10 * 60 * 1000,
        remaining: 10 * 60 * 1000
    };
    
    whiteCardTimers.push(timer);
    displayWhiteCardTimers();
    
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
    
    if (!zone || !list) return;
    
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
    const modal = document.getElementById('unifiedActionModal');
    if (modal) {
        modal.style.display = 'none';
    }
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
    
    document.getElementById('subMyTeamBtn').style.opacity = '1';
    document.getElementById('subOpponentBtn').style.opacity = '1';
    document.getElementById('myTeamSubSection').style.display = 'none';
    document.getElementById('saveSubstitutionBtn').disabled = true;
    document.getElementById('substitutionModal').style.display = 'block';
}

/**
 * Sélectionner l'équipe pour le changement
 */
function selectSubstitutionTeam(team) {
    substitutionTeam = team;
    
    if (team === 'myTeam') {
        document.getElementById('subMyTeamBtn').style.opacity = '1';
        document.getElementById('subOpponentBtn').style.opacity = '0.5';
        document.getElementById('myTeamSubSection').style.display = 'block';
        loadSubstitutionPlayers();
    } else {
        document.getElementById('subOpponentBtn').style.opacity = '1';
        document.getElementById('subMyTeamBtn').style.opacity = '0.5';
        document.getElementById('myTeamSubSection').style.display = 'none';
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
    if (outContainer) {
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
    }
    
    // Joueurs sur le banc
    const inContainer = document.getElementById('playerInButtons');
    if (inContainer) {
        inContainer.innerHTML = '';
        
        const benchPlayers = players.filter(p => p.status === 'bench');
        
        if (benchPlayers.length === 0) {
            inContainer.innerHTML = '<p style="text-align: center; padding: 10px;">Aucune joueuse sur le banc</p>';
        } else {
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
    }
}

/**
 * Sélectionner le joueur qui sort
 */
function selectPlayerOut(playerId, btnElement) {
    playerOutId = playerId;
    
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
        const eventData = {
            type: 'substitution',
            time: getCurrentMatchTime(),
            half: footballApp.getState().half || 1,
            isTeam: false,
            playerName: 'Changement adverse'
        };
        
        footballApp.addEvent('substitution', eventData);
        
    } else if (substitutionTeam === 'myTeam' && playerOutId && playerInId) {
        const state = footballApp.getState();
        const players = state.players;
        const playerOut = players.find(p => p.id === playerOutId);
        const playerIn = players.find(p => p.id === playerInId);
        
        if (!playerOut || !playerIn) return;
        
        const isGoalkeeperChange = playerOut.position === 'gardienne' || playerIn.position === 'gardienne';
        
        if (isGoalkeeperChange) {
            if (playerOut.position === 'gardienne') {
                const playerOutIndex = players.findIndex(p => p.id === playerOutId);
                const playerInIndex = players.findIndex(p => p.id === playerInId);
                
                players[playerOutIndex].status = 'bench';
                players[playerOutIndex].position = players[playerOutIndex].originalPosition || players[playerOutIndex].position;
                
                players[playerInIndex].status = 'field';
                players[playerInIndex].originalPosition = players[playerInIndex].position;
                players[playerInIndex].position = 'gardienne';
            } else {
                const playerInIndex = players.findIndex(p => p.id === playerInId);
                const playerOutIndex = players.findIndex(p => p.id === playerOutId);
                
                players[playerInIndex].status = 'field';
                players[playerInIndex].originalPosition = players[playerInIndex].position;
                players[playerInIndex].position = 'gardienne';
                
                players[playerOutIndex].status = 'bench';
            }
        } else {
            const playerOutIndex = players.findIndex(p => p.id === playerOutId);
            const playerInIndex = players.findIndex(p => p.id === playerInId);
            
            players[playerOutIndex].status = 'bench';
            players[playerInIndex].status = 'field';
        }
        
        footballApp.saveState();
        
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
    
    // Mettre à jour la timeline
    updateTimelineDisplay();
    
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
// TIMELINE
// ============================================

/**
 * Mettre à jour l'affichage de la timeline
 */
function updateTimelineDisplay() {
    console.log('🔄 updateTimelineDisplay appelée');
    
    // Synchroniser matchEvents local avec footballApp
    if (typeof footballApp !== 'undefined') {
        const state = footballApp.getState();
        if (state.events) {
            if (typeof matchEvents !== 'undefined') {
                window.matchEvents = state.events;
            }
            console.log(`📝 ${state.events.length} événements trouvés`);
        }
    }
    
    const container = document.getElementById('eventsTimeline');
    if (!container) {
        console.error('❌ Container eventsTimeline non trouvé');
        return;
    }
    
    const state = footballApp.getState();
    const events = state.events || [];
    
    console.log(`📊 Affichage de ${events.length} événements`);
    
    if (events.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #bbb;">Aucun événement enregistré</div>';
        return;
    }
    
    container.innerHTML = '';
    
    // Créer la structure 3 colonnes
    const timelineGrid = document.createElement('div');
    timelineGrid.style.cssText = 'display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: start;';
    
    events.slice().reverse().forEach((event, index) => {
        console.log(`➕ Ajout événement ${index}:`, event.type, event.playerName);
        
        const row = document.createElement('div');
        row.style.cssText = 'display: contents;';
        
        // Colonne gauche (mon équipe)
        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'text-align: right; padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 8px;';
        
        // Colonne centre (timer)
        const centerCol = document.createElement('div');
        centerCol.style.cssText = 'text-align: center; padding: 10px; font-weight: bold; color: #ffd700;';
        centerCol.textContent = event.time;
        
        // Colonne droite (adversaire)
        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'text-align: left; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 8px;';
        
        // Placer l'événement dans la bonne colonne
        if (event.isTeam) {
            leftCol.innerHTML = getEventHTML(event);
            rightCol.innerHTML = '&nbsp;';
        } else {
            leftCol.innerHTML = '&nbsp;';
            rightCol.innerHTML = getEventHTML(event);
        }
        
        row.appendChild(leftCol);
        row.appendChild(centerCol);
        row.appendChild(rightCol);
        
        timelineGrid.appendChild(leftCol);
        timelineGrid.appendChild(centerCol);
        timelineGrid.appendChild(rightCol);
    });
    
    container.appendChild(timelineGrid);
    console.log('✅ Timeline mise à jour avec succès');
}

/**
 * Obtenir le HTML d'un événement
 */
function getEventHTML(event) {
    let icon = '';
    let text = '';
    
    switch (event.type) {
        case 'goal':
            icon = '⚽';
            text = `But${event.option ? ' (' + event.option + ')' : ''}`;
            break;
        case 'assist':
            icon = '➡️';
            text = `Passe décisive`;
            break;
        case 'shot':
            icon = '🎯';
            text = `Tir${event.option ? ' ' + event.option.toLowerCase() : ''}`;
            break;
        case 'save':
            icon = '🧤';
            text = `Arrêt${event.option ? ' ' + event.option.toLowerCase() : ''}`;
            break;
        case 'foul':
            icon = '⚠️';
            text = `Faute${event.option ? ' (' + event.option + ')' : ''}`;
            break;
        case 'card':
            icon = event.option === 'Jaune' ? '🟨' : event.option === 'Rouge' ? '🟥' : '⬜';
            text = `Carton ${event.option}`;
            break;
        case 'corner':
            icon = '🚩';
            text = `Corner`;
            break;
        case 'offside':
            icon = '🛑';
            text = `Hors-jeu`;
            break;
        case 'substitution':
            icon = '🔄';
            if (event.playerOutName && event.playerInName) {
                text = `Changement : ${event.playerInName} ➡️ ${event.playerOutName}`;
            } else {
                text = 'Changement';
            }
            break;
        default:
            icon = '📝';
            text = 'Événement';
    }
    
    // Ajouter le nom du joueur (sauf pour substitution qui a déjà les noms)
    if (event.type !== 'substitution' && event.playerName) {
        text += ` - ${event.playerName}`;
    }
    
    return `<span style="font-size: 1.2em;">${icon}</span> ${text}`;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Obtenir le temps actuel du match
 */
function getCurrentMatchTime() {
    const state = footballApp.getState();
    const time = state.time || 0;
    const minutes = Math.floor(time);
    const seconds = Math.floor((time % 1) * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

// ============================================
// EXPOSITION GLOBALE DES FONCTIONS
// ============================================

// Exposer les fonctions pour les appels onclick dans le HTML
window.selectPlayerUnified = selectPlayer;
window.selectOpponent = selectOpponent;
window.showUnifiedActionModal = showUnifiedActionModal;
window.closeUnifiedActionModal = closeUnifiedActionModal;
window.saveUnifiedAction = saveUnifiedAction;
window.showSubstitutionModal = showSubstitutionModal;
window.selectSubstitutionTeam = selectSubstitutionTeam;
window.closeSubstitutionModal = closeSubstitutionModal;
window.saveSubstitution = saveSubstitution;
window.updateTimelineDisplay = updateTimelineDisplay;

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Module match-actions.js chargé');
    console.log('📋 Fonctions exposées globalement:');
    console.log('  - window.selectPlayerUnified');
    console.log('  - window.selectOpponent');
    console.log('  - window.showUnifiedActionModal');
    console.log('  - window.updateTimelineDisplay');
});