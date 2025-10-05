// live_data.js - Module de récupération des données live depuis JsonBin.io

/**
 * Configuration de l'API JsonBin.io
 */
const JSONBIN_CONFIG = {
    API_KEY: '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS',
    API_BASE_URL: 'https://api.jsonbin.io/v3/b'
};

/**
 * Extraire le binId depuis l'URL
 * @returns {string|null} Le binId ou null si non trouvé
 */
function getBinIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const binId = urlParams.get('bin') || urlParams.get('live');
    
    if (binId) {
        console.log(`📍 BinId trouvé dans l'URL: ${binId}`);
        return binId;
    }
    
    console.log('ℹ️ Aucun binId dans l\'URL');
    return null;
}

/**
 * Récupérer les données de match depuis JsonBin.io
 * @param {string} binId - L'identifiant du bin JsonBin.io
 * @returns {Promise<Object>} Les données du match
 */
async function fetchMatchData(binId) {
    if (!binId) {
        throw new Error('BinId manquant');
    }
    
    try {
        console.log(`🔄 Récupération des données du bin: ${binId}`);
        
        const response = await fetch(`${JSONBIN_CONFIG.API_BASE_URL}/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur API JsonBin: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        const matchData = result.record;
        
        console.log('✅ Données récupérées avec succès:', matchData);
        return matchData;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
        throw error;
    }
}

/**
 * Récupération automatique des données au chargement de la page
 * @returns {Promise<Object|null>} Les données du match ou null
 */
async function autoLoadMatchData() {
    const binId = getBinIdFromUrl();
    
    if (!binId) {
        console.log('ℹ️ Mode normal (pas de binId dans l\'URL)');
        return null;
    }
    
    try {
        const matchData = await fetchMatchData(binId);
        console.log('🎯 Données de match chargées automatiquement');
        return matchData;
    } catch (error) {
        console.error('⚠️ Impossible de charger les données live');
        return null;
    }
}

/**
 * Sauvegarder les données récupérées en local
 * @param {Object} matchData - Les données du match
 */
function saveMatchDataLocally(matchData) {
    if (!matchData) return;
    
    try {
        // Sauvegarder dans localStorage pour utilisation locale
        localStorage.setItem('liveMatchData', JSON.stringify(matchData));
        console.log('💾 Données sauvegardées localement');
    } catch (error) {
        console.error('❌ Erreur sauvegarde locale:', error);
    }
}

/**
 * Récupérer les données sauvegardées en local
 * @returns {Object|null} Les données du match ou null
 */
function getLocalMatchData() {
    try {
        const data = localStorage.getItem('liveMatchData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('❌ Erreur lecture données locales:', error);
        return null;
    }
}

/**
 * Polling automatique pour rafraîchir les données
 * @param {string} binId - L'identifiant du bin
 * @param {number} interval - Intervalle en millisecondes (défaut: 5000ms = 5s)
 * @param {Function} callback - Fonction appelée à chaque mise à jour
 * @returns {number} L'ID de l'intervalle (pour pouvoir l'arrêter)
 */
function startAutoRefresh(binId, interval = 5000, callback = null) {
    console.log(`🔄 Démarrage du rafraîchissement automatique (${interval}ms)`);
    
    const intervalId = setInterval(async () => {
        try {
            const matchData = await fetchMatchData(binId);
            
            // Sauvegarder localement
            saveMatchDataLocally(matchData);
            
            // Appeler le callback si fourni
            if (callback && typeof callback === 'function') {
                callback(matchData);
            }
            
            // Déclencher un événement personnalisé pour notification
            const event = new CustomEvent('matchDataUpdated', { detail: matchData });
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error('⚠️ Erreur lors du rafraîchissement:', error);
        }
    }, interval);
    
    return intervalId;
}

/**
 * Arrêter le rafraîchissement automatique
 * @param {number} intervalId - L'ID de l'intervalle à arrêter
 */
function stopAutoRefresh(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
        console.log('⏹️ Rafraîchissement automatique arrêté');
    }
}

/**
 * Obtenir un résumé des données de match
 * @param {Object} matchData - Les données du match
 * @returns {Object} Résumé des données principales
 */
function getMatchSummary(matchData) {
    if (!matchData) return null;
    
    return {
        // Informations générales
        matchInfo: {
            teamName: matchData.matchInfo?.teamName || 'Mon Équipe',
            opponentName: matchData.matchInfo?.opponentName || 'Équipe Adverse',
            date: matchData.matchInfo?.date || 'N/A'
        },
        
        // Score
        score: {
            team: matchData.stats?.score?.myTeam || 0,
            opponent: matchData.stats?.score?.opponent || 0
        },
        
        // Timer
        timer: {
            currentTime: matchData.timer?.currentTime || '00:00',
            isRunning: matchData.timer?.isRunning || false,
            currentHalf: matchData.timer?.currentHalf || 1
        },
        
        // Statistiques
        stats: {
            eventsCount: matchData.events?.length || 0,
            playersCount: matchData.players?.length || 0
        },
        
        // Dernière mise à jour
        lastUpdate: matchData.live?.lastUpdate || 'N/A'
    };
}

/**
 * Exporter les données au format JSON téléchargeable
 * @param {Object} matchData - Les données du match
 * @param {string} filename - Nom du fichier (optionnel)
 */
function exportMatchDataAsJSON(matchData, filename = null) {
    if (!matchData) {
        console.error('❌ Aucune donnée à exporter');
        return;
    }
    
    const defaultFilename = `match_${new Date().toISOString().split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;
    
    const dataStr = JSON.stringify(matchData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log(`✅ Données exportées: ${finalFilename}`);
}

/**
 * Afficher les stats dans la console de manière formatée
 * @param {Object} matchData - Les données du match
 */
function displayMatchStats(matchData) {
    if (!matchData) {
        console.log('❌ Aucune donnée de match disponible');
        return;
    }
    
    const summary = getMatchSummary(matchData);
    
    console.log('═══════════════════════════════════════');
    console.log('📊 STATISTIQUES DU MATCH');
    console.log('═══════════════════════════════════════');
    console.log(`🏆 ${summary.matchInfo.teamName} vs ${summary.matchInfo.opponentName}`);
    console.log(`📅 Date: ${summary.matchInfo.date}`);
    console.log('───────────────────────────────────────');
    console.log(`⚽ Score: ${summary.score.team} - ${summary.score.opponent}`);
    console.log(`⏱️ Temps: ${summary.timer.currentTime} (${summary.timer.currentHalf}ère mi-temps)`);
    console.log(`${summary.timer.isRunning ? '▶️ En cours' : '⏸️ En pause'}`);
    console.log('───────────────────────────────────────');
    console.log(`📋 Événements: ${summary.stats.eventsCount}`);
    console.log(`👥 Joueurs: ${summary.stats.playersCount}`);
    console.log(`🔄 Dernière MàJ: ${new Date(summary.lastUpdate).toLocaleString('fr-FR')}`);
    console.log('═══════════════════════════════════════');
}

// ===== INITIALISATION AUTOMATIQUE =====

let autoRefreshInterval = null;

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Module live_data.js initialisé');
    
    const binId = getBinIdFromUrl();
    
    if (binId) {
        try {
            // Chargement initial
            const matchData = await fetchMatchData(binId);
            
            if (matchData) {
                saveMatchDataLocally(matchData);
                displayMatchStats(matchData);
                
                // Démarrer le rafraîchissement automatique (toutes les 10 secondes)
                autoRefreshInterval = startAutoRefresh(binId, 10000, (data) => {
                    console.log('🔄 Données mises à jour automatiquement');
                    
                    // Vous pouvez ajouter ici du code pour mettre à jour l'interface
                    // Par exemple: updateLiveDisplay(data);
                });
                
                console.log('✅ Mode LIVE activé - Rafraîchissement automatique en cours');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement initial:', error);
        }
    }
});

// Nettoyer lors de la fermeture
window.addEventListener('beforeunload', function() {
    if (autoRefreshInterval) {
        stopAutoRefresh(autoRefreshInterval);
    }
});

// ===== EXPORT DES FONCTIONS =====

window.liveDataModule = {
    // Récupération de données
    getBinIdFromUrl,
    fetchMatchData,
    autoLoadMatchData,
    
    // Gestion locale
    saveMatchDataLocally,
    getLocalMatchData,
    
    // Rafraîchissement automatique
    startAutoRefresh,
    stopAutoRefresh,
    
    // Utilitaires
    getMatchSummary,
    displayMatchStats,
    exportMatchDataAsJSON
};

console.log('✅ Module liveDataModule disponible globalement');
console.log('💡 Utilisation: window.liveDataModule.fetchMatchData("votre_bin_id")');
console.log('💡 Exemple: await liveDataModule.fetchMatchData("68e0d3e943b1c97be959e487")');
