// js/match-actions.js - Gestion des actions du match

// Afficher le modal de choix d'équipe
function showActionChoiceModal(actionType) {
    currentActionType = actionType;
    
    const titles = {
        'goal': 'Qui a marqué le but ?',
        'shot': 'Qui a tenté le tir ?',
        'card': 'Qui reçoit le carton ?',
        'foul': 'Qui a commis la faute ?'
    };
    
    document.getElementById('actionChoiceTitle').textContent = titles[actionType] || 'Choisir l\'équipe';
    
    // Mettre à jour le texte du bouton équipe
    const teamChoiceText = document.getElementById('teamChoiceText');
    if (teamChoiceText) {
        teamChoiceText.textContent = currentMatch.team1 || 'Mon Équipe';
    }
    
    // Reset des sélections précédentes
    resetChoiceButtons();
    
    document.getElementById('actionChoiceModal').style.display = 'block';
}

function resetChoiceButtons() {
    const buttons = document.querySelectorAll('.choice-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
}

function selectTeamForAction(team) {
    currentActionTeam = team;
    
    // Mise à jour visuelle
    resetChoiceButtons();
    const selectedBtn = document.querySelector(`.${team}-choice, .${team === 'team' ? 'team' : 'opponent'}-choice`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    // Attendre un peu pour l'effet visuel puis ouvrir le modal d'action
    setTimeout(() => {
        closeModal('actionChoiceModal');
        showActionModal();
    }, 500);
}

function showActionModal() {
    const titles = {
        'goal': currentActionTeam === 'team' ? 'But marqué' : 'But encaissé',
        'shot': currentActionTeam === 'team' ? 'Tir tenté' : 'Tir adverse',
        'card': currentActionTeam === 'team' ? 'Carton reçu' : 'Carton adverse',
        'foul': currentActionTeam === 'team' ? 'Faute commise' : 'Faute adverse'
    };
    
    document.getElementById('actionModalTitle').textContent = titles[currentActionType] || 'Action';
    
    // Gestion spéciale pour les cartons
    const cardButtons = document.getElementById('cardButtons');
    if (currentActionType === 'card') {
        cardButtons.style.display = 'flex';
        resetCardSelection();
    } else {
        cardButtons.style.display = 'none';
        selectedCardType = null;
    }
    
    // Créer les boutons joueurs
    createPlayerButtons();
    
    // Reset sélections
    selectedPlayerId = null;
    updateSaveButton();
    
    document.getElementById('actionModal').style.display = 'block';
}

function createPlayerButtons() {
    const container = document.getElementById('actionPlayerButtons');
    container.innerHTML = '';
    
    if (currentActionTeam === 'opponent') {
        // Bouton équipe adverse
        const button = document.createElement('button');
        button.className = 'player-btn';
        button.textContent = currentMatch.team2 || 'Équipe Adverse';
        button.onclick = () => selectPlayer('opponent', button);
        container.appendChild(button);
    } else {
        // Boutons joueurs de notre équipe
        let availablePlayers = [];
        
        // Filtrage selon le type d'action
        if (currentActionType === 'goal' || currentActionType === 'shot_on' || currentActionType === 'shot_off') {
            // Seulement les joueurs sur le terrain
            availablePlayers = players.filter(player => player.status === 'field');
        } else {
            // Tous les joueurs actifs (terrain + banc)
            availablePlayers = players.filter(player => 
                player.status === 'field' || player.status === 'bench'
            );
        }
        
        if (availablePlayers.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Aucun joueur disponible</p>';
            return;
        }
        
        availablePlayers.forEach(player => {
            const button = document.createElement('button');
            button.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''}`;
            
            // Indiquer le statut du joueur
            let statusIcon = '';
            if (player.status === 'field') statusIcon = '🟢';
            else if (player.status === 'bench') statusIcon = '🔵';
            
            button.innerHTML = `
                <div>${statusIcon} ${player.name}</div>
                <div style="font-size: 0.8rem; opacity: 0.8;">${getPositionIcon(player.position)} ${player.position}</div>
            `;
            
            button.onclick = () => selectPlayer(player.id, button);
            container.appendChild(button);
        });
    }
}

function selectPlayer(playerId, buttonElement) {
    selectedPlayerId = playerId;
    
    // Mise à jour visuelle
    const buttons = document.querySelectorAll('#actionPlayerButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    
    updateSaveButton();
}

function selectCardType(cardType) {
    selectedCardType = cardType;
    
    // Mise à jour visuelle
    const buttons = document.querySelectorAll('.card-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    updateSaveButton();
}

function resetCardSelection() {
    selectedCardType = null;
    const buttons = document.querySelectorAll('.card-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
}

function updateSaveButton() {
    const saveBtn = document.getElementById('saveActionBtn');
    if (!saveBtn) return;
    
    let canSave = selectedPlayerId !== null;
    
    // Pour les cartons, il faut aussi sélectionner le type
    if (currentActionType === 'card') {
        canSave = canSave && selectedCardType !== null;
    }
    
    saveBtn.disabled = !canSave;
}

function saveAction() {
    if (!selectedPlayerId) {
        showNotification('Sélectionnez un joueur', 'error');
        return;
    }
    
    if (currentActionType === 'card' && !selectedCardType) {
        showNotification('Sélectionnez un type de carton', 'error');
        return;
    }
    
    // Déterminer l'équipe pour les stats
    const teamKey = currentActionTeam === 'team' ? 'team1' : 'team2';
    
    // Traitement selon le type d'action
    switch (currentActionType) {
        case 'goal':
            handleGoal(teamKey);
            break;
        case 'shot_on':
        case 'shot_off':
            handleShot(teamKey, currentActionType);
            break;
        case 'card':
            handleCard(teamKey);
            break;
        case 'foul':
            handleFoul(teamKey);
            break;
    }
    
    // Fermer le modal et reset
    closeModal('actionModal');
    updateDisplay();
    updateStatsDisplay();
}

function handleGoal(teamKey) {
    stats[teamKey].goals++;
    
    let playerName, description;
    
    if (selectedPlayerId === 'opponent') {
        playerName = currentMatch.team2 || 'Équipe Adverse';
        description = 'But marqué';
    } else {
        const player = players.find(p => p.id === selectedPlayerId);
        playerName = player ? player.name : 'Joueur inconnu';
        description = 'But marqué';
        
        // Mise à jour des stats joueur
        if (playerStats[selectedPlayerId]) {
            playerStats[selectedPlayerId].goals++;
        }
    }
    
    addEvent('⚽', description, playerName, teamKey);
    showNotification(`But marqué par ${playerName} !`, 'success');
}

function handleShot(teamKey, actionType) {
    const shotOnTarget = actionType === 'shot_on';
    
    stats[teamKey].shots++;
    if (shotOnTarget) {
        stats[teamKey].shotsOn++;
    } else {
        stats[teamKey].shotsOff++;
    }
    
    let playerName, description;
    
    if (selectedPlayerId === 'opponent') {
        playerName = currentMatch.team2 || 'Équipe Adverse';
        description = shotOnTarget ? 'Tir cadré' : 'Tir non cadré';
    } else {
        const player = players.find(p => p.id === selectedPlayerId);
        playerName = player ? player.name : 'Joueur inconnu';
        description = shotOnTarget ? 'Tir cadré' : 'Tir non cadré';
        
        // Mise à jour des stats joueur
        if (playerStats[selectedPlayerId]) {
            playerStats[selectedPlayerId].shots++;
        }
    }
    
    const icon = shotOnTarget ? '🎯' : '📐';
    addEvent(icon, description, playerName, teamKey);
    showNotification(`${description} enregistré pour ${playerName}`, 'info');
}

function handleCard(teamKey) {
    const cardIcons = {
        'yellow': '🟨',
        'red': '🟥',
        'white': '⬜'
    };
    
    const cardNames = {
        'yellow': 'jaune',
        'red': 'rouge',
        'white': 'blanc'
    };
    
    // Mise à jour des stats équipe
    if (selectedCardType === 'yellow') {
        stats[teamKey].yellowCards++;
    } else if (selectedCardType === 'red') {
        stats[teamKey].redCards++;
    } else if (selectedCardType === 'white') {
        stats[teamKey].whiteCards++;
    }
    
    let playerName, description;
    
    if (selectedPlayerId === 'opponent') {
        playerName = currentMatch.team2 || 'Équipe Adverse';
        description = `Carton ${cardNames[selectedCardType]}`;
    } else {
        const player = players.find(p => p.id === selectedPlayerId);
        playerName = player ? player.name : 'Joueur inconnu';
        description = `Carton ${cardNames[selectedCardType]}`;
        
        // Mise à jour des stats joueur
        if (playerStats[selectedPlayerId]) {
            playerStats[selectedPlayerId].cards.push(selectedCardType);
        }
        
        // Si carton rouge, le joueur est expulsé
        if (selectedCardType === 'red') {
            player.status = 'out';
            addEvent('🚪', 'Expulsion', playerName, teamKey);
        }
    }
    
    addEvent(cardIcons[selectedCardType], description, playerName, teamKey);
    showNotification(`Carton ${cardNames[selectedCardType]} pour ${playerName}`, 'warning');
}

function handleFoul(teamKey) {
    stats[teamKey].fouls++;
    
    let playerName, description;
    
    if (selectedPlayerId === 'opponent') {
        playerName = currentMatch.team2 || 'Équipe Adverse';
        description = 'Faute commise';
    } else {
        const player = players.find(p => p.id === selectedPlayerId);
        playerName = player ? player.name : 'Joueur inconnu';
        description = 'Faute commise';
        
        // Mise à jour des stats joueur
        if (playerStats[selectedPlayerId]) {
            playerStats[selectedPlayerId].fouls++;
        }
    }
    
    addEvent('⚠️', description, playerName, teamKey);
    showNotification(`Faute enregistrée pour ${playerName}`, 'info');
}

// Variables pour les arrêts de gardienne
let selectedSavePlayerId = null;

// Afficher le modal d'arrêt gardienne
function showSaveModal() {
    selectedSavePlayerId = null;
    
    createGoalkeeperButtons();
    updateSaveButton();
    
    document.getElementById('saveModal').style.display = 'block';
}

// Créer les boutons pour les gardiennes
function createGoalkeeperButtons() {
    const container = document.getElementById('savePlayerButtons');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filtrer seulement les gardiennes sur le terrain
    const goalkeepers = players.filter(p => p.position === 'gardienne' && p.status === 'field');
    
    if (goalkeepers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Aucune gardienne sur le terrain</p>';
        return;
    }
    
    goalkeepers.forEach(player => {
        const button = document.createElement('button');
        button.className = 'player-btn goalkeeper';
        button.textContent = player.name;
        button.onclick = () => selectGoalkeeper(player.id, button);
        container.appendChild(button);
    });
}

// Sélectionner la gardienne
function selectGoalkeeper(playerId, buttonElement) {
    selectedSavePlayerId = playerId;
    
    // Mise à jour visuelle
    const buttons = document.querySelectorAll('#savePlayerButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    
    updateSaveButton();
}

// Mettre à jour le bouton d'arrêt
function updateSaveButton() {
    const saveBtn = document.getElementById('saveSaveBtn');
    if (saveBtn) {
        saveBtn.disabled = !selectedSavePlayerId;
    }
}

// Enregistrer l'arrêt de gardienne
function saveGoalkeeperSave() {
    if (!selectedSavePlayerId) {
        showNotification('Sélectionnez une gardienne', 'error');
        return;
    }
    
    const player = players.find(p => p.id === selectedSavePlayerId);
    const saveType = document.getElementById('saveType').value;
    
    // Mise à jour des stats
    stats.team1.saves++;
    if (playerStats[selectedSavePlayerId]) {
        playerStats[selectedSavePlayerId].saves++;
    }
    
    const description = saveType === 'line' ? 'Arrêt sur sa ligne' : 'Arrêt en sortie';
    addEvent('🧤', description, player.name, 'team1');
    
    closeModal('saveModal');
    updateDisplay();
    updateStatsDisplay();
    
    showNotification(`Arrêt enregistré pour ${player.name}`, 'success');
}

// Variables pour les coups francs
let selectedFreeKickPlayerId = null;

// Afficher le modal coup franc
function showFreeKickModal() {
    selectedFreeKickPlayerId = null;
    
    createFreeKickButtons();
    updateFreeKickButton();
    
    document.getElementById('freeKickModal').style.display = 'block';
}

// Créer les boutons pour les coups francs
function createFreeKickButtons() {
    const container = document.getElementById('freeKickPlayerButtons');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Joueurs sur le terrain
    const availablePlayers = players.filter(p => p.status === 'field');
    
    if (availablePlayers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Aucun joueur sur le terrain</p>';
        return;
    }
    
    availablePlayers.forEach(player => {
        const button = document.createElement('button');
        button.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''}`;
        button.textContent = player.name;
        button.onclick = () => selectFreeKickPlayer(player.id, button);
        container.appendChild(button);
    });
}

// Sélectionner le joueur pour le coup franc
function selectFreeKickPlayer(playerId, buttonElement) {
    selectedFreeKickPlayerId = playerId;
    
    // Mise à jour visuelle
    const buttons = document.querySelectorAll('#freeKickPlayerButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    
    updateFreeKickButton();
}

// Mettre à jour le bouton coup franc
function updateFreeKickButton() {
    const saveBtn = document.getElementById('saveFreeKickBtn');
    if (saveBtn) {
        saveBtn.disabled = !selectedFreeKickPlayerId;
    }
}

// Enregistrer le coup franc
function saveFreeKick() {
    if (!selectedFreeKickPlayerId) {
        showNotification('Sélectionnez un joueur', 'error');
        return;
    }
    
    const player = players.find(p => p.id === selectedFreeKickPlayerId);
    
    // Mise à jour des stats
    stats.team1.freeKicks++;
    if (playerStats[selectedFreeKickPlayerId]) {
        playerStats[selectedFreeKickPlayerId].freeKicks++;
    }
    
    addEvent('⚽', 'Coup de pied arrêté', player.name, 'team1');
    
    closeModal('freeKickModal');
    updateDisplay();
    updateStatsDisplay();
    
    showNotification(`Coup franc enregistré pour ${player.name}`, 'success');
}

// Fonctions utilitaires pour les changements de joueurs
function togglePlayerStatus(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Cycle: bench -> field -> bench
    if (player.status === 'bench') {
        player.status = 'field';
        addEvent('🔄', 'Entrée en jeu', player.name, 'team1');
        showNotification(`${player.name} entre en jeu`, 'info');
    } else if (player.status === 'field') {
        player.status = 'bench';
        addEvent('🔄', 'Sortie du terrain', player.name, 'team1');
        showNotification(`${player.name} sort du terrain`, 'info');
    }
    
    saveData();
}

// Gestion des événements clavier pour fermer les modales
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Fermer tous les modales ouverts
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
        
        // Reset des sélections
        selectedPlayerId = null;
        selectedCardType = null;
        currentActionType = null;
        currentActionTeam = null;
    }
});