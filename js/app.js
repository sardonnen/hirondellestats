// js/app.js - Logique principale de l'application

// Variables globales
let players = [];
let currentMatch = {};
let gameSettings = { duration: 45, halfTime: 1 };
let stats = {
    team1: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 },
    team2: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 }
};
let events = [];
let playerStats = {};
let timer = { minutes: 0, seconds: 0, isRunning: false, interval: null };

// Variables pour les actions
let currentActionType = null;
let currentActionTeam = null;
let selectedPlayerId = null;
let selectedCardType = null;

// Initialisation de l'application
function initializeApp() {
    console.log('Initialisation de l\'application...');
    
    // Vérifier si on est en mode live
    const urlParams = new URLSearchParams(window.location.search);
    const liveId = urlParams.get('live');
    
    if (liveId) {
        showPage('live');
        initializeLiveView(liveId);
        return;
    }
    
    // Charger les données sauvegardées
    loadData();
    
    // Mettre à jour l'affichage
    updateDisplay();
    updatePlayersDisplay();
    updateStatsDisplay();
    
    console.log('Application initialisée');
}

// Gestion des pages
function showPage(pageId) {
    // Cacher toutes les pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Afficher la page demandée
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Actions spécifiques par page
        switch(pageId) {
            case 'match':
                updateMatchDisplay();
                break;
            case 'stats':
                updateStatsDisplay();
                break;
            case 'live':
                updateLiveDisplay();
                break;
        }
    }
}

// Gestion des joueuses
function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const position = document.getElementById('playerPosition').value;
    
    if (!name) {
        showNotification('Veuillez entrer un nom', 'error');
        return;
    }
    
    const player = {
        id: Date.now(),
        name: name,
        position: position,
        status: 'bench' // bench, field, out
    };
    
    players.push(player);
    playerStats[player.id] = { 
        goals: 0, 
        assists: 0, 
        shots: 0, 
        fouls: 0,
        cards: [],
        saves: 0 
    };
    
    document.getElementById('playerName').value = '';
    updatePlayersDisplay();
    saveData();
    showNotification('Joueuse ajoutée !', 'success');
}

function removePlayer(playerId) {
    if (confirm('Supprimer cette joueuse ?')) {
        players = players.filter(p => p.id !== playerId);
        delete playerStats[playerId];
        updatePlayersDisplay();
        saveData();
        showNotification('Joueuse supprimée', 'info');
    }
}

function updatePlayersDisplay() {
    const container = document.getElementById('playersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (players.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #bdc3c7;">Aucune joueuse ajoutée</p>';
        return;
    }
    
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = `
            <div class="player-info">
                <span class="position-badge position-${player.position}">
                    ${getPositionIcon(player.position)}
                </span>
                <strong>${player.name}</strong>
                <span style="color: #bdc3c7;">(${player.position})</span>
            </div>
            <button class="btn btn-small" onclick="removePlayer(${player.id})" style="background: #e74c3c;">
                🗑️
            </button>
        `;
        container.appendChild(div);
    });
}

function getPositionIcon(position) {
    const icons = {
        'gardienne': '🥅',
        'defenseure': '🛡️',
        'milieu': '⚡',
        'attaquante': '⚽'
    };
    return icons[position] || '⚽';
}

// Gestion du match
function startNewMatch() {
    if (players.length === 0) {
        showNotification('Ajoutez des joueuses avant de commencer', 'error');
        return;
    }
    
    const duration = parseInt(document.getElementById('duration').value) || 45;
    gameSettings.duration = duration;
    gameSettings.halfTime = 1;
    
    currentMatch = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        team1: document.getElementById('team1Name').value || 'Mon Équipe',
        team2: document.getElementById('team2Name').value || 'Équipe Adverse',
        venue: document.getElementById('venue').value || 'Terrain'
    };
    
    // Reset timer et stats
    resetTimer();
    resetStats();
    
    // Tous les joueurs commencent sur le banc
    players.forEach(player => {
        player.status = 'bench';
    });
    
    addEvent('🏁', 'Début du match', 'Arbitre');
    showNotification('Nouveau match commencé !', 'success');
    showPage('match');
    saveData();
}

function resetStats() {
    stats = {
        team1: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 },
        team2: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 }
    };
    events = [];
    
    // Reset des stats joueurs
    Object.keys(playerStats).forEach(playerId => {
        playerStats[playerId] = { 
            goals: 0, 
            assists: 0, 
            shots: 0, 
            fouls: 0,
            cards: [],
            saves: 0 
        };
    });
}

function showConfirmReset() {
    document.getElementById('confirmResetModal').style.display = 'block';
}

function confirmReset() {
    // Reset complet
    players = [];
    stats = {
        team1: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 },
        team2: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 }
    };
    events = [];
    timer = { minutes: 0, seconds: 0, isRunning: false, interval: null };
    gameSettings = { duration: 45, halfTime: 1 };
    playerStats = {};
    currentMatch = {};
    
    // Clear localStorage
    localStorage.removeItem('footballStats_data');
    
    updatePlayersDisplay();
    updateDisplay();
    updateStatsDisplay();
    updateTimerDisplay();
    
    closeModal('confirmResetModal');
    showNotification('Données réinitialisées !', 'success');
}

// Gestion du timer
function toggleTimer() {
    if (timer.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (!timer.interval) {
        timer.interval = setInterval(() => {
            timer.seconds++;
            if (timer.seconds >= 60) {
                timer.minutes++;
                timer.seconds = 0;
            }
            updateTimerDisplay();
            saveData();
        }, 1000);
    }
    timer.isRunning = true;
    updateTimerDisplay();
}

function pauseTimer() {
    timer.isRunning = false;
    updateTimerDisplay();
}

function resetTimer() {
    if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
    }
    timer.minutes = 0;
    timer.seconds = 0;
    timer.isRunning = false;
    updateTimerDisplay();
    saveData();
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        const minutes = String(timer.minutes).padStart(2, '0');
        const seconds = String(timer.seconds).padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;
        
        // Mettre à jour le bouton play/pause
        const toggleBtn = timerEl.parentElement?.querySelector('button');
        if (toggleBtn) {
            toggleBtn.textContent = timer.isRunning ? '⏸️' : '▶️';
        }
    }
}

// Gestion des événements
function addEvent(icon, description, player, team = null) {
    const event = {
        id: Date.now(),
        time: `${String(timer.minutes).padStart(2, '0')}:${String(timer.seconds).padStart(2, '0')}`,
        icon: icon,
        description: description,
        player: player,
        team: team,
        timestamp: new Date().toISOString()
    };
    
    events.unshift(event); // Ajouter au début
    updateTimelineDisplay();
    saveData();
    
    // Mettre à jour le live si activé
    if (currentMatch.liveId) {
        updateLiveData();
    }
}

function updateTimelineDisplay() {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;
    
    timeline.innerHTML = '<h3>⏱️ Chronologie du match</h3>';
    
    if (events.length === 0) {
        timeline.innerHTML += '<p style="text-align: center; color: #bdc3c7;">Aucun événement</p>';
        return;
    }
    
    events.forEach(event => {
        const div = document.createElement('div');
        div.className = `timeline-event ${event.team ? event.team + '-event' : ''}`;
        div.innerHTML = `
            <strong>${event.time}</strong> ${event.icon} 
            <strong>${event.player}</strong> - ${event.description}
        `;
        timeline.appendChild(div);
    });
}

// Mise à jour de l'affichage
function updateDisplay() {
    updateMatchDisplay();
    updateTimelineDisplay();
    updateTimerDisplay();
}

function updateMatchDisplay() {
    // Mettre à jour les noms d'équipes
    const team1Display = document.getElementById('team1Display');
    const team2Display = document.getElementById('team2Display');
    
    if (team1Display && currentMatch.team1) {
        team1Display.textContent = currentMatch.team1;
    }
    if (team2Display && currentMatch.team2) {
        team2Display.textContent = currentMatch.team2;
    }
    
    // Mettre à jour les scores
    const team1Score = document.getElementById('team1Score');
    const team2Score = document.getElementById('team2Score');
    
    if (team1Score) team1Score.textContent = stats.team1.goals;
    if (team2Score) team2Score.textContent = stats.team2.goals;
}

function updateStatsDisplay() {
    const container = document.getElementById('statsGrid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-card">
            <h3>${currentMatch.team1 || 'Mon Équipe'}</h3>
            <div class="stat-item">
                <span>Buts</span>
                <span class="stat-value">${stats.team1.goals}</span>
            </div>
            <div class="stat-item">
                <span>Tirs</span>
                <span class="stat-value">${stats.team1.shots}</span>
            </div>
            <div class="stat-item">
                <span>Fautes</span>
                <span class="stat-value">${stats.team1.fouls}</span>
            </div>
            <div class="stat-item">
                <span>Cartons jaunes</span>
                <span class="stat-value">${stats.team1.yellowCards}</span>
            </div>
            <div class="stat-item">
                <span>Cartons rouges</span>
                <span class="stat-value">${stats.team1.redCards}</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentMatch.team2 || 'Équipe Adverse'}</h3>
            <div class="stat-item">
                <span>Buts</span>
                <span class="stat-value">${stats.team2.goals}</span>
            </div>
            <div class="stat-item">
                <span>Tirs</span>
                <span class="stat-value">${stats.team2.shots}</span>
            </div>
            <div class="stat-item">
                <span>Fautes</span>
                <span class="stat-value">${stats.team2.fouls}</span>
            </div>
            <div class="stat-item">
                <span>Cartons jaunes</span>
                <span class="stat-value">${stats.team2.yellowCards}</span>
            </div>
            <div class="stat-item">
                <span>Cartons rouges</span>
                <span class="stat-value">${stats.team2.redCards}</span>
            </div>
        </div>
    `;
}

// Gestion des modales
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset des sélections
    selectedPlayerId = null;
    selectedCardType = null;
    currentActionType = null;
    currentActionTeam = null;
}

// Notifications
function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Couleur selon le type
    switch(type) {
        case 'success':
            notification.style.background = '#2ecc71';
            break;
        case 'error':
            notification.style.background = '#e74c3c';
            break;
        case 'warning':
            notification.style.background = '#f39c12';
            break;
        default:
            notification.style.background = '#3498db';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Sauvegarde et chargement
function saveData() {
    const data = {
        players,
        currentMatch,
        gameSettings,
        stats,
        events,
        playerStats,
        timer: {
            minutes: timer.minutes,
            seconds: timer.seconds,
            isRunning: timer.isRunning
        },
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('footballStats_data', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('footballStats_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            players = data.players || [];
            currentMatch = data.currentMatch || {};
            gameSettings = data.gameSettings || { duration: 45, halfTime: 1 };
            stats = data.stats || {
                team1: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 },
                team2: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 }
            };
            events = data.events || [];
            playerStats = data.playerStats || {};
            
            if (data.timer) {
                timer.minutes = data.timer.minutes || 0;
                timer.seconds = data.timer.seconds || 0;
                timer.isRunning = false; // Ne pas reprendre automatiquement
            }
            
            console.log('Données chargées depuis localStorage');
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }
}

// Événements au clic sur les modales (fermer en cliquant à l'extérieur)
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// CSS pour l'animation des notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);