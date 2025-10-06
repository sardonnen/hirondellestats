// live_data.js - Module de récupération et affichage des données live
// VERSION MINIMALE - Correction uniquement des bugs JS

// ===== CONFIGURATION =====

const LIVE_JSONBIN_CONFIG = {
    API_KEY: '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS',
    API_BASE_URL: 'https://api.jsonbin.io/v3/b',
    REFRESH_INTERVAL: 10000 // 10 secondes
};

// ===== VARIABLES GLOBALES =====

let liveCurrentMatchData = null;
let liveRefreshIntervalId = null;

// ===== FONCTIONS DE BASE =====

/**
 * Extraire le binId de l'URL
 */
function getLiveBinId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('bin') || urlParams.get('live');
}

/**
 * Récupérer les données depuis JsonBin
 */
async function fetchLiveMatchData(binId) {
    if (!binId) {
        throw new Error('BinId manquant');
    }
    
    try {
        const response = await fetch(`${LIVE_JSONBIN_CONFIG.API_BASE_URL}/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': LIVE_JSONBIN_CONFIG.API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        
        const result = await response.json();
        return result.record;
        
    } catch (error) {
        console.error('❌ Erreur récupération:', error);
        throw error;
    }
}

/**
 * Charger et afficher les données
 */
async function loadLiveMatch() {
    const binId = getLiveBinId();
    
    if (!binId) {
        console.log('ℹ️ Aucun binId - Mode normal');
        return;
    }
    
    try {
        const matchData = await fetchLiveMatchData(binId);
        liveCurrentMatchData = matchData;
        
        // Mettre à jour l'affichage
        updateLiveDisplay(matchData);
        
    } catch (error) {
        console.error('❌ Erreur chargement live:', error);
    }
}

/**
 * Mettre à jour l'affichage
 */
function updateLiveDisplay(matchData) {
    if (!matchData) return;
    
    // Mettre à jour le timer et le score
    updateLiveTimer(matchData);
    updateLiveScore(matchData);
    updateLiveEvents(matchData);
    updateLiveStats(matchData);
}

/**
 * Mettre à jour le timer
 */
function updateLiveTimer(matchData) {
    const timeEl = document.getElementById('liveTime') || document.getElementById('matchTime');
    const halfEl = document.getElementById('liveHalf') || document.getElementById('matchHalf');
    
    if (timeEl && matchData.timer?.currentTime) {
        timeEl.textContent = matchData.timer.currentTime;
    }
    
    if (halfEl && matchData.timer?.currentHalf) {
        halfEl.textContent = matchData.timer.currentHalf === 1 ? '1ère Mi-temps' : '2ème Mi-temps';
    }
}

/**
 * Mettre à jour le score
 */
function updateLiveScore(matchData) {
    const teamScoreEl = document.getElementById('liveTeamScore') || document.getElementById('teamScore');
    const opponentScoreEl = document.getElementById('liveOpponentScore') || document.getElementById('opponentScore');
    
    if (teamScoreEl && matchData.stats?.score?.myTeam !== undefined) {
        teamScoreEl.textContent = matchData.stats.score.myTeam;
    }
    
    if (opponentScoreEl && matchData.stats?.score?.opponent !== undefined) {
        opponentScoreEl.textContent = matchData.stats.score.opponent;
    }
}

/**
 * Mettre à jour les événements
 */
function updateLiveEvents(matchData) {
    const eventsContainer = document.getElementById('eventsTimeline');
    if (!eventsContainer || !matchData.events) return;
    
    // Garder l'affichage existant si la page a déjà son propre système
    // Cette fonction ne fait rien si un système d'affichage existe déjà
}

/**
 * Mettre à jour les stats
 */
function updateLiveStats(matchData) {
    if (!matchData.stats) return;
    
    // Mettre à jour les stats si les éléments existent
    const statsMapping = {
        'compactTeamGoals': matchData.stats.myTeam?.goals || 0,
        'compactOpponentGoals': matchData.stats.opponent?.goals || 0,
        'compactTeamShots': matchData.stats.myTeam?.shots || 0,
        'compactOpponentShots': matchData.stats.opponent?.shots || 0,
        'compactTeamCards': matchData.stats.myTeam?.cards || 0,
        'compactOpponentCards': matchData.stats.opponent?.cards || 0,
        'compactTeamFouls': matchData.stats.myTeam?.fouls || 0,
        'compactOpponentFouls': matchData.stats.opponent?.fouls || 0,
        'compactTeamSaves': matchData.stats.myTeam?.saves || 0,
        'compactOpponentSaves': matchData.stats.opponent?.saves || 0
    };
    
    Object.entries(statsMapping).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

/**
 * Démarrer le rafraîchissement automatique
 */
function startLiveAutoRefresh() {
    const binId = getLiveBinId();
    if (!binId) return;
    
    console.log('🔄 Rafraîchissement automatique activé (10s)');
    
    liveRefreshIntervalId = setInterval(async () => {
        await loadLiveMatch();
    }, LIVE_JSONBIN_CONFIG.REFRESH_INTERVAL);
}

/**
 * Arrêter le rafraîchissement
 */
function stopLiveAutoRefresh() {
    if (liveRefreshIntervalId) {
        clearInterval(liveRefreshIntervalId);
        liveRefreshIntervalId = null;
    }
}

// ===== INITIALISATION =====

/**
 * Initialiser le mode live
 */
function initLiveMode() {
    const binId = getLiveBinId();
    
    if (binId) {
        console.log('📺 Mode LIVE détecté');
        loadLiveMatch();
        startLiveAutoRefresh();
    }
}

// Initialisation au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiveMode);
} else {
    initLiveMode();
}

// Nettoyage
window.addEventListener('beforeunload', stopLiveAutoRefresh);

// Export minimal
window.liveDataModule = {
    loadLiveMatch,
    getLiveBinId,
    getCurrentData: () => liveCurrentMatchData
};

console.log('✅ Module live_data.js chargé ');