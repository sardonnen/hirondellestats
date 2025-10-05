// composition.js - Logique de gestion de la composition

// ===== VARIABLES GLOBALES =====
let selectedPlayers = [];
let selectedSubstitutes = [];
let positioningMode = false;
let positioningValidated = false;
let playerPositions = {};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    migratePlayerPositions();
    loadCurrentComposition();
    loadPlayerPositions();
    updatePlayersSelectionDisplay();
    updateSubstituteSelectionDisplay(); // TOUJOURS afficher
    updateCompositionStats();
    updateFormationDisplay();
});

// ===== MIGRATION ET CHARGEMENT =====

/**
 * Migration des positions "défenseuse" vers "défenseure"
 */
function migratePlayerPositions() {
    const players = footballApp.getState().players;
    let hasChanges = false;
    
    players.forEach(player => {
        if (player.position === 'défenseuse') {
            player.position = 'défenseure';
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        footballApp.saveState();
        console.log('Migration des positions effectuée : défenseuse → défenseure');
    }
}

/**
 * Chargement de la composition actuelle
 */
function loadCurrentComposition() {
    const players = footballApp.getState().players;
    selectedPlayers = players.filter(p => p.status === 'field').map(p => p.id);
    selectedSubstitutes = players.filter(p => p.status === 'bench').map(p => p.id);
    
    players.forEach(player => {
        if (player.status !== 'field' && player.status !== 'bench' && player.status !== 'sanctioned' && player.status !== 'out') {
            footballApp.updatePlayerStatus(player.id, 'available');
        }
    });
}

/**
 * Chargement des positions des joueurs
 */
function loadPlayerPositions() {
    const saved = localStorage.getItem('footballStats_playerPositions');
    if (saved) {
        try {
            playerPositions = JSON.parse(saved);
        } catch (e) {
            playerPositions = {};
        }
    }
}

/**
 * Sauvegarde des positions des joueurs
 */
function savePlayerPositions() {
    localStorage.setItem('footballStats_playerPositions', JSON.stringify(playerPositions));
}

// ===== MODE POSITIONNEMENT =====

/**
 * Basculer le mode positionnement manuel
 */
function togglePositioningMode() {
    positioningMode = !positioningMode;
    const btn = document.getElementById('togglePositioningBtn');
    const validateBtn = document.getElementById('validatePositioningBtn');
    const text = document.getElementById('positioningModeText');
    
    if (positioningMode) {
        btn.className = 'btn btn-success';
        btn.innerHTML = '✅ Mode Positionnement Actif';
        validateBtn.style.display = 'inline-block';
        text.style.display = 'block';
        positioningValidated = false;
    } else {
        btn.className = 'btn';
        btn.innerHTML = '🎯 Mode Positionnement Manuel';
        validateBtn.style.display = 'none';
        text.style.display = 'none';
    }
    
    updateFormationDisplay();
}

/**
 * Valider le positionnement
 */
function validatePositioning() {
    if (!positioningMode) return;
    
    const players = footballApp.getState().players;
    const selected = selectedPlayers.map(id => players.find(p => p.id === id)).filter(Boolean);
    const positionedCount = selected.filter(p => playerPositions[p.id]).length;
    
    if (positionedCount < selected.length) {
        const missing = selected.length - positionedCount;
        if (!confirm(`${missing} joueuse(s) ne sont pas encore positionnée(s). Valider quand même ?`)) {
            return;
        }
    }
    
    positioningValidated = true;
    positioningMode = false;
    
    const btn = document.getElementById('togglePositioningBtn');
    const validateBtn = document.getElementById('validatePositioningBtn');
    const text = document.getElementById('positioningModeText');
    
    btn.className = 'btn btn-warning';
    btn.innerHTML = '📸 Positionnement Validé';
    btn.onclick = () => {
        if (confirm('Voulez-vous modifier le positionnement ?')) {
            positioningValidated = false;
            togglePositioningMode();
        }
    };
    
    validateBtn.style.display = 'none';
    text.style.display = 'none';
    
    updateFormationDisplay();
    showNotification('Positionnement validé ! Image figée.', 'success');
}

// ===== AFFICHAGE =====

/**
 * Mise à jour de l'affichage de la sélection des joueurs
 */
function updatePlayersSelectionDisplay() {
    const container = document.getElementById('playersSelectionGrid');
    const players = footballApp.getState().players;

    if (players.length === 0) {
        container.innerHTML = '<p class="text-center">Aucune joueuse disponible. <a href="team.html">Créez votre équipe d\'abord</a>.</p>';
        return;
    }

    container.innerHTML = '';

    const positionsConfig = [
        { key: 'gardienne', label: 'Gardiennes', icon: '🥅' },
        { key: 'défenseure', label: 'Défenseures', icon: '🛡️' },
        { key: 'milieu', label: 'Milieux', icon: '⚙️' },
        { key: 'attaquante', label: 'Attaquantes', icon: '⚽' }
    ];
    
    positionsConfig.forEach(posConfig => {
        const positionPlayers = players.filter(p => p.position === posConfig.key);
        
        if (positionPlayers.length > 0) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'position-category';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'position-category-header';
            headerDiv.innerHTML = `
                <span class="position-category-icon">${posConfig.icon}</span>
                <h3 class="position-category-title">${posConfig.label} (${positionPlayers.length})</h3>
            `;
            categoryDiv.appendChild(headerDiv);
            
            const playersDiv = document.createElement('div');
            playersDiv.className = 'position-category-players';
            
            positionPlayers.forEach(player => {
                const playerCard = createSelectablePlayerCard(player);
                playersDiv.appendChild(playerCard);
            });
            
            categoryDiv.appendChild(playersDiv);
            container.appendChild(categoryDiv);
        }
    });
}

/**
 * Créer une carte joueur sélectionnable
 */
function createSelectablePlayerCard(player) {
    const isSelected = selectedPlayers.includes(player.id);
    const isDisabled = player.status === 'sanctioned';
    
    const card = document.createElement('div');
    card.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''} ${isSelected ? 'selected' : ''} ${isDisabled ? 'sanctioned' : ''}`;
    
    if (isDisabled) {
        card.style.opacity = '0.5';
        card.style.cursor = 'not-allowed';
    } else {
        card.onclick = () => togglePlayerSelection(player.id);
    }

    card.innerHTML = `
        <div style="font-size: 1.5em;">${footballApp.getPositionIcon(player.position)}</div>
        <div style="font-weight: bold; margin: 5px 0;">${player.name}</div>
        ${player.number ? `<div style="font-size: 12px; color: #f39c12;">N° ${player.number}</div>` : ''}
        <div style="font-size: 11px; margin: 5px 0;">
            ${isSelected ? '✅ Titulaire' : isDisabled ? '⚠️ Sanctionnée' : '🪑 Disponible'}
        </div>
        <div style="font-size: 10px; opacity: 0.8;">
            ⚽ ${player.stats.goals} | 🎯 ${player.stats.shots}
        </div>
    `;

    return card;
}

/**
 * Basculer la sélection d'un joueur
 */
function togglePlayerSelection(playerId) {
    const player = footballApp.getState().players.find(p => p.id === playerId);
    
    if (!player || player.status === 'sanctioned') {
        return;
    }

    const isSelected = selectedPlayers.includes(playerId);
    
    if (isSelected) {
        selectedPlayers = selectedPlayers.filter(id => id !== playerId);
        footballApp.updatePlayerStatus(playerId, 'available');
    } else {
        if (selectedPlayers.length >= 11) {
            showNotification('Vous avez déjà sélectionné 11 joueuses', 'warning');
            return;
        }
        
        if (player.position === 'gardienne') {
            const selectedGoalkeepers = selectedPlayers.filter(id => {
                const p = footballApp.getState().players.find(pl => pl.id === id);
                return p && p.position === 'gardienne';
            });
            
            if (selectedGoalkeepers.length > 0) {
                showNotification('Il ne peut y avoir qu\'une seule gardienne titulaire', 'warning');
                return;
            }
        }
        
        selectedPlayers.push(playerId);
        footballApp.updatePlayerStatus(playerId, 'field');
    }

    updatePlayersSelectionDisplay();
    updateSubstituteSelectionDisplay(); // Mettre à jour aussi les remplaçantes
    updateCompositionStats();
    updateFormationDisplay();
    updateValidationButton();
}

/**
 * Mise à jour des statistiques de composition
 */
function updateCompositionStats() {
    const players = footballApp.getState().players;
    const selected = selectedPlayers.map(id => players.find(p => p.id === id)).filter(Boolean);
    
    document.getElementById('selectedCount').textContent = selected.length;
    document.getElementById('goalkeepersSelected').textContent = selected.filter(p => p.position === 'gardienne').length;
    document.getElementById('defendersSelected').textContent = selected.filter(p => p.position === 'défenseure').length;
    document.getElementById('midfieldersSelected').textContent = selected.filter(p => p.position === 'milieu').length;
    document.getElementById('attackersSelected').textContent = selected.filter(p => p.position === 'attaquante').length;
    
    updateCompositionStatus(selected);
}

/**
 * Mise à jour du statut de la composition
 */
function updateCompositionStatus(selected) {
    const statusEl = document.getElementById('compositionStatus');
    const goalkeepers = selected.filter(p => p.position === 'gardienne').length;
    
    if (selected.length === 0) {
        statusEl.innerHTML = '<span class="status-icon">⚠️</span><span class="status-text">Aucune joueuse sélectionnée</span>';
        statusEl.className = 'composition-status warning';
    } else if (selected.length < 11) {
        statusEl.innerHTML = `<span class="status-icon">⚠️</span><span class="status-text">Il manque ${11 - selected.length} joueuse(s)</span>`;
        statusEl.className = 'composition-status warning';
    } else if (selected.length === 11 && goalkeepers === 0) {
        statusEl.innerHTML = '<span class="status-icon">❌</span><span class="status-text">Aucune gardienne sélectionnée</span>';
        statusEl.className = 'composition-status error';
    } else if (selected.length === 11 && goalkeepers === 1) {
        statusEl.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Composition valide et prête !</span>';
        statusEl.className = 'composition-status success';
    } else {
        statusEl.innerHTML = '<span class="status-icon">❌</span><span class="status-text">Trop de joueuses sélectionnées</span>';
        statusEl.className = 'composition-status error';
    }
}

/**
 * Mise à jour de l'affichage de la formation
 */
function updateFormationDisplay() {
    const players = footballApp.getState().players;
    const selected = selectedPlayers.map(id => players.find(p => p.id === id)).filter(Boolean);
    
    const positions = {
        gardienne: selected.filter(p => p.position === 'gardienne'),
        défenseure: selected.filter(p => p.position === 'défenseure'),
        milieu: selected.filter(p => p.position === 'milieu'),
        attaquante: selected.filter(p => p.position === 'attaquante')
    };

    if (positioningMode || positioningValidated) {
        updatePositionDisplayManual('gk', positions.gardienne, 1);
        updatePositionDisplayManual('def', positions.défenseure, 5);
        updatePositionDisplayManual('mid', positions.milieu, 5);
        updatePositionDisplayManual('att', positions.attaquante, 3);
    } else {
        updatePositionDisplay('gk', positions.gardienne);
        updatePositionDisplay('def', positions.défenseure);
        updatePositionDisplay('mid', positions.milieu);
        updatePositionDisplay('att', positions.attaquante);
    }
    
    updateStartingElevenList(selected);
    updateBenchList();
}

/**
 * Mise à jour de l'affichage d'une position (mode normal)
 */
function updatePositionDisplay(position, players) {
    const container = document.getElementById(`${position}-players`);
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-position">Aucune joueuse</div>';
        return;
    }

    container.innerHTML = '';
    players.forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = 'field-player';
        playerEl.innerHTML = `
            <div class="player-name">${player.name}</div>
            ${player.number ? `<div class="player-number">${player.number}</div>` : ''}
        `;
        container.appendChild(playerEl);
    });
}

/**
 * Mise à jour de l'affichage d'une position (mode manuel)
 */
function updatePositionDisplayManual(position, players, maxSlots) {
    const container = document.getElementById(`${position}-players`);
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.gap = '10px';
    container.style.flexWrap = 'wrap';
    
    for (let i = 0; i < maxSlots; i++) {
        const slotId = `${position}-${i}`;
        const assignedPlayer = players.find(p => playerPositions[p.id] === slotId);
        
        if (positioningValidated && !assignedPlayer) {
            continue;
        }
        
        const slotDiv = document.createElement('div');
        slotDiv.className = 'position-slot' + (assignedPlayer ? ' filled' : ' empty');
        slotDiv.id = slotId;
        
        if (assignedPlayer) {
            slotDiv.innerHTML = `
                <div class="player-name">${assignedPlayer.name}</div>
                ${assignedPlayer.number ? `<div class="player-number">${assignedPlayer.number}</div>` : ''}
            `;
            if (positioningMode) {
                slotDiv.onclick = () => reassignPlayerSlot(slotId, position, assignedPlayer.id);
            }
        } else {
            slotDiv.innerHTML = '<div class="empty-slot">+</div>';
            slotDiv.onclick = () => assignPlayerToSlot(slotId, position);
        }
        
        container.appendChild(slotDiv);
    }
}

/**
 * Assigner un joueur à un emplacement
 */
function assignPlayerToSlot(slotId, positionType) {
    if (!positioningMode) return;
    
    const players = footballApp.getState().players;
    const positionKey = positionType === 'gk' ? 'gardienne' : 
                       positionType === 'def' ? 'défenseure' :
                       positionType === 'mid' ? 'milieu' : 'attaquante';
    
    const availablePlayers = selectedPlayers
        .map(id => players.find(p => p.id === id))
        .filter(p => p && p.position === positionKey && !playerPositions[p.id]);
    
    if (availablePlayers.length === 0) {
        showNotification('Aucune joueuse disponible pour cette position', 'warning');
        return;
    }
    
    showPlayerSelectionModal(availablePlayers, slotId);
}

/**
 * Réassigner un emplacement de joueur
 */
function reassignPlayerSlot(slotId, positionType, currentPlayerId) {
    if (!positioningMode) return;
    
    if (confirm('Voulez-vous retirer cette joueuse de cet emplacement ?')) {
        delete playerPositions[currentPlayerId];
        savePlayerPositions();
        updateFormationDisplay();
    }
}

/**
 * Afficher la modal de sélection de joueur
 */
function showPlayerSelectionModal(availablePlayers, slotId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>Sélectionner une joueuse</h3>
            <div class="player-selection-list">
                ${availablePlayers.map(player => `
                    <button class="player-select-btn" onclick="confirmPlayerAssignment('${player.id}', '${slotId}', this.closest('.modal'))">
                        ${footballApp.getPositionIcon(player.position)} ${player.name}
                        ${player.number ? ` (${player.number})` : ''}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Confirmer l'assignation d'un joueur
 */
function confirmPlayerAssignment(playerId, slotId, modal) {
    playerPositions[playerId] = slotId;
    savePlayerPositions();
    modal.remove();
    updateFormationDisplay();
    showNotification('Joueuse positionnée !', 'success');
}

/**
 * Mise à jour de la liste des 11 de départ
 */
function updateStartingElevenList(selected) {
    const container = document.getElementById('startingElevenList');
    
    if (selected.length === 0) {
        container.innerHTML = '<p>Aucune joueuse sélectionnée</p>';
        return;
    }

    container.innerHTML = '';
    
    const positionsConfig = [
        { key: 'gardienne', label: 'Gardiennes', icon: '🥅' },
        { key: 'défenseure', label: 'Défenseures', icon: '🛡️' },
        { key: 'milieu', label: 'Milieux', icon: '⚙️' },
        { key: 'attaquante', label: 'Attaquantes', icon: '⚽' }
    ];
    
    positionsConfig.forEach(posConfig => {
        const positionPlayers = selected.filter(p => p.position === posConfig.key);
        
        if (positionPlayers.length > 0) {
            const positionDiv = document.createElement('div');
            positionDiv.className = 'position-group';
            positionDiv.innerHTML = `
                <h4>${posConfig.icon} ${posConfig.label} (${positionPlayers.length})</h4>
                <ul>
                    ${positionPlayers.map(p => `<li>${p.name}${p.number ? ` (${p.number})` : ''}</li>`).join('')}
                </ul>
            `;
            container.appendChild(positionDiv);
        }
    });
}

/**
 * Mise à jour de la liste du banc
 */
function updateBenchList() {
    const container = document.getElementById('benchList');
    const visualContainer = document.getElementById('benchVisualPlayers');
    const players = footballApp.getState().players;
    
    const benchPlayers = players.filter(p => p.status === 'bench');
    
    // Mise à jour de la liste détaillée
    if (benchPlayers.length === 0) {
        container.innerHTML = '<p>Aucune joueuse sur le banc</p>';
    } else {
        container.innerHTML = '';
        const benchList = document.createElement('ul');
        
        benchPlayers.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `${footballApp.getPositionIcon(player.position)} ${player.name}${player.number ? ` (${player.number})` : ''}`;
            benchList.appendChild(li);
        });
        
        container.appendChild(benchList);
    }
    
    // Mise à jour de l'aperçu visuel dans la formation
    updateBenchVisual(benchPlayers);
}

/**
 * Mise à jour de l'aperçu visuel du banc
 */
function updateBenchVisual(benchPlayers) {
    const visualContainer = document.getElementById('benchVisualPlayers');
    
    if (!visualContainer) return;
    
    if (benchPlayers.length === 0) {
        visualContainer.innerHTML = '<div style="color: rgba(255,255,255,0.6); font-style: italic; font-size: 12px;">Aucune remplaçante</div>';
        return;
    }
    
    visualContainer.innerHTML = '';
    
    benchPlayers.forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = 'bench-visual-player';
        playerEl.innerHTML = `
            <div class="player-name">${player.name}</div>
            ${player.number ? `<div class="player-number" style="font-size: 9px;">${player.number}</div>` : ''}
        `;
        visualContainer.appendChild(playerEl);
    });
}

/**
 * Mise à jour du bouton de validation
 */
function updateValidationButton() {
    const btn = document.getElementById('validateBtn');
    const players = footballApp.getState().players;
    const selected = selectedPlayers.map(id => players.find(p => p.id === id)).filter(Boolean);
    const goalkeepers = selected.filter(p => p.position === 'gardienne').length;
    
    const isValid = selected.length === 11 && goalkeepers === 1;
    btn.disabled = !isValid;
    
    if (isValid) {
        btn.className = 'btn btn-success';
        btn.innerHTML = '✅ Valider la Composition';
    } else {
        btn.className = 'btn btn-primary';
        btn.innerHTML = '⚠️ Composition Incomplète';
    }
}

// ===== ACTIONS =====

/**
 * Effacer la sélection
 */
function clearSelection() {
    if (selectedPlayers.length === 0) {
        showNotification('Aucune joueuse à désélectionner', 'info');
        return;
    }

    if (confirm('Désélectionner toutes les joueuses ?')) {
        selectedPlayers.forEach(playerId => {
            footballApp.updatePlayerStatus(playerId, 'available');
        });
        
        selectedPlayers = [];
        
        updatePlayersSelectionDisplay();
        updateSubstituteSelectionDisplay();
        updateCompositionStats();
        updateFormationDisplay();
        updateValidationButton();
        
        showNotification('Sélection effacée');
    }
}

/**
 * Sélection automatique de la composition
 */
function autoSelectComposition() {
    const players = footballApp.getState().players;
    const availablePlayers = players.filter(p => p.status !== 'sanctioned' && p.status !== 'out');
    
    if (availablePlayers.length < 11) {
        showNotification(`Il faut au moins 11 joueuses disponibles (${availablePlayers.length} actuellement)`, 'error');
        return;
    }

    const goalkeepers = availablePlayers.filter(p => p.position === 'gardienne');
    if (goalkeepers.length === 0) {
        showNotification('Aucune gardienne disponible', 'error');
        return;
    }

    if (confirm('Sélectionner automatiquement une composition équilibrée ?')) {
        selectedPlayers.forEach(playerId => {
            footballApp.updatePlayerStatus(playerId, 'available');
        });
        selectedPlayers = [];

        const selected = [];
        selected.push(goalkeepers[0]);

        const fieldPlayers = availablePlayers.filter(p => p.position !== 'gardienne');
        const distribution = { défenseure: 4, milieu: 3, attaquante: 3 };
        
        ['défenseure', 'milieu', 'attaquante'].forEach(position => {
            const positionPlayers = fieldPlayers.filter(p => p.position === position);
            const needed = distribution[position];
            
            for (let i = 0; i < Math.min(needed, positionPlayers.length); i++) {
                if (selected.length < 11) {
                    selected.push(positionPlayers[i]);
                }
            }
        });

        while (selected.length < 11 && fieldPlayers.length > 0) {
            const remaining = fieldPlayers.filter(p => !selected.includes(p));
            if (remaining.length > 0) {
                selected.push(remaining[0]);
            } else {
                break;
            }
        }

        selected.forEach(player => {
            selectedPlayers.push(player.id);
            footballApp.updatePlayerStatus(player.id, 'field');
        });

        updatePlayersSelectionDisplay();
        updateSubstituteSelectionDisplay();
        updateCompositionStats();
        updateFormationDisplay();
        updateValidationButton();
        
        showNotification(`Composition automatique créée (${selected.length} joueuses)`);
    }
}

/**
 * Appliquer une formation prédéfinie
 */
function applyFormation(formation) {
    const players = footballApp.getState().players;
    const availablePlayers = players.filter(p => p.status !== 'sanctioned' && p.status !== 'out');
    
    const formations = {
        '4-4-2': { défenseure: 4, milieu: 4, attaquante: 2 },
        '4-3-3': { défenseure: 4, milieu: 3, attaquante: 3 },
        '4-2-3-1': { défenseure: 4, milieu: 5, attaquante: 1 },
        '3-5-2': { défenseure: 3, milieu: 5, attaquante: 2 },
        '5-3-2': { défenseure: 5, milieu: 3, attaquante: 2 }
    };

    const config = formations[formation];
    if (!config) return;

    const goalkeepers = availablePlayers.filter(p => p.position === 'gardienne');
    if (goalkeepers.length === 0) {
        showNotification('Aucune gardienne disponible', 'error');
        return;
    }

    let canApply = true;
    let message = `Formation ${formation}:\n`;
    
    const positionLabels = {
        'défenseure': 'Défenseures',
        'milieu': 'Milieux',
        'attaquante': 'Attaquantes'
    };
    
    Object.entries(config).forEach(([position, needed]) => {
        const available = availablePlayers.filter(p => p.position === position).length;
        const label = positionLabels[position] || position;
        message += `- ${label}: ${needed} requis, ${available} disponibles\n`;
        if (available < needed) {
            canApply = false;
        }
    });

    if (!canApply) {
        alert(`Impossible d'appliquer la formation ${formation}:\n\n${message}`);
        return;
    }

    if (confirm(`Appliquer la formation ${formation} ?\n\n${message}`)) {
        selectedPlayers.forEach(playerId => {
            footballApp.updatePlayerStatus(playerId, 'available');
        });
        selectedPlayers = [];

        const selected = [];
        selected.push(goalkeepers[0]);
        
        Object.entries(config).forEach(([position, needed]) => {
            const positionPlayers = availablePlayers.filter(p => p.position === position);
            for (let i = 0; i < needed && i < positionPlayers.length; i++) {
                selected.push(positionPlayers[i]);
            }
        });

        selected.forEach(player => {
            selectedPlayers.push(player.id);
            footballApp.updatePlayerStatus(player.id, 'field');
        });

        updatePlayersSelectionDisplay();
        updateSubstituteSelectionDisplay();
        updateCompositionStats();
        updateFormationDisplay();
        updateValidationButton();
        
        showNotification(`Formation ${formation} appliquée !`);
    }
}

// ===== GESTION DES REMPLAÇANTES =====

/**
 * Affichage de la sélection des remplaçantes
 */
function updateSubstituteSelectionDisplay() {
    const container = document.getElementById('substituteSelectionGrid');
    const players = footballApp.getState().players;
    
    const availablePlayers = players.filter(p => 
        !selectedPlayers.includes(p.id) && 
        p.status !== 'sanctioned' && 
        p.status !== 'out'
    );

    if (availablePlayers.length === 0) {
        container.innerHTML = '<p class="text-center">Toutes les joueuses sont déjà sélectionnées ou sanctionnées.</p>';
        return;
    }

    container.innerHTML = '';

    const positionsConfig = [
        { key: 'gardienne', label: 'Gardiennes', icon: '🥅' },
        { key: 'défenseure', label: 'Défenseures', icon: '🛡️' },
        { key: 'milieu', label: 'Milieux', icon: '⚙️' },
        { key: 'attaquante', label: 'Attaquantes', icon: '⚽' }
    ];
    
    positionsConfig.forEach(posConfig => {
        const positionPlayers = availablePlayers.filter(p => p.position === posConfig.key);
        
        if (positionPlayers.length > 0) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'position-category';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'position-category-header';
            headerDiv.innerHTML = `
                <span class="position-category-icon">${posConfig.icon}</span>
                <h3 class="position-category-title">${posConfig.label} (${positionPlayers.length})</h3>
            `;
            categoryDiv.appendChild(headerDiv);
            
            const playersDiv = document.createElement('div');
            playersDiv.className = 'position-category-players';
            
            positionPlayers.forEach(player => {
                const playerCard = createSubstituteSelectableCard(player);
                playersDiv.appendChild(playerCard);
            });
            
            categoryDiv.appendChild(playersDiv);
            container.appendChild(categoryDiv);
        }
    });
}

/**
 * Créer une carte joueuse pour les remplaçantes
 */
function createSubstituteSelectableCard(player) {
    const isSelected = selectedSubstitutes.includes(player.id);
    
    const card = document.createElement('div');
    card.className = `player-btn ${player.position === 'gardienne' ? 'goalkeeper' : ''} ${isSelected ? 'selected' : ''}`;
    card.onclick = () => toggleSubstituteSelection(player.id);

    card.innerHTML = `
        <div style="font-size: 1.5em;">${footballApp.getPositionIcon(player.position)}</div>
        <div style="font-weight: bold; margin: 5px 0;">${player.name}</div>
        ${player.number ? `<div style="font-size: 12px; color: #f39c12;">N° ${player.number}</div>` : ''}
        <div style="font-size: 11px; margin: 5px 0;">
            ${isSelected ? '✅ Remplaçante' : '➕ Disponible'}
        </div>
        <div style="font-size: 10px; opacity: 0.8;">
            ⚽ ${player.stats.goals} | 🎯 ${player.stats.shots}
        </div>
    `;

    return card;
}

/**
 * Basculer la sélection d'une remplaçante
 */
function toggleSubstituteSelection(playerId) {
    const player = footballApp.getState().players.find(p => p.id === playerId);
    
    if (!player || player.status === 'sanctioned') {
        return;
    }

    const isSelected = selectedSubstitutes.includes(playerId);
    
    if (isSelected) {
        selectedSubstitutes = selectedSubstitutes.filter(id => id !== playerId);
        footballApp.updatePlayerStatus(playerId, 'available');
    } else {
        selectedSubstitutes.push(playerId);
        footballApp.updatePlayerStatus(playerId, 'bench');
    }

    updateSubstituteSelectionDisplay();
    updateBenchList();
    footballApp.saveState();
}

/**
 * Vider le banc
 */
function clearSubstitutes() {
    if (selectedSubstitutes.length === 0) {
        showNotification('Aucune remplaçante à retirer', 'info');
        return;
    }

    if (confirm('Retirer toutes les remplaçantes du banc ?')) {
        selectedSubstitutes.forEach(playerId => {
            footballApp.updatePlayerStatus(playerId, 'available');
        });
        
        selectedSubstitutes = [];
        
        updateSubstituteSelectionDisplay();
        updateBenchList();
        footballApp.saveState();
        
        showNotification('Banc vidé');
    }
}

/**
 * Valider les remplaçantes
 */
function validateSubstitutes() {
    footballApp.saveState();
    showNotification(`${selectedSubstitutes.length} remplaçante(s) validée(s) !`, 'success');
    updateBenchList();
}

// ===== VALIDATION =====

/**
 * Valider la composition
 */
function validateComposition() {
    const players = footballApp.getState().players;
    const selected = selectedPlayers.map(id => players.find(p => p.id === id)).filter(Boolean);
    const goalkeepers = selected.filter(p => p.position === 'gardienne').length;
    
    if (selected.length !== 11) {
        showNotification(`Il faut exactement 11 joueuses (${selected.length} sélectionnées)`, 'error');
        return;
    }

    if (goalkeepers !== 1) {
        showNotification('Il faut exactement 1 gardienne', 'error');
        return;
    }

    footballApp.saveState();
    displayValidationSummary(selected);
    
    // Afficher la modal
    document.getElementById('validationModal').style.display = 'block';
}

/**
 * Afficher le résumé de validation
 */
function displayValidationSummary(selected) {
    const container = document.getElementById('validatedComposition');
    
    const positions = {
        gardienne: selected.filter(p => p.position === 'gardienne'),
        défenseure: selected.filter(p => p.position === 'défenseure'),
        milieu: selected.filter(p => p.position === 'milieu'),
        attaquante: selected.filter(p => p.position === 'attaquante')
    };

    const formation = `${positions.défenseure.length}-${positions.milieu.length}-${positions.attaquante.length}`;

    container.innerHTML = `
        <div class="formation-summary">
            <h4>Formation: ${formation}</h4>
            <div class="position-summary">
                <div><strong>🥅 Gardienne:</strong> ${positions.gardienne.map(p => p.name).join(', ')}</div>
                <div><strong>🛡️ Défense (${positions.défenseure.length}):</strong> ${positions.défenseure.map(p => p.name).join(', ')}</div>
                <div><strong>⚙️ Milieux (${positions.milieu.length}):</strong> ${positions.milieu.map(p => p.name).join(', ')}</div>
                <div><strong>⚽ Attaque (${positions.attaquante.length}):</strong> ${positions.attaquante.map(p => p.name).join(', ')}</div>
            </div>
        </div>
    `;
}

/**
 * Fermer la modal de validation
 */
function closeValidationModal() {
    document.getElementById('validationModal').style.display = 'none';
}

/**
 * Aller au match
 */
function goToMatch() {
    showNotification('Redirection vers l\'interface de match...', 'success');
    setTimeout(() => {
        window.location.href = 'match.html';
    }, 1500);
}

// ===== UTILITAIRES =====

/**
 * Afficher une notification
 */
function showNotification(message, type = 'info') {
    if (typeof footballApp !== 'undefined' && footballApp.showNotification) {
        footballApp.showNotification(message, type);
    } else {
        alert(message);
    }
}

console.log('✅ Module composition.js chargé');