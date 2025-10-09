// match.js - Logique principale de la page match

// ===== VARIABLES GLOBALES =====
let matchTimer = {
    startTime: null,
    pausedTime: 0,
    isRunning: false,
    currentHalf: 1,
    interval: null
};

let matchEvents = [];
let matchStats = {
    myTeam: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 },
    opponent: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 }
};

// Variables pour l'édition
let currentEditEventId = null;
let newSelectedActionType = null;

// ===== INITIALISATION =====

function initializeMatchPage() {
    loadMatchConfig();
    loadSavedMatchData();
    updateMatchDisplay();
    updateHalfTimeButton();
    startPeriodicSave();
}

// ===== SYNCHRONISATION =====

function syncMatchEventsWithApp() {
    if (typeof footballApp !== 'undefined') {
        const appEvents = footballApp.getState().events;
        if (appEvents && appEvents.length > 0) {
            matchEvents = appEvents;
        }
    }
}

// ===== GESTION DU TIMER =====

function toggleTimer() {
    if (matchTimer.isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (matchTimer.isRunning) return;
    
    matchTimer.isRunning = true;
    matchTimer.startTime = Date.now() - (matchTimer.pausedTime * 1000);
    matchTimer.interval = setInterval(updateTimer, 1000);
    
    document.getElementById('playBtn').innerHTML = '⏸️ Pause';
    document.getElementById('playBtn').classList.remove('btn-success');
    document.getElementById('playBtn').classList.add('btn-warning');
    
    autoSave();
}

function stopTimer() {
    if (!matchTimer.isRunning) return;
    
    matchTimer.isRunning = false;
    matchTimer.pausedTime = (Date.now() - matchTimer.startTime) / 1000;
    clearInterval(matchTimer.interval);
    
    document.getElementById('playBtn').innerHTML = '▶️ Reprendre';
    document.getElementById('playBtn').classList.remove('btn-warning');
    document.getElementById('playBtn').classList.add('btn-success');
    
    autoSave();
}

function resetTimer() {
    stopTimer();
    matchTimer.pausedTime = 0;
    matchTimer.startTime = null;
    updateTimerDisplay();
    
    document.getElementById('playBtn').innerHTML = '▶️ Démarrer';
    document.getElementById('playBtn').classList.remove('btn-warning');
    document.getElementById('playBtn').classList.add('btn-success');
    
    autoSave();
}

function updateTimer() {
    if (!matchTimer.isRunning || !matchTimer.startTime) return;
    
    const elapsedSeconds = (Date.now() - matchTimer.startTime) / 1000;
    let totalSeconds = Math.floor(elapsedSeconds);
    
    if (matchTimer.currentHalf === 2) {
        totalSeconds += 45 * 60;
    }
    
    updateTimerDisplay(totalSeconds);
    
    if (totalSeconds % 60 === 0) {
        autoSave();
    }
}

function updateTimerDisplay(totalSeconds = null) {
    if (totalSeconds === null) {
        totalSeconds = matchTimer.pausedTime;
        if (matchTimer.currentHalf === 2) {
            totalSeconds += 45 * 60;
        }
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    let displayTime;
    if (minutes >= 45 && matchTimer.currentHalf === 1) {
        const overtimeMinutes = minutes - 45;
        displayTime = `45+${overtimeMinutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (minutes >= 90 && matchTimer.currentHalf === 2) {
        const overtimeMinutes = minutes - 90;
        displayTime = `90+${overtimeMinutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    document.getElementById('matchTime').textContent = displayTime;
}

function getCurrentMatchTime() {
    let totalSeconds = matchTimer.pausedTime;
    if (matchTimer.isRunning && matchTimer.startTime) {
        totalSeconds = (Date.now() - matchTimer.startTime) / 1000;
    }
    
    if (matchTimer.currentHalf === 2) {
        totalSeconds += 45 * 60;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    if (minutes >= 45 && matchTimer.currentHalf === 1) {
        const overtimeMinutes = minutes - 45;
        return `45+${overtimeMinutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (minutes >= 90 && matchTimer.currentHalf === 2) {
        const overtimeMinutes = minutes - 90;
        return `90+${overtimeMinutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// ===== GESTION DES MI-TEMPS =====

function showHalfTimeConfirm() {
    if (matchTimer.currentHalf === 2) {
        if (confirm('Voulez-vous terminer le match ?')) {
            endMatch();
        }
    } else {
        if (confirm('Voulez-vous passer à la seconde mi-temps ?')) {
            switchToSecondHalf();
        }
    }
}

function switchToSecondHalf() {
    stopTimer();
    matchTimer.currentHalf = 2;
    matchTimer.pausedTime = 0;
    matchTimer.startTime = null;
    
    document.getElementById('matchHalf').textContent = '2ème Mi-temps';
    updateTimerDisplay();
    updateHalfTimeButton();
    
    addEvent('system', {
        description: 'Début de la 2ème mi-temps',
        team: null
    });
    
    autoSave();
}

function endMatch() {
    stopTimer();
    
    const matchData = JSON.parse(localStorage.getItem('currentMatch') || '{}');
    matchData.matchStatus = 'finished';
    matchData.endTime = new Date().toISOString();
    localStorage.setItem('currentMatch', JSON.stringify(matchData));
    
    addEvent('system', {
        description: 'Fin du match',
        team: null
    });
    
    autoSave().then(() => {
        console.log('🏁 Match terminé et sauvegardé');
    });
    
    alert('🏁 Match terminé !\n\n' +
        '✅ Toutes les données ont été sauvegardées.\n' +
        '📊 Consultez les statistiques dans l\'onglet Stats.\n' +
        '📱 Le lien live reste actif pour consulter les résultats.');
}

function updateHalfTimeButton() {
    const halfTimeBtn = document.querySelector('button[onclick="showHalfTimeConfirm()"]');
    if (halfTimeBtn) {
        if (matchTimer.currentHalf === 1) {
            halfTimeBtn.innerHTML = '⏭ Mi-temps';
            halfTimeBtn.className = 'btn btn-primary';
        } else if (matchTimer.currentHalf === 2) {
            halfTimeBtn.innerHTML = '🏁 Fin du match';
            halfTimeBtn.className = 'btn btn-danger';
        }
    }
}

// ===== GESTION DES ÉVÉNEMENTS =====

function addEvent(type, data) {
    const event = {
        id: Date.now(),
        type: type,
        ...data,
        timestamp: new Date()
    };
    
    matchEvents.unshift(event);

    if (typeof footballApp !== 'undefined') {
        const appState = footballApp.getState();
        if (!appState.events.find(e => e.id === event.id)) {
            appState.events.unshift(event);
            footballApp.saveState();
        }
    }

    updateTimeline();
}

function updateTimeline() {
    syncMatchEventsWithApp();
    const container = document.getElementById('eventsTimeline');
    
    if (matchEvents.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #bbb;">Aucun événement enregistré</div>';
        return;
    }
    
    container.innerHTML = '';
    
    matchEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'timeline-event';
        eventDiv.onclick = () => openEditActionTypeModal(event.id);
        
        const leftDiv = document.createElement('div');
        const timeDiv = document.createElement('div');
        const rightDiv = document.createElement('div');
        
        leftDiv.className = 'event-left';
        timeDiv.className = 'event-time';
        rightDiv.className = 'event-right';
        
        timeDiv.textContent = event.time;
        
        if (event.isTeam) {
            leftDiv.innerHTML = window.getEventHTML ? window.getEventHTML(event) : getEventDescription(event);
            rightDiv.innerHTML = '&nbsp;';
        } else {
            leftDiv.innerHTML = '&nbsp;';
            rightDiv.innerHTML = window.getEventHTML ? window.getEventHTML(event) : getEventDescription(event);
        }
        
        eventDiv.appendChild(leftDiv);
        eventDiv.appendChild(timeDiv);
        eventDiv.appendChild(rightDiv);
        
        container.appendChild(eventDiv);
    });
    
    updateQuickStatsFromEvents();
}

function getEventDescription(event) {
    if (event.customDescription) {
        return event.customDescription;
    }
    
    const playerName = getPlayerName(event.playerId);
    
    switch (event.type) {
        case 'goal':
            let goalText = `⚽ ${playerName}`;
            if (event.assistPlayerId) {
                const assistName = getPlayerName(event.assistPlayerId);
                goalText += `<br><small>➡️ Passe: ${assistName}</small>`;
            }
            return goalText;
        case 'shot':
            return `🎯 Tir - ${playerName}`;
        case 'card':
            const cardEmoji = event.cardType === 'yellow' ? '🟨' : event.cardType === 'red' ? '🟥' : '⚪';
            return `${cardEmoji} Carton - ${playerName}`;
        case 'foul':
            return `⚠️ Faute - ${playerName}`;
        case 'save':
            const saveTypeText = {
                'line': 'sur sa ligne',
                'out': 'en sortie',
                'penalty': 'penalty',
                'corner': 'corner'
            };
            return `🧤 Arrêt ${saveTypeText[event.saveType] || ''} - ${playerName}`;
        case 'freekick':
            return `⚽ Coup Franc - ${playerName}`;
        default:
            return event.description || `${event.type} - ${playerName}`;
    }
}

// ===== GESTION DE L'ÉDITION =====

function openEditActionTypeModal(eventId) {
    const event = matchEvents.find(e => e.id == eventId);
    if (!event) {
        alert('Événement introuvable !');
        return;
    }
    
    currentEditEventId = eventId;
    newSelectedActionType = null;
    
    const actionNames = {
        'goal': '⚽ But',
        'assist': '➡️ Passe Décisive',
        'shot': '🎯 Tir',
        'save': '🧤 Arrêt Gardien',
        'foul': '⚠️ Faute',
        'card': '🟨 Carton',
        'corner': '🚩 Corner',
        'offside': '🛑 Hors-jeu',
        'substitution': '🔄 Changement'
    };
    
    const currentActionTypeEl = document.getElementById('currentActionType');
    if (currentActionTypeEl) {
        currentActionTypeEl.textContent = actionNames[event.type] || event.type;
    }
    
    const actionBtns = document.querySelectorAll('#editActionTypeModal .action-btn');
    actionBtns.forEach(btn => btn.classList.remove('selected-for-replace'));
    
    const modal = document.getElementById('editActionTypeModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeEditActionTypeModal() {
    const modal = document.getElementById('editActionTypeModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditEventId = null;
    newSelectedActionType = null;
}

function selectNewActionType(actionType, e) {
    if (actionType === 'substitution') {
        if (!currentEditEventId) return;
        
        window.isEditingSubstitution = true;
        window.editingSubstitutionId = currentEditEventId;
        
        closeEditActionTypeModal();
        
        setTimeout(() => {
            showSubstitutionModal();
        }, 300);
        
        return;
    }
    
    window.isEditingMode = true;
    window.editingEventId = currentEditEventId;
    
    closeEditActionTypeModal();
    
    setTimeout(() => {
        showUnifiedActionModal(actionType);
    }, 300);
}

function deleteActionFromModal() {
    if (!currentEditEventId) {
        console.error('❌ Aucune action à supprimer');
        alert('Erreur: Aucune action sélectionnée');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
        return;
    }
    
    const eventIndex = matchEvents.findIndex(e => e.id === currentEditEventId);
    
    if (eventIndex === -1) {
        console.error('❌ Action non trouvée');
        alert('Erreur: Action non trouvée');
        return;
    }
    
    const deletedEvent = matchEvents[eventIndex];
    matchEvents.splice(eventIndex, 1);
    
    if (typeof footballApp !== 'undefined') {
        const appState = footballApp.getState();
        const appEventIndex = appState.events.findIndex(e => e.id === currentEditEventId);
        if (appEventIndex !== -1) {
            appState.events.splice(appEventIndex, 1);
        }
    }
    
    recalculateStatsAfterDelete(deletedEvent);
    autoSave();
    updateTimeline();
    updateMatchDisplay();
    closeEditActionTypeModal();
    
    alert('✅ Action supprimée avec succès');
}

function recalculateStatsAfterDelete(deletedEvent) {
    const team = deletedEvent.isTeam ? 'myTeam' : 'opponent';
    
    switch (deletedEvent.type) {
        case 'goal':
            if (matchStats[team].goals > 0) matchStats[team].goals--;
            break;
        case 'shot':
            if (deletedEvent.option === 'Cadré' && matchStats[team].shotsOnTarget > 0) {
                matchStats[team].shotsOnTarget--;
            } else if (deletedEvent.option === 'Non cadré' && matchStats[team].shotsOffTarget > 0) {
                matchStats[team].shotsOffTarget--;
            }
            break;
        case 'card':
            if (matchStats[team].cards > 0) matchStats[team].cards--;
            break;
        case 'foul':
            if (matchStats[team].fouls > 0) matchStats[team].fouls--;
            break;
        case 'save':
            if (matchStats[team].saves > 0) matchStats[team].saves--;
            break;
    }
}

// ===== STATISTIQUES =====

function updateQuickStatsFromEvents() {
    matchStats = {
        myTeam: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 },
        opponent: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 }
    };
    
    matchEvents.forEach(event => {
        const team = event.isTeam ? 'myTeam' : 'opponent';
        
        switch (event.type) {
            case 'goal':
                matchStats[team].goals++;
                break;
            case 'shot':
                if (event.option === 'Cadré') {
                    matchStats[team].shotsOnTarget++;
                } else if (event.option === 'Non cadré') {
                    matchStats[team].shotsOffTarget++;
                }
                break;
            case 'card':
                matchStats[team].cards++;
                break;
            case 'foul':
                matchStats[team].fouls++;
                break;
            case 'save':
                matchStats[team].saves++;
                break;
        }
    });
    
    updateQuickStats();
    
    const teamScoreEl = document.getElementById('teamScore');
    const opponentScoreEl = document.getElementById('opponentScore');
    
    if (teamScoreEl) teamScoreEl.textContent = matchStats.myTeam.goals;
    if (opponentScoreEl) opponentScoreEl.textContent = matchStats.opponent.goals;
}

function updateQuickStats() {
    const container = document.getElementById('quickStats');
    if (!container) return; // Protection
    
    // Créer le contenu HTML
    container.innerHTML = `
        <div class="compact-stats-grid">
            <div class="stat-row">
                <div class="stat-label">⚽ Buts</div>
                <div class="stat-values">
                    <span class="team-value">${matchStats.myTeam.goals}</span>
                    <span class="separator">-</span>
                    <span class="opponent-value">${matchStats.opponent.goals}</span>
                </div>
            </div>
            <div class="stat-row">
                <div class="stat-label">🎯 Tirs cadrés</div>
                <div class="stat-values">
                    <span class="team-value">${matchStats.myTeam.shotsOnTarget || 0}</span>
                    <span class="separator">-</span>
                    <span class="opponent-value">${matchStats.opponent.shotsOnTarget || 0}</span>
                </div>
            </div>
            <div class="stat-row">
                <div class="stat-label">📍 Tirs non cadrés</div>
                <div class="stat-values">
                    <span class="team-value">${matchStats.myTeam.shotsOffTarget || 0}</span>
                    <span class="separator">-</span>
                    <span class="opponent-value">${matchStats.opponent.shotsOffTarget || 0}</span>
                </div>
            </div>
            <div class="stat-row">
                <div class="stat-label">🟨 Cartons</div>
                <div class="stat-values">
                    <span class="team-value">${matchStats.myTeam.cards}</span>
                    <span class="separator">-</span>
                    <span class="opponent-value">${matchStats.opponent.cards}</span>
                </div>
            </div>
            <div class="stat-row">
                <div class="stat-label">⚠️ Fautes</div>
                <div class="stat-values">
                    <span class="team-value">${matchStats.myTeam.fouls}</span>
                    <span class="separator">-</span>
                    <span class="opponent-value">${matchStats.opponent.fouls}</span>
                </div>
            </div>
            <div class="stat-row">
                <div class="stat-label">🧤 Arrêts</div>
                <div class="stat-values">
                    <span class="team-value">${matchStats.myTeam.saves}</span>
                    <span class="separator">-</span>
                    <span class="opponent-value">${matchStats.opponent.saves}</span>
                </div>
            </div>
        </div>
    `;
}

function updateMatchDisplay() {
    document.getElementById('teamScore').textContent = matchStats.myTeam.goals;
    document.getElementById('opponentScore').textContent = matchStats.opponent.goals;
    updateQuickStats();
}

// ===== CHARGEMENT/SAUVEGARDE =====

function loadMatchConfig() {
    const config = getMatchConfig();
    document.getElementById('teamName').textContent = config.teamName || 'Mon Équipe';
    document.getElementById('opponentName').textContent = config.opponentName || 'Équipe Adverse';
}

function loadSavedMatchData() {
    try {
        const savedData = localStorage.getItem('currentMatch');
        if (savedData) {
            const data = JSON.parse(savedData);
            const timerData = data.timer || data;
            const eventsData = data.events || [];
            const statsData = data.stats || { 
                myTeam: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 }, 
                opponent: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 } 
            };
            
            if (timerData) {
                matchTimer = { ...matchTimer, ...timerData };
                
                if (data.matchStatus === 'finished') {
                    matchTimer.isRunning = false;
                    document.getElementById('playBtn').disabled = true;
                    document.getElementById('playBtn').innerHTML = '🏁 Match terminé';
                    document.getElementById('playBtn').classList.add('btn-secondary');
                    
                    const resetBtn = document.querySelector('button[onclick="resetTimer()"]');
                    if (resetBtn) resetBtn.disabled = true;
                } else if (matchTimer.isRunning && matchTimer.startTime) {
                    const now = Date.now();
                    let savedStartTime;
                    if (typeof matchTimer.startTime === 'string') {
                        savedStartTime = new Date(matchTimer.startTime).getTime();
                    } else {
                        savedStartTime = matchTimer.startTime;
                    }
                    
                    const savedAt = timerData.savedAt ? new Date(timerData.savedAt).getTime() : now;
                    const timeSinceSave = now - savedAt;
                    const elapsedSinceStart = (savedAt - savedStartTime) / 1000;
                    matchTimer.pausedTime = elapsedSinceStart + (timeSinceSave / 1000);
                    matchTimer.startTime = now - (matchTimer.pausedTime * 1000);
                    matchTimer.interval = setInterval(updateTimer, 1000);
                    
                    document.getElementById('playBtn').innerHTML = '⏸️ Pause';
                    document.getElementById('playBtn').classList.remove('btn-success');
                    document.getElementById('playBtn').classList.add('btn-warning');
                } else {
                    document.getElementById('playBtn').innerHTML = '▶️ Reprendre';
                    document.getElementById('playBtn').classList.remove('btn-warning');
                    document.getElementById('playBtn').classList.add('btn-success');
                }
                
                updateTimerDisplay();
                document.getElementById('matchHalf').textContent = 
                    matchTimer.currentHalf === 1 ? '1ère Mi-temps' : '2ème Mi-temps';
                
                updateHalfTimeButton();
            }
            
            if (eventsData && eventsData.length > 0) {
                matchEvents = eventsData;
                updateTimeline();
            }
            
            if (statsData) {
                matchStats = statsData;
            }
            
            if (data.matchInfo) {
                document.getElementById('teamName').textContent = data.matchInfo.teamName;
                document.getElementById('opponentName').textContent = data.matchInfo.opponentName;
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

function startPeriodicSave() {
    setInterval(autoSave, 30000);
    setInterval(() => {
        if (matchTimer.isRunning) {
            autoSave();
        }
    }, 10000);
}

async function autoSave() {
    const config = getMatchConfig();
    const players = getMyTeamPlayers();
    
    const completeMatchData = {
        matchInfo: {
            teamName: config.teamName || 'Mon Équipe',
            opponentName: config.opponentName || 'Équipe Adverse',
            venue: config.venue || 'Terrain',
            date: new Date().toISOString().split('T')[0],
            startTime: config.startTime || '15:00'
        },
        timer: {
            ...matchTimer,
            startTime: matchTimer.startTime ? new Date(matchTimer.startTime).toISOString() : null,
            savedAt: new Date().toISOString(),
            currentTime: getCurrentMatchTime(),
            isRunning: matchTimer.isRunning,
            currentHalf: matchTimer.currentHalf,
            pausedTime: matchTimer.pausedTime
        },
        players: players.map(player => ({
            id: player.id,
            name: player.name,
            position: player.position,
            status: player.status || 'bench',
            number: player.number || null
        })),
        events: matchEvents.map(event => ({
            ...event,
            playerName: getPlayerName(event.playerId),
            formattedDescription: getEventDescription(event)
        })),
        stats: {
            ...matchStats,
            score: {
                myTeam: matchStats.myTeam.goals,
                opponent: matchStats.opponent.goals
            }
        },
        live: {
            lastUpdate: new Date().toISOString(),
            isActive: true,
            version: '1.0'
        }
    };
    
    localStorage.setItem('currentMatch', JSON.stringify(completeMatchData));
    
    const binId = localStorage.getItem('matchBinId');
    if (binId) {
        await updateJsonBinSilently(binId, completeMatchData);
    }
}

async function updateJsonBinSilently(binId, data) {
    try {
        const API_KEY = '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS';
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            console.log('✅ JsonBin mis à jour automatiquement');
        }
    } catch (error) {
        console.log('⚠️ Sync JsonBin échouée (continuera d\'essayer)');
    }
}

// ===== LIEN LIVE =====

async function generateLiveLink() {
    try {
        await autoSave();
        
        const API_KEY = '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS';
        const BASE_URL = 'https://api.jsonbin.io/v3/b';
        
        let binId = localStorage.getItem('matchBinId');
        
        const config = getMatchConfig();
        const players = getMyTeamPlayers();
        
        const liveData = {
            matchInfo: {
                teamName: config.teamName || 'Mon Équipe',
                opponentName: config.opponentName || 'Équipe Adverse',
                venue: config.venue || 'Terrain',
                date: new Date().toISOString().split('T')[0],
                startTime: config.startTime || '15:00'
            },
            timer: {
                ...matchTimer,
                startTime: matchTimer.startTime ? new Date(matchTimer.startTime).toISOString() : null,
                savedAt: new Date().toISOString(),
                currentTime: getCurrentMatchTime(),
                isRunning: matchTimer.isRunning,
                currentHalf: matchTimer.currentHalf,
                pausedTime: matchTimer.pausedTime
            },
            players: players.map(player => ({
                id: player.id,
                name: player.name,
                position: player.position,
                status: player.status || 'bench',
                number: player.number || null
            })),
            events: matchEvents.map(event => ({
                ...event,
                playerName: getPlayerName(event.playerId),
                formattedDescription: getEventDescription(event)
            })),
            stats: {
                ...matchStats,
                score: {
                    myTeam: matchStats.myTeam.goals,
                    opponent: matchStats.opponent.goals
                }
            },
            live: {
                lastUpdate: new Date().toISOString(),
                isActive: true,
                version: '1.0'
            }
        };
        
        if (binId) {
            const response = await fetch(`${BASE_URL}/${binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(liveData)
            });
            
            if (!response.ok) {
                throw new Error('Erreur mise à jour JsonBin');
            }
        } else {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY,
                    'X-Bin-Private': 'false'
                },
                body: JSON.stringify(liveData)
            });
            
            if (!response.ok) {
                throw new Error('Erreur création JsonBin');
            }
            
            const result = await response.json();
            binId = result.metadata.id;
            localStorage.setItem('matchBinId', binId);
        }
        
        const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
        const liveUrl = `${baseUrl}live.html?bin=${binId}`;
        
        try {
            await navigator.clipboard.writeText(liveUrl);
            alert(`📱 Lien Live copié !\n\nPartagez ce lien pour suivre le match en direct:\n\n${liveUrl}`);
        } catch (err) {
            prompt('📱 Copiez ce lien Live:', liveUrl);
        }
        
    } catch (error) {
        console.error('Erreur génération lien live:', error);
        alert('❌ Erreur lors de la génération du lien live.\nVérifiez votre connexion internet.');
    }
}

// ===== RESET =====

function resetMatchPageDisplay() {
    document.getElementById('teamScore').textContent = '0';
    document.getElementById('opponentScore').textContent = '0';
    document.getElementById('matchTime').textContent = '00:00';
    document.getElementById('matchHalf').textContent = '1ère Mi-temps';
    document.getElementById('eventsTimeline').innerHTML = '<div style="text-align: center; padding: 20px; color: #bbb;">Aucun événement enregistré</div>';
    
    const statElements = ['compactTeamGoals', 'compactOpponentGoals', 
                          'compactTeamShotsOnTarget', 'compactOpponentShotsOnTarget',
                          'compactTeamShotsOffTarget', 'compactOpponentShotsOffTarget',
                          'compactTeamCards', 'compactOpponentCards', 
                          'compactTeamFouls', 'compactOpponentFouls',
                          'compactTeamSaves', 'compactOpponentSaves'];
    statElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '0';
    });

    matchEvents = [];
    matchStats = {
        myTeam: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 },
        opponent: { goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, cards: 0, fouls: 0, saves: 0 }
    };
}

function newMatchFromMatchPage() {
    if (confirm('🆕 Créer un nouveau match ?\n\n⚠️ Le match actuel sera perdu !')) {
        waitForFootballApp(function() {
            if (typeof footballApp !== 'undefined' && footballApp.startNewMatch) {
                footballApp.startNewMatch();
            }
            
            resetMatchPageDisplay();
            
            if (matchTimer.interval) {
                clearInterval(matchTimer.interval);
            }
            matchTimer = {
                startTime: null,
                pausedTime: 0,
                isRunning: false,
                currentHalf: 1,
                interval: null
            };
            
            const playBtn = document.getElementById('playBtn');
            if (playBtn) {
                playBtn.innerHTML = '▶️ Démarrer';
                playBtn.className = 'btn btn-success';
                playBtn.disabled = false;
            }
            
            const resetBtn = document.querySelector('button[onclick="resetTimer()"]');
            if (resetBtn) resetBtn.disabled = false;
            
            updateHalfTimeButton();
            
            localStorage.removeItem('matchBinId');
            
            alert('🆕 Nouveau match créé !');
        });
    }
}

function resetAllFromMatchPage() {
    if (confirm('🔄 Reset complet ?\n\n⚠️ TOUTES les données seront perdues !')) {
        waitForFootballApp(function() {
            if (typeof footballApp !== 'undefined' && footballApp.resetCompleteApp) {
                footballApp.resetCompleteApp();
            } else {
                localStorage.clear();
            }
            
            resetMatchPageDisplay();
            alert('🔄 Reset complet effectué !');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
}

// ===== NETTOYAGE =====

window.addEventListener('beforeunload', function() {
    if (matchTimer.interval) {
        clearInterval(matchTimer.interval);
    }
    autoSave();
});

window.addEventListener('pagehide', function() {
    if (matchTimer.interval) {
        clearInterval(matchTimer.interval);
    }
});

// ===== FONCTIONS UTILITAIRES =====

function updateTimelineDisplay() {
    updateTimeline();
}

window.matchPageFunctions = {
    getCurrentTime: getCurrentMatchTime,
    updateTimeline: updateTimelineDisplay,
    getPlayers: getMyTeamPlayers,
    autoSave: autoSave
};

// ===== FONCTIONS UI (À AJOUTER À LA FIN DE match.js) =====

/**
 * Toggle timer (appelé depuis HTML)
 */
function toggleTimer() {
    const state = matchState;
    const playBtn = document.getElementById('playBtn');
    
    if (state.isPlaying) {
        stopMatchTimer();
        if (playBtn) {
            playBtn.innerHTML = '▶️ Démarrer';
            playBtn.classList.remove('btn-danger');
            playBtn.classList.add('btn-success');
        }
    } else {
        startMatchTimer();
        if (playBtn) {
            playBtn.innerHTML = '⏸️ Pause';
            playBtn.classList.remove('btn-success');
            playBtn.classList.add('btn-danger');
        }
    }
}

/**
 * Reset timer (appelé depuis HTML)
 */
function resetTimer() {
    if (confirm('Réinitialiser le chronomètre ?')) {
        resetMatchTimer();
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.innerHTML = '▶️ Démarrer';
            playBtn.classList.remove('btn-danger');
            playBtn.classList.add('btn-success');
        }
    }
}

/**
 * Confirmation mi-temps (appelé depuis HTML)
 */
function showHalfTimeConfirm() {
    if (matchState.currentHalf === 2) {
        alert('Le match est déjà en seconde mi-temps');
        return;
    }
    if (confirm('Passer à la seconde mi-temps ?')) {
        switchToSecondHalf();
    }
}

// ===== EXPOSITION GLOBALE =====

window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.showHalfTimeConfirm = showHalfTimeConfirm;
window.generateLiveLink = generateLiveLink;
window.newMatchFromMatchPage = newMatchFromMatchPage;
window.resetAllFromMatchPage = resetAllFromMatchPage;
window.openEditActionTypeModal = openEditActionTypeModal;
window.closeEditActionTypeModal = closeEditActionTypeModal;
window.selectNewActionType = selectNewActionType;
window.deleteActionFromModal = deleteActionFromModal;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.showHalfTimeConfirm = showHalfTimeConfirm;


console.log('✅ match.js chargé');