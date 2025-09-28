// ===== NOUVELLES FONCTIONS DE GESTION DES MATCHS =====

/**
 * Effacer toutes les données spécifiques au match
 */
function clearMatchData() {
    // Données utilisées par match.html
    const matchKeys = [
        'currentMatch',     // Données principales du match
        'matchBinId',       // ID JsonBin pour le live
        'liveId',          // ID de session live
        'currentLiveId'    // Autre référence live
    ];
    
    matchKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`🗑️ Effacé: ${key}`);
        }
    });
    
    console.log('🧹 Données de match effacées');
}

/**
 * Reset des données de composition
 */
function resetCompositionData() {
    // Remettre tous les joueurs sur le banc
    if (appState.players && appState.players.length > 0) {
        appState.players = appState.players.map(player => ({
            ...player,
            status: 'bench'  // Remettre tous sur le banc
        }));
        
        // Sauvegarder dans localStorage directement aussi
        if (typeof saveData === 'function') {
            saveData('players', appState.players);
        }
        
        saveAppState();
        console.log('👥 Composition reset - tous les joueurs remis sur le banc');
    }
}

/**
 * Créer un nouveau match vide
 */
function createNewMatch() {
    // Utiliser getMatchConfig depuis storage.js
    const config = typeof getMatchConfig === 'function' ? getMatchConfig() : {
        teamName: 'Mon Équipe',
        opponentName: 'Équipe Adverse',
        venue: 'Terrain'
    };
    
    const newMatchData = {
        id: Date.now().toString(),
        matchInfo: {
            teamName: config.teamName || 'Mon Équipe',
            opponentName: config.opponentName || 'Équipe Adverse',
            venue: config.venue || 'Terrain',
            date: config.matchDate || new Date().toISOString(),
            startTime: '15:00'
        },
        timer: {
            startTime: null,
            pausedTime: 0,
            isRunning: false,
            currentHalf: 1,
            interval: null
        },
        events: [],
        stats: {
            myTeam: { goals: 0, shots: 0, cards: 0, fouls: 0, saves: 0, freeKicks: 0 },
            opponent: { goals: 0, shots: 0, cards: 0, fouls: 0, saves: 0, freeKicks: 0 }
        },
        live: {
            lastUpdate: new Date().toISOString(),
            isActive: false,
            version: '1.0'
        }
    };
    
    // Sauvegarder le nouveau match
    localStorage.setItem('currentMatch', JSON.stringify(newMatchData));
    
    // Reset de l'état de l'application pour les événements et score
    appState.events = [];
    appState.score = { team: 0, opponent: 0 };
    appState.time = 0;
    appState.half = 1;
    appState.currentMatch = newMatchData;
    saveAppState();
    
    console.log('🆕 Nouveau match créé avec données vides');
    return newMatchData;
}

/**
 * Démarrer un nouveau match
 */
function startNewMatch() {
    if (confirm('🆕 Commencer un nouveau match ?\n\n⚠️ Les données du match en cours seront perdues !\n(Les joueurs et compositions seront conservés)')) {
        
        // Effacer toutes les données de match spécifiques
        clearMatchData();
        
        // Créer un nouveau match vide
        createNewMatch();
        
        showNotification('🆕 Nouveau match créé ! Score et événements remis à zéro.', 'success');
        
        // Rediriger vers la page de match après un délai
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.location) {
                const isOnIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
                if (isOnIndexPage) {
                    window.location.href = 'pages/match.html';
                } else {
                    window.location.href = 'match.html';
                }
            }
        }, 1500);
        
        return true;
    }
    return false;
}

/**
 * Reset complet de l'application
 */
function resetCompleteApp() {
    console.log('🔄 Début du reset complet...');
    
    // 1. Effacer toutes les données "footballStats_" (via storage.js)
    if (typeof clearAllData === 'function') {
        clearAllData();
    }
    
    // 2. Effacer toutes les données de match spécifiques
    clearMatchData();
    
    // 3. Reset des sélections de composition
    resetCompositionData();
    
    // 4. Reset de l'état de l'application
    appState.currentMatch = null;
    appState.players = [];
    appState.events = [];
    appState.score = { team: 0, opponent: 0 };
    appState.time = 0;
    appState.half = 1;
    appState.isPlaying = false;
    
    // Sauvegarder l'état vide
    saveAppState();
    
    console.log('✅ Reset complet terminé');
    showNotification('🔄 Toutes les données ont été effacées ! Application remise à zéro.', 'success');
    
    // Recharger la page pour un état complètement propre
    setTimeout(() => {
        if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
        }
    }, 2000);
    
    return true;
}

/**
 * Obtenir les statistiques de la page d'accueil
 */
function getHomePageStats() {
    const players = appState.players || [];
    let currentMatchData = null;
    
    // Charger les données du match actuel
    try {
        const matchStr = localStorage.getItem('currentMatch');
        if (matchStr) {
            currentMatchData = JSON.parse(matchStr);
        }
    } catch (e) {
        console.log('Aucune donnée de match valide');
    }
    
    const stats = {
        hasData: players.length > 0 || currentMatchData !== null,
        players: {
            total: players.length,
            field: players.filter(p => p.status === 'field').length,
            bench: players.filter(p => p.status === 'bench').length
        },
        match: null
    };
    
    if (currentMatchData) {
        const matchStats = currentMatchData.stats || { myTeam: { goals: 0 }, opponent: { goals: 0 } };
        const events = currentMatchData.events || [];
        const timer = currentMatchData.timer || {};
        
        stats.match = {
            score: {
                team: matchStats.myTeam.goals || 0,
                opponent: matchStats.opponent.goals || 0
            },
            events: events.length,
            half: timer.currentHalf || 1
        };
    }
    
    return stats;
}

/**
 * Export des données pour sauvegarde
 */
function exportCurrentMatch() {
    const players = appState.players || [];
    const currentMatch = localStorage.getItem('currentMatch');
    const matchConfig = typeof loadData === 'function' ? loadData('matchConfig') : null;
    
    const exportData = {
        players: players,
        currentMatch: currentMatch ? JSON.parse(currentMatch) : null,
        matchConfig: matchConfig,
        appState: {
            events: appState.events,
            score: appState.score,
            time: appState.time,
            half: appState.half
        },
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    return exportData;
}

/**
 * Import des données depuis une sauvegarde
 */
function importMatchData(data) {
    try {
        // Importer les joueurs
        if (data.players) {
            appState.players = data.players;
            if (typeof saveData === 'function') {
                saveData('players', data.players);
            }
        }
        
        // Importer la configuration du match
        if (data.matchConfig && typeof setMatchConfig === 'function') {
            setMatchConfig(data.matchConfig);
        }
        
        // Importer les données du match actuel
        if (data.currentMatch) {
            localStorage.setItem('currentMatch', JSON.stringify(data.currentMatch));
            appState.currentMatch = data.currentMatch;
        }
        
        // Importer l'état de l'application
        if (data.appState) {
            appState.events = data.appState.events || [];
            appState.score = data.appState.score || { team: 0, opponent: 0 };
            appState.time = data.appState.time || 0;
            appState.half = data.appState.half || 1;
        }
        
        // Sauvegarder l'état mis à jour
        saveAppState();
        
        console.log('✅ Données importées avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        return false;
    }
}

// ===== AJOUT À L'EXPORT FOOTBALLAPP =====

// Ajouter ces nouvelles fonctions à l'export existant
window.footballApp = {
    // État
    getState: () => appState,
    saveState: saveAppState,
    
    // Joueurs
    addPlayer: addPlayerToTeam,
    removePlayer: removePlayerFromTeam,
    updatePlayerStatus,
    getPlayersByStatus,
    getPositionIcon,
    
    // Événements
    addEvent: addMatchEvent,
    formatTime,
    
    // Affichage
    updateAllDisplays,
    showNotification,
    
    // Modales
    closeAllModals,
    
    // Chrono
    startTimer: startMatchTimer,
    stopTimer: stopMatchTimer,
    resetTimer: resetMatchTimer,
    
    // Live
    updateLive: updateLiveIfActive,
    
    // ===== NOUVELLES FONCTIONS AJOUTÉES =====
    
    // Gestion des matchs
    startNewMatch,
    resetCompleteApp,
    clearMatchData,
    resetCompositionData,
    createNewMatch,
    
    // Statistiques
    getHomePageStats,
    
    // Import/Export
    exportCurrentMatch,
    importMatchData
};

console.log('🎯 Football Stats App - Fonctions principales chargées (avec reset)');