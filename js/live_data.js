// live_data.js - Module de récupération et affichage des données live

// ===== CONFIGURATION =====

const LIVE_JSONBIN_CONFIG = {
    API_KEY: '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS',
    API_BASE_URL: 'https://api.jsonbin.io/v3/b',
    REFRESH_INTERVAL: 10000
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
        console.log(`🔄 Récupération bin: ${binId}`);
        
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
        console.log('✅ Données reçues');
        return result.record;
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
}

/**
 * Charger et afficher les données
 */
async function loadLiveMatch() {
    const binId = getLiveBinId();
    
    if (!binId) {
        console.log('ℹ️ Aucun binId');
        return;
    }
    
    try {
        const matchData = await fetchLiveMatchData(binId);
        liveCurrentMatchData = matchData;
        
        console.log('📊 Mise à jour affichage...');
        
        // MISE À JOUR DE L'AFFICHAGE
        updateLiveDisplay(matchData);
        
        console.log('✅ Affichage mis à jour');
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showLiveError(error.message);
    }
}

/**
 * Mettre à jour tout l'affichage
 */
function updateLiveDisplay(matchData) {
    if (!matchData) {
        console.error('❌ Pas de données à afficher');
        return;
    }
    
    console.log('🎯 updateLiveDisplay appelée avec:', {
        timer: matchData.timer?.currentTime,
        score: `${matchData.stats?.score?.myTeam} - ${matchData.stats?.score?.opponent}`,
        events: matchData.events?.length
    });
    
    // Mettre à jour chaque partie
    updateLiveTimer(matchData);
    updateLiveScore(matchData);
    updateLiveStats(matchData);
    updateLiveTimeline(matchData);
    
    // Supprimer le message "Chargement..."
    hideLoadingMessage();
}

/**
 * Mettre à jour le timer
 */
function updateLiveTimer(matchData) {
    // Essayer tous les IDs possibles pour le timer
    const timeIds = ['liveTime', 'matchTime'];
    const halfIds = ['liveHalf', 'matchHalf'];
    
    timeIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && matchData.timer?.currentTime) {
            el.textContent = matchData.timer.currentTime;
            console.log(`✅ Timer mis à jour (${id}): ${matchData.timer.currentTime}`);
        }
    });
    
    halfIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && matchData.timer?.currentHalf) {
            el.textContent = matchData.timer.currentHalf === 1 ? '1ère Mi-temps' : '2ème Mi-temps';
            console.log(`✅ Mi-temps mise à jour (${id})`);
        }
    });
}

/**
 * Mettre à jour le score
 */
function updateLiveScore(matchData) {
    const teamScoreIds = ['liveTeamScore', 'teamScore'];
    const opponentScoreIds = ['liveOpponentScore', 'opponentScore'];
    
    teamScoreIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && matchData.stats?.score?.myTeam !== undefined) {
            el.textContent = matchData.stats.score.myTeam;
            console.log(`✅ Score équipe mis à jour (${id}): ${matchData.stats.score.myTeam}`);
        }
    });
    
    opponentScoreIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && matchData.stats?.score?.opponent !== undefined) {
            el.textContent = matchData.stats.score.opponent;
            console.log(`✅ Score adversaire mis à jour (${id}): ${matchData.stats.score.opponent}`);
        }
    });
}

/**
 * Mettre à jour les stats
 */
function updateLiveStats(matchData) {
    if (!matchData.stats) return;
    
    const statsMapping = {
        'compactTeamGoals': matchData.stats.myTeam?.goals || matchData.stats.score?.myTeam || 0,
        'compactOpponentGoals': matchData.stats.opponent?.goals || matchData.stats.score?.opponent || 0,
        'compactTeamShots': matchData.stats.myTeam?.shots || 0,
        'compactOpponentShots': matchData.stats.opponent?.shots || 0,
        'compactTeamCards': matchData.stats.myTeam?.cards || 0,
        'compactOpponentCards': matchData.stats.opponent?.cards || 0,
        'compactTeamFouls': matchData.stats.myTeam?.fouls || 0,
        'compactOpponentFouls': matchData.stats.opponent?.fouls || 0,
        'compactTeamSaves': matchData.stats.myTeam?.saves || 0,
        'compactOpponentSaves': matchData.stats.opponent?.saves || 0,
        'compactTeamFreeKicks': matchData.stats.myTeam?.freeKicks || 0,
        'compactOpponentFreeKicks': matchData.stats.opponent?.freeKicks || 0
    };
    
    Object.entries(statsMapping).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    console.log('✅ Stats mises à jour');
}

/**
 * Mettre à jour la timeline
 */
function updateLiveTimeline(matchData) {
    const container = document.getElementById('eventsTimeline');
    if (!container || !matchData.events) {
        console.log('⚠️ Container timeline non trouvé ou pas d\'événements');
        return;
    }
    
    console.log(`📋 Mise à jour timeline: ${matchData.events.length} événements`);
    
    // Si le container a déjà du contenu complexe, ne rien faire
    // Sinon, afficher un message simple
    if (container.innerHTML.includes('Chargement')) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                ✅ ${matchData.events.length} événements dans ce match
            </div>
        `;
    }
}

/**
 * Cacher le message de chargement
 */
function hideLoadingMessage() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        // Chercher et supprimer le message "Chargement..."
        const loadingDivs = mainContent.querySelectorAll('div');
        loadingDivs.forEach(div => {
            if (div.textContent.includes('Chargement des données')) {
                div.remove();
                console.log('✅ Message de chargement supprimé');
            }
        });
    }
}

/**
 * Afficher une erreur
 */
function showLiveError(message) {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="team-card">
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <h2>❌ Erreur de chargement</h2>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">🔄 Réessayer</button>
                </div>
            </div>
        `;
    }
}

/**
 * Démarrer le rafraîchissement automatique
 */
function startLiveAutoRefresh() {
    const binId = getLiveBinId();
    if (!binId) return;
    
    console.log('🔄 Rafraîchissement automatique activé (10s)');
    
    liveRefreshIntervalId = setInterval(async () => {
        console.log('🔄 Rafraîchissement...');
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
        console.log('⏹️ Rafraîchissement arrêté');
    }
}

// ===== INITIALISATION =====

/**
 * Initialiser le mode live
 */
async function initLiveMode() {
    const binId = getLiveBinId();
    
    if (!binId) {
        console.log('ℹ️ Pas de binId - mode normal');
        return;
    }
    
    console.log('📺 Mode LIVE détecté');
    
    // Charger immédiatement les données
    await loadLiveMatch();
    
    // Puis démarrer le rafraîchissement automatique
    startLiveAutoRefresh();
}

// Initialisation au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiveMode);
} else {
    // Si le DOM est déjà chargé, initialiser immédiatement
    initLiveMode();
}

// Nettoyage
window.addEventListener('beforeunload', stopLiveAutoRefresh);

// Export
window.liveDataModule = {
    loadLiveMatch,
    getLiveBinId,
    getCurrentData: () => liveCurrentMatchData,
    refresh: loadLiveMatch
};

console.log('✅ Module live_data.js chargé');