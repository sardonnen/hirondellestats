// js/lineup.js - Gestion de la composition d'équipe

// Mettre à jour l'affichage de la composition
function updateLineupDisplay() {
    const container = document.getElementById('lineupPlayersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (players.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Aucune joueuse ajoutée</p>';
        return;
    }
    
    players.forEach(player => {
        const button = document.createElement('button');
        button.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''} ${player.isStarting ? 'starting-eleven' : ''}`;
        button.innerHTML = `
            <div>${getPositionIcon(player.position)}</div>
            <div style="font-size: 12px; margin-top: 5px;">${player.name}</div>
            ${player.isStarting ? '<div style="font-size: 10px; color: #2ecc71;">✓ Titulaire</div>' : ''}
        `;
        button.onclick = () => toggleStartingPlayer(player.id, button);
        container.appendChild(button);
    });
    
    updateLineupSummary();
}

// Basculer le statut titulaire d'un joueur
function toggleStartingPlayer(playerId, buttonElement) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    if (player.isStarting) {
        // Retirer du 11 de départ
        player.isStarting = false;
        startingEleven = startingEleven.filter(id => id !== playerId);
        player.status = 'bench';
    } else {
        // Ajouter au 11 de départ (maximum 11)
        if (startingEleven.length >= 11) {
            showNotification('Vous ne pouvez sélectionner que 11 joueurs titulaires maximum', 'error');
            return;
        }
        player.isStarting = true;
        startingEleven.push(playerId);
        player.status = 'field';
    }
    
    updateLineupDisplay();
    updateFieldDisplay();
    saveData();
}

// Mettre à jour le résumé de la composition
function updateLineupSummary() {
    const summary = document.getElementById('lineupSummary');
    const display = document.getElementById('lineupDisplay');
    
    if (!summary || !display) return;
    
    if (startingEleven.length > 0) {
        summary.style.display = 'block';
        display.innerHTML = '';
        
        const positions = {
            gardienne: [],
            defenseure: [],
            milieu: [],
            attaquante: []
        };
        
        startingEleven.forEach(playerId => {
            const player = players.find(p => p.id === playerId);
            if (player) {
                positions[player.position].push(player);
            }
        });
        
        Object.entries(positions).forEach(([position, playerList]) => {
            if (playerList.length > 0) {
                const posDiv = document.createElement('div');
                posDiv.style.margin = '10px 0';
                posDiv.innerHTML = `
                    <strong>${getPositionIcon(position)} ${position.charAt(0).toUpperCase() + position.slice(1)}s (${playerList.length}):</strong><br>
                    ${playerList.map(p => p.name).join(', ')}
                `;
                display.appendChild(posDiv);
            }
        });
        
        const total = document.createElement('div');
        total.style.marginTop = '10px';
        total.innerHTML = `<strong>Total: ${startingEleven.length}/11 joueurs</strong>`;
        display.appendChild(total);
    } else {
        summary.style.display = 'none';
    }
}

// Sauvegarder la composition
function saveLineup() {
    if (startingEleven.length === 0) {
        showNotification('Veuillez sélectionner au moins un joueur', 'error');
        return;
    }
    
    showNotification(`Composition sauvegardée avec ${startingEleven.length} joueurs !`, 'success');
    saveData();
}

// Effacer la sélection
function clearLineup() {
    if (confirm('Effacer la sélection des titulaires ?')) {
        players.forEach(player => {
            player.isStarting = false;
            player.status = 'bench';
        });
        startingEleven = [];
        updateLineupDisplay();
        updateFieldDisplay();
        saveData();
        showNotification('Sélection effacée', 'info');
    }
}

// Mettre à jour l'affichage du terrain
function updateFieldDisplay() {
    const fieldContainer = document.getElementById('fieldPlayers');
    const benchContainer = document.getElementById('benchPlayers');
    
    if (!fieldContainer || !benchContainer) return;
    
    fieldContainer.innerHTML = '';
    benchContainer.innerHTML = '';
    
    players.forEach(player => {
        const div = document.createElement('div');
        div.innerHTML = `
            <div style="font-weight: bold;">${player.name}</div>
            <div style="font-size: 0.8rem;">${getPositionIcon(player.position)} ${player.position}</div>
        `;
        
        if (player.status === 'field' || player.isStarting) {
            div.className = 'field-player';
            div.onclick = () => movePlayerToBench(player.id);
            fieldContainer.appendChild(div);
        } else if (player.status === 'bench') {
            div.className = 'bench-player';
            div.onclick = () => movePlayerToField(player.id);
            benchContainer.appendChild(div);
        }
    });
    
    // Messages si vide
    if (fieldContainer.children.length === 0) {
        fieldContainer.innerHTML = '<p style="color: #bdc3c7; text-align: center;">Aucun joueur sur le terrain</p>';
    }
    
    if (benchContainer.children.length === 0) {
        benchContainer.innerHTML = '<p style="color: #bdc3c7; text-align: center;">Aucun joueur sur le banc</p>';
    }
}

// Déplacer un joueur sur le terrain
function movePlayerToField(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Vérifier qu'il n'y a pas plus de 11 joueurs sur le terrain
    const playersOnField = players.filter(p => p.status === 'field').length;
    if (playersOnField >= 11) {
        showNotification('Il ne peut y avoir que 11 joueurs maximum sur le terrain', 'error');
        return;
    }
    
    player.status = 'field';
    if (!player.isStarting) {
        addEvent('🔄', 'Entrée en jeu', player.name, 'team1');
    }
    
    updateFieldDisplay();
    saveData();
}

// Déplacer un joueur sur le banc
function movePlayerToBench(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    player.status = 'bench';
    if (player.isStarting) {
        addEvent('🔄', 'Sortie du terrain', player.name, 'team1');
    }
    
    updateFieldDisplay();
    saveData();
}

// Variables pour les substitutions
let selectedOutPlayer = null;
let selectedInPlayer = null;

// Afficher le modal de substitution
function showSubstitutionModal() {
    selectedOutPlayer = null;
    selectedInPlayer = null;
    
    createSubstitutionButtons();
    updateSubstitutionButton();
    
    document.getElementById('substitutionModal').style.display = 'block';
}

// Créer les boutons pour les substitutions
function createSubstitutionButtons() {
    const outContainer = document.getElementById('outPlayerButtons');
    const inContainer = document.getElementById('inPlayerButtons');
    
    if (!outContainer || !inContainer) return;
    
    outContainer.innerHTML = '';
    inContainer.innerHTML = '';
    
    // Joueurs sur le terrain (peuvent sortir)
    const playersOnField = players.filter(p => p.status === 'field');
    playersOnField.forEach(player => {
        const button = document.createElement('button');
        button.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''}`;
        button.textContent = player.name;
        button.onclick = () => selectOutPlayer(player.id, button);
        outContainer.appendChild(button);
    });
    
    // Joueurs sur le banc (peuvent entrer)
    const playersOnBench = players.filter(p => p.status === 'bench');
    playersOnBench.forEach(player => {
        const button = document.createElement('button');
        button.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''}`;
        button.textContent = player.name;
        button.onclick = () => selectInPlayer(player.id, button);
        inContainer.appendChild(button);
    });
    
    // Messages si vide
    if (playersOnField.length === 0) {
        outContainer.innerHTML = '<p style="color: #bdc3c7; text-align: center;">Aucun joueur sur le terrain</p>';
    }
    
    if (playersOnBench.length === 0) {
        inContainer.innerHTML = '<p style="color: #bdc3c7; text-align: center;">Aucun joueur sur le banc</p>';
    }
}

// Sélectionner le joueur qui sort
function selectOutPlayer(playerId, buttonElement) {
    selectedOutPlayer = playerId;
    
    // Mise à jour visuelle
    const buttons = document.querySelectorAll('#outPlayerButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    
    updateSubstitutionButton();
}

// Sélectionner le joueur qui entre
function selectInPlayer(playerId, buttonElement) {
    selectedInPlayer = playerId;
    
    // Mise à jour visuelle
    const buttons = document.querySelectorAll('#inPlayerButtons .player-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttonElement.classList.add('selected');
    
    updateSubstitutionButton();
}

// Mettre à jour le bouton de substitution
function updateSubstitutionButton() {
    const saveBtn = document.getElementById('saveSubstitutionBtn');
    if (saveBtn) {
        saveBtn.disabled = !(selectedOutPlayer && selectedInPlayer);
    }
}

// Effectuer la substitution
function saveSubstitution() {
    if (!selectedOutPlayer || !selectedInPlayer) {
        showNotification('Sélectionnez les deux joueurs pour la substitution', 'error');
        return;
    }
    
    const outPlayer = players.find(p => p.id === selectedOutPlayer);
    const inPlayer = players.find(p => p.id === selectedInPlayer);
    
    if (!outPlayer || !inPlayer) return;
    
    // Effectuer l'échange
    outPlayer.status = 'bench';
    inPlayer.status = 'field';
    
    // Ajouter l'événement
    addEvent('🔄', `Changement: ${inPlayer.name} remplace ${outPlayer.name}`, 'Entraîneur', 'team1');
    
    // Fermer le modal et mettre à jour
    closeModal('substitutionModal');
    updateFieldDisplay();
    saveData();
    
    showNotification(`${inPlayer.name} remplace ${outPlayer.name}`, 'success');
}