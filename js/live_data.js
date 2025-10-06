// live_data.js - Module complet de gestion du live (BACKEND)

// ===== CONFIGURATION =====

const JSONBIN_CONFIG = {
    API_KEY: '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS',
    API_BASE_URL: 'https://api.jsonbin.io/v3/b',
    REFRESH_INTERVAL: 10000 // 10 secondes
};

// ===== VARIABLES GLOBALES =====

let currentMatchData = null;
let refreshIntervalId = null;

// ===== FONCTIONS DE RÃ‰CUPÃ‰RATION DE DONNÃ‰ES =====

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
async function fetchMatchDataFromBin(binId) {
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
        
        console.log('✅ Données récupérées avec succès');
        return matchData;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
        throw error;
    }
}

/**
 * Charger les données du match et mettre à jour l'affichage
 * @param {string} binId - L'identifiant du bin
 * @param {boolean} showLoading - Afficher le message de chargement
 */
async function loadMatchData(binId, showLoading = true) {
    try {
        if (showLoading) {
            updateStatus('Chargement...', 'paused');
        }
        
        const matchData = await fetchMatchDataFromBin(binId);
        
        if (matchData) {
            currentMatchData = matchData;
            displayMatchData(matchData);
            
            // Mettre à jour le statut
            const isRunning = matchData.timer?.isRunning;
            const isFinished = matchData.live?.matchStatus === 'finished';
            
            if (isFinished) {
                updateStatus('Match terminé', 'finished');
            } else if (isRunning) {
                updateStatus('En direct', 'running');
            } else {
                updateStatus('En pause', 'paused');
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showErrorMessage(error.message);
    }
}

// ===== FONCTIONS D'AFFICHAGE (DOM) =====

/**
 * Afficher les données du match dans la page
 * @param {Object} matchData - Les données du match
 */
function displayMatchData(matchData) {
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) {
        console.error('❌ Element mainContent non trouvé');
        return;
    }
    
    // Construire le HTML complet
    mainContent.innerHTML = `
        <!-- Tableau de bord du match -->
        <div class="team-card">
            <div class="match-scoreboard">
                <!-- Équipe à domicile -->
                <div class="team-section">
                    <div class="team-name">${matchData.matchInfo?.teamName || 'Mon Équipe'}</div>
                    <div class="team-score">${matchData.stats?.score?.myTeam || 0}</div>
                </div>
                
                <!-- Centre (Timer) -->
                <div class="match-center">
                    <div class="match-time">${matchData.timer?.currentTime || '00:00'}</div>
                    <div class="match-half">${matchData.timer?.currentHalf === 1 ? '1ère Mi-temps' : '2ème Mi-temps'}</div>
                    <div class="match-status ${getMatchStatusClass(matchData)}">
                        ${getMatchStatusText(matchData)}
                    </div>
                </div>
                
                <!-- Équipe adverse -->
                <div class="team-section">
                    <div class="team-name">${matchData.matchInfo?.opponentName || 'Adversaire'}</div>
                    <div class="team-score">${matchData.stats?.score?.opponent || 0}</div>
                </div>
            </div>
        </div>
        
        <!-- Barre d'actions -->
        <div class="actions-bar">
            <button class="btn btn-primary" onclick="liveModule.refreshData()">
                🔄 Actualiser
            </button>
            <button class="btn btn-success" onclick="liveModule.exportData()">
                💾 Exporter JSON
            </button>
            <button class="btn btn-secondary" onclick="liveModule.copyUrl()">
                🔗 Copier le lien
            </button>
        </div>
        
        <!-- Statistiques du match -->
        <div class="team-card">
            <h3>📊 Statistiques</h3>
            <div class="stats-grid">
                ${generateStatsCards(matchData)}
            </div>
        </div>
        
        <!-- Timeline des événements -->
        <div class="team-card">
            <h3>📋 Déroulement du match</h3>
            <div class="timeline-live">
                <div class="timeline-header">
                    <div>${matchData.matchInfo?.teamName || 'Mon Équipe'}</div>
                    <div>Temps</div>
                    <div>${matchData.matchInfo?.opponentName || 'Adversaire'}</div>
                </div>
                <div id="eventsTimeline">
                    ${generateTimeline(matchData.events || [])}
                </div>
            </div>
        </div>
        
        <!-- Dernière mise à jour -->
        <div class="last-update">
            ⏱️ Dernière mise à jour : ${formatLastUpdate(matchData.live?.lastUpdate)}
        </div>
    `;
    
    console.log('✅ Affichage mis à jour');
}

/**
 * Générer les cartes de statistiques
 * @param {Object} matchData - Les données du match
 * @returns {string} HTML des cartes de stats
 */
function generateStatsCards(matchData) {
    const stats = matchData.stats || {};
    const myTeam = stats.myTeam || {};
    const opponent = stats.opponent || {};
    
    const statsConfig = [
        { icon: '⚽', label: 'Buts', team: myTeam.goals || 0, opponent: opponent.goals || 0 },
        { icon: '🎯', label: 'Tirs', team: myTeam.shots || 0, opponent: opponent.shots || 0 },
        { icon: '📍', label: 'Tirs cadrés', team: myTeam.shotsOnTarget || 0, opponent: opponent.shotsOnTarget || 0 },
        { icon: '🧤', label: 'Arrêts', team: myTeam.saves || 0, opponent: opponent.saves || 0 },
        { icon: '🟨', label: 'Cartons', team: myTeam.cards || 0, opponent: opponent.cards || 0 },
        { icon: '⚠️', label: 'Fautes', team: myTeam.fouls || 0, opponent: opponent.fouls || 0 },
        { icon: '🚩', label: 'Corners', team: myTeam.corners || 0, opponent: opponent.corners || 0 },
        { icon: '🔄', label: 'Changements', team: myTeam.substitutions || 0, opponent: opponent.substitutions || 0 }
    ];
    
    return statsConfig.map(stat => `
        <div class="stat-card">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-values">
                <span class="stat-team">${stat.team}</span>
                <span class="stat-separator">-</span>
                <span class="stat-opponent">${stat.opponent}</span>
            </div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

/**
 * Générer la timeline des événements
 * @param {Array} events - Liste des événements
 * @returns {string} HTML de la timeline
 */
function generateTimeline(events) {
    if (!events || events.length === 0) {
        return '<div style="text-align: center; padding: 30px; color: #bbb;">Aucun événement enregistré</div>';
    }
    
    return events.map(event => {
        const leftContent = event.isTeam ? getEventHTML(event) : '&nbsp;';
        const rightContent = !event.isTeam ? getEventHTML(event) : '&nbsp;';
        
        return `
            <div class="timeline-event">
                <div class="event-left">${leftContent}</div>
                <div class="event-time">${event.time}</div>
                <div class="event-right">${rightContent}</div>
            </div>
        `;
    }).join('');
}

/**
 * Obtenir le HTML d'un événement
 * @param {Object} event - L'événement
 * @returns {string} HTML de l'événement
 */
function getEventHTML(event) {
    // Si l'événement a déjà une description formatée, l'utiliser
    if (event.formattedDescription) {
        return event.formattedDescription;
    }
    
    let icon = '';
    let text = '';
    
    switch (event.type) {
        case 'goal':
            icon = '⚽';
            text = `But${event.option ? ' (' + event.option + ')' : ''}`;
            break;
        case 'assist':
            icon = '➡️';
            text = 'Passe décisive';
            break;
        case 'shot':
            icon = '🎯';
            text = `Tir${event.option ? ' (' + event.option + ')' : ''}`;
            break;
        case 'save':
            icon = '🧤';
            text = `Arrêt${event.option ? ' (' + event.option + ')' : ''}`;
            break;
        case 'card':
            icon = event.option === 'Jaune' ? '🟨' : event.option === 'Rouge' ? '🟥' : '⬜';
            text = `Carton ${event.option}`;
            break;
        case 'foul':
            icon = '⚠️';
            text = `Faute${event.option ? ' (' + event.option + ')' : ''}`;
            break;
        case 'corner':
            icon = '🚩';
            text = 'Corner';
            break;
        case 'offside':
            icon = '🛑';
            text = 'Hors-jeu';
            break;
        case 'substitution':
            icon = '🔄';
            text = 'Changement';
            if (event.playerInName && event.playerOutName) {
                text += `: ${event.playerInName} ➡️ ${event.playerOutName}`;
            }
            break;
        case 'system':
            icon = '⚽';
            text = event.description || 'Événement système';
            break;
        default:
            icon = '📋';
            text = event.type;
    }
    
    const playerInfo = event.playerName && event.playerName !== 'Adversaire' && event.type !== 'substitution' 
        ? `<br><small style="opacity: 0.8;">${event.playerName}</small>` 
        : '';
    
    return `<span style="font-size: 1.2em;">${icon}</span> ${text}${playerInfo}`;
}

/**
 * Mettre à jour le statut dans l'en-tête
 * @param {string} text - Texte du statut
 * @param {string} status - Type de statut (running, paused, finished)
 */
function updateStatus(text, status) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (statusIndicator) {
        statusIndicator.className = `status-indicator ${status}`;
    }
    
    if (statusText) {
        statusText.textContent = text;
    }
}

/**
 * Afficher le message "Pas de données"
 */
function showNoDataMessage() {
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="no-data-message">
            <h2>⚠️ Aucun match en direct</h2>
            <p>Cette page nécessite un lien live valide.</p>
            <p><code>live.html?bin=VOTRE_BIN_ID</code></p>
            <br>
            <a href="match.html" class="btn btn-primary">⚽ Aller à la page Match</a>
        </div>
    `;
    
    updateStatus('Aucun match', 'finished');
}

/**
 * Afficher un message d'erreur
 * @param {string} message - Message d'erreur
 */
function showErrorMessage(message) {
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="error-message">
            <h3>❌ Erreur de chargement</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">🔄 Réessayer</button>
        </div>
    `;
    
    updateStatus('Erreur', 'finished');
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Obtenir la classe CSS du statut du match
 * @param {Object} matchData - Les données du match
 * @returns {string} Classe CSS
 */
function getMatchStatusClass(matchData) {
    if (matchData.live?.matchStatus === 'finished') return 'finished';
    if (matchData.timer?.isRunning) return 'running';
    return 'paused';
}

/**
 * Obtenir le texte du statut du match
 * @param {Object} matchData - Les données du match
 * @returns {string} Texte du statut
 */
function getMatchStatusText(matchData) {
    if (matchData.live?.matchStatus === 'finished') return '🏁 Terminé';
    if (matchData.timer?.isRunning) return '▶️ En cours';
    return '⏸️ En pause';
}

/**
 * Formater la dernière mise à jour
 * @param {string} timestamp - Timestamp ISO
 * @returns {string} Texte formaté
 */
function formatLastUpdate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // différence en secondes
    
    if (diff < 60) return `il y a ${diff} seconde${diff > 1 ? 's' : ''}`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''}`;
    
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== ACTIONS UTILISATEUR =====

/**
 * Actualiser les données manuellement
 */
async function refreshData() {
    const binId = getBinIdFromUrl();
    if (binId) {
        await loadMatchData(binId, true);
    }
}

/**
 * Exporter les données en JSON
 */
function exportData() {
    if (!currentMatchData) {
        alert('❌ Aucune donnée à exporter');
        return;
    }
    
    const dataStr = JSON.stringify(currentMatchData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `match_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log('💾 Données exportées');
}

/**
 * Copier l'URL actuelle
 */
async function copyUrl() {
    // Enlever fbclid et autres paramètres de tracking
    const url = window.location.href.split('&fbclid')[0].split('?fbclid')[0];
    
    try {
        await navigator.clipboard.writeText(url);
        alert('✅ Lien copié dans le presse-papiers !');
    } catch (error) {
        prompt('Copiez ce lien:', url);
    }
}

/**
 * Obtenir un résumé des données de match (pour debug)
 * @param {Object} matchData - Les données du match
 * @returns {Object} Résumé
 */
function getMatchSummary(matchData) {
    if (!matchData) return null;
    
    return {
        matchInfo: {
            teamName: matchData.matchInfo?.teamName || 'Mon Équipe',
            opponentName: matchData.matchInfo?.opponentName || 'Équipe Adverse',
            date: matchData.matchInfo?.date || 'N/A'
        },
        score: {
            team: matchData.stats?.score?.myTeam || 0,
            opponent: matchData.stats?.score?.opponent || 0
        },
        timer: {
            currentTime: matchData.timer?.currentTime || '00:00',
            isRunning: matchData.timer?.isRunning || false,
            currentHalf: matchData.timer?.currentHalf || 1
        },
        stats: {
            eventsCount: matchData.events?.length || 0,
            playersCount: matchData.players?.length || 0
        },
        lastUpdate: matchData.live?.lastUpdate || 'N/A'
    };
}

/**
 * Afficher les stats dans la console (pour debug)
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

// ===== GESTION DU RAFRAÎCHISSEMENT AUTOMATIQUE =====

/**
 * Démarrer le rafraîchissement automatique
 * @param {string} binId - L'identifiant du bin
 * @param {number} interval - Intervalle en millisecondes
 */
function startAutoRefresh(binId, interval = JSONBIN_CONFIG.REFRESH_INTERVAL) {
    console.log(`🔄 Démarrage du rafraîchissement automatique (${interval}ms)`);
    
    refreshIntervalId = setInterval(async () => {
        await loadMatchData(binId, false); // false = pas de message de chargement
    }, interval);
}

/**
 * Arrêter le rafraîchissement automatique
 */
function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
        console.log('⏹️ Rafraîchissement automatique arrêté');
    }
}

// ===== SAUVEGARDE LOCALE =====

/**
 * Sauvegarder les données récupérées en local
 * @param {Object} matchData - Les données du match
 */
function saveMatchDataLocally(matchData) {
    if (!matchData) return;
    
    try {
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

// ===== INITIALISATION =====

/**
 * Initialiser le module live
 */
async function initializeLive() {
    console.log('🚀 Initialisation du module live');
    
    // Vérifier si on a un binId dans l'URL
    const binId = getBinIdFromUrl();
    
    if (!binId) {
        showNoDataMessage();
        return;
    }
    
    // Charger les données initiales
    await loadMatchData(binId, true);
    
    // Démarrer le rafraîchissement automatique
    startAutoRefresh(binId);
    
    console.log('✅ Module live initialisé');
}

// ===== ÉVÉNEMENTS =====

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📺 Page live chargée');
    initializeLive();
});

/**
 * Nettoyage avant fermeture de la page
 */
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
    
    // Sauvegarder les données actuelles
    if (currentMatchData) {
        saveMatchDataLocally(currentMatchData);
    }
});

/**
 * Écouter les mises à jour automatiques (événement personnalisé)
 */
window.addEventListener('matchDataUpdated', function(event) {
    console.log('🔄 Mise à jour automatique reçue');
    
    const matchData = event.detail;
    if (matchData) {
        currentMatchData = matchData;
        displayMatchData(matchData);
    }
});

// ===== EXPORT DES FONCTIONS GLOBALES =====

/**
 * Module live exporté globalement
 */
window.liveModule = {
    // Récupération de données
    getBinIdFromUrl,
    fetchMatchDataFromBin,
    loadMatchData,
    
    // Affichage
    displayMatchData,
    updateStatus,
    showNoDataMessage,
    showErrorMessage,
    
    // Actions utilisateur
    refreshData,
    exportData,
    copyUrl,
    
    // Rafraîchissement
    startAutoRefresh,
    stopAutoRefresh,
    
    // Sauvegarde locale
    saveMatchDataLocally,
    getLocalMatchData,
    
    // Utilitaires
    getMatchSummary,
    displayMatchStats,
    
    // Variables
    getCurrentMatchData: () => currentMatchData
};

console.log('✅ Module liveModule disponible globalement');
console.log('💡 Utilisation: liveModule.refreshData(), liveModule.exportData(), etc.');