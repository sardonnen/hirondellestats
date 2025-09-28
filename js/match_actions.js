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
        const availablePlayers = players.filter(player => {
            // Pour buts et tirs, seulement les joueurs sur le terrain
            if (currentActionType === 'goal' || currentActionType === 'shot') {
                return player.status === 'field';
            }
            // Pour cartons et fautes, tous les joueurs actifs
            return player.status === 'field' || player.status === 'bench';
        });
        
        if (availablePlayers.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Aucun joueur disponible</p>';
            return;
        }
        
        availablePlayers.forEach(player => {
            const button = document.createElement('button');
            button.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''}`;
            button.textContent = player.name;
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
        case 'shot':
            handleShot(teamKey);
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

function handleShot(teamKey) {
    stats[teamKey].shots++;
    
    let playerName, description;
    
    if (selectedPlayerId === 'opponent') {
        playerName = currentMatch.team2 || 'Équipe Adverse';
        description = 'Tir tenté';
    } else {
        const player = players.find(p => p.id === selectedPlayerId);
        playerName = player ? player.name : 'Joueur inconnu';
        description = 'Tir tenté';
        
        // Mise à jour des stats joueur
        if (playerStats[selectedPlayerId]) {
            playerStats[selectedPlayerId].shots++;
        }
    }
    
    addEvent('🎯', description, playerName, teamKey);
    showNotification(`Tir enregistré pour ${playerName}`, 'info');
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