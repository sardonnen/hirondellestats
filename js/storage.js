// ===== CONFIGURATION API JSONBIN.IO =====
const JSONBIN_CONFIG = {
    // Remplacez par votre clé API JSONBin.io
    API_KEY: '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS',
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    HEADERS: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$L3uaRDnltfCsdgv50dAJ0.aTJsslnmT2SPju9EPNd6HvXqW6u9KmS'
    }
};

// ===== GESTION DU STOCKAGE LOCAL =====

/**
 * Sauvegarde des données dans le localStorage
 */
function saveData(key, data) {
    try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(`footballStats_${key}`, serializedData);
        console.log(`Données sauvegardées: ${key}`);
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
}

/**
 * Chargement des données depuis le localStorage
 */
function loadData(key) {
    try {
        const serializedData = localStorage.getItem(`footballStats_${key}`);
        if (serializedData === null) {
            return null;
        }
        return JSON.parse(serializedData);
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return null;
    }
}

/**
 * Suppression d'une clé spécifique
 */
function removeData(key) {
    try {
        localStorage.removeItem(`footballStats_${key}`);
        console.log(`Données supprimées: ${key}`);
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return false;
    }
}

/**
 * Effacement de toutes les données de l'application
 */
function clearAllData() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('footballStats_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('Toutes les données ont été effacées');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'effacement:', error);
        return false;
    }
}

/**
 * Sauvegarde de la configuration du match
 */
function setMatchConfig(config) {
    return saveData('matchConfig', {
        ...config,
        lastUpdated: new Date().toISOString()
    });
}

/**
 * Chargement de la configuration du match
 */
function getMatchConfig() {
    const config = loadData('matchConfig');
    return config || {
        teamName: 'Mon Équipe',
        opponentName: 'Équipe Adverse',
        venue: 'Stade Municipal',
        matchDate: new Date().toISOString()
    };
}

// ===== GESTION DES JOUEURS =====

/**
 * Sauvegarde de la liste des joueurs
 */
function savePlayers(players) {
    return saveData('players', players);
}

/**
 * Chargement de la liste des joueurs
 */
function loadPlayers() {
    return loadData('players') || [];
}

/**
 * Ajout d'un joueur
 */
function addPlayer(player) {
    const players = loadPlayers();
    const newPlayer = {
        id: Date.now() + Math.random(),
        ...player,
        createdAt: new Date().toISOString()
    };
    players.push(newPlayer);
    savePlayers(players);
    return newPlayer;
}

/**
 * Mise à jour d'un joueur
 */
function updatePlayer(playerId, updates) {
    const players = loadPlayers();
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    if (playerIndex !== -1) {
        players[playerIndex] = {
            ...players[playerIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        savePlayers(players);
        return players[playerIndex];
    }
    return null;
}

/**
 * Suppression d'un joueur
 */
function removePlayer(playerId) {
    const players = loadPlayers();
    const filteredPlayers = players.filter(p => p.id !== playerId);
    savePlayers(filteredPlayers);
    return filteredPlayers;
}

// ===== GESTION DES COMPOSITIONS =====

/**
 * Sauvegarde d'une composition
 */
function saveComposition(name, players, startingEleven) {
    const composition = {
        name: name,
        players: players,
        startingEleven: startingEleven,
        timestamp: new Date().toISOString()
    };
    return saveData(`composition_${name}`, composition);
}

/**
 * Chargement d'une composition
 */
function loadComposition(name) {
    return loadData(`composition_${name}`);
}

/**
 * Liste de toutes les compositions sauvegardées
 */
function listCompositions() {
    const compositions = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
        if (key.startsWith('footballStats_composition_')) {
            const name = key.replace('footballStats_composition_', '');
            const composition = loadData(`composition_${name}`);
            if (composition) {
                compositions.push({
                    name: name,
                    timestamp: composition.timestamp
                });
            }
        }
    });
    
    return compositions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Suppression d'une composition
 */
function deleteComposition(name) {
    return removeData(`composition_${name}`);
}

// ===== GESTION DES MATCHS =====

/**
 * Sauvegarde d'un match
 */
function saveMatch(matchData) {
    const match = {
        ...matchData,
        lastUpdated: new Date().toISOString()
    };
    return saveData('currentMatch', match);
}

/**
 * Chargement du match actuel
 */
function loadCurrentMatch() {
    return loadData('currentMatch');
}

/**
 * Sauvegarde d'un match dans l'historique
 */
function saveMatchToHistory(matchData) {
    const history = loadMatchHistory();
    const match = {
        ...matchData,
        savedAt: new Date().toISOString()
    };
    history.unshift(match);
    
    // Garder seulement les 50 derniers matchs
    if (history.length > 50) {
        history.splice(50);
    }
    
    return saveData('matchHistory', history);
}

/**
 * Chargement de l'historique des matchs
 */
function loadMatchHistory() {
    return loadData('matchHistory') || [];
}

// ===== SYNCHRONISATION JSONBIN.IO =====

/**
 * Upload des données vers JSONBin.io pour le live
 */
async function uploadToJsonBin(data) {
    try {
        const response = await fetch(JSONBIN_CONFIG.BASE_URL, {
            method: 'POST',
            headers: JSONBIN_CONFIG.HEADERS,
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Données uploadées vers JSONBin:', result.metadata.id);
            return result.metadata.id;
        } else {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur upload JSONBin:', error);
        return null;
    }
}

/**
 * Récupération des données depuis JSONBin.io
 */
async function downloadFromJsonBin(binId) {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.HEADERS['X-Master-Key']
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Données téléchargées depuis JSONBin');
            return result.record;
        } else {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur download JSONBin:', error);
        return null;
    }
}

/**
 * Mise à jour des données dans JSONBin.io
 */
async function updateJsonBin(binId, data) {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${binId}`, {
            method: 'PUT',
            headers: JSONBIN_CONFIG.HEADERS,
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Données mises à jour dans JSONBin');
            return result;
        } else {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('Erreur update JSONBin:', error);
        return null;
    }
}

// ===== GESTION DU LIVE =====

/**
 * Génération d'un lien live
 */
async function generateLiveLink(matchData) {
    const liveData = {
        matchId: matchData.id || Date.now().toString(),
        config: getMatchConfig(),
        players: loadPlayers(),
        events: matchData.events || [],
        score: matchData.score || { team: 0, opponent: 0 },
        time: matchData.time || 0,
        half: matchData.half || 1,
        timestamp: new Date().toISOString()
    };
    
    // Sauvegarder localement pour fallback
    saveData(`live_${liveData.matchId}`, liveData);
    
    // Essayer d'uploader vers JSONBin
    const binId = await uploadToJsonBin(liveData);
    
    if (binId) {
        // Sauvegarder l'ID du bin pour les mises à jour
        saveData(`liveBin_${liveData.matchId}`, binId);
        return {
            url: `${window.location.origin}${window.location.pathname}?live=${liveData.matchId}&bin=${binId}`,
            matchId: liveData.matchId,
            binId: binId
        };
    } else {
        // Fallback: utiliser seulement le localStorage
        return {
            url: `${window.location.origin}${window.location.pathname}?live=${liveData.matchId}`,
            matchId: liveData.matchId,
            binId: null
        };
    }
}

/**
 * Mise à jour des données live
 */
async function updateLiveData(matchId, updateData) {
    const currentData = loadData(`live_${matchId}`) || {};
    const updatedData = {
        ...currentData,
        ...updateData,
        lastUpdated: new Date().toISOString()
    };
    
    // Sauvegarder localement
    saveData(`live_${matchId}`, updatedData);
    
    // Essayer de mettre à jour JSONBin
    const binId = loadData(`liveBin_${matchId}`);
    if (binId) {
        await updateJsonBin(binId, updatedData);
    }
    
    return updatedData;
}

/**
 * Récupération des données live
 */
async function getLiveData(matchId, binId = null) {
    // Essayer JSONBin en premier si on a un binId
    if (binId) {
        const jsonbinData = await downloadFromJsonBin(binId);
        if (jsonbinData) {
            return jsonbinData;
        }
    }
    
    // Fallback: localStorage
    return loadData(`live_${matchId}`);
}

// ===== EXPORT/IMPORT =====

/**
 * Export de toutes les données
 */
function exportAllData() {
    const allData = {
        players: loadPlayers(),
        matchConfig: getMatchConfig(),
        currentMatch: loadCurrentMatch(),
        matchHistory: loadMatchHistory(),
        compositions: listCompositions().map(comp => ({
            ...comp,
            data: loadComposition(comp.name)
        })),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    return allData;
}

/**
 * Import de données
 */
function importAllData(data) {
    try {
        if (data.players) {
            savePlayers(data.players);
        }
        
        if (data.matchConfig) {
            setMatchConfig(data.matchConfig);
        }
        
        if (data.currentMatch) {
            saveMatch(data.currentMatch);
        }
        
        if (data.matchHistory) {
            saveData('matchHistory', data.matchHistory);
        }
        
        if (data.compositions) {
            data.compositions.forEach(comp => {
                if (comp.data) {
                    saveComposition(comp.name, comp.data.players, comp.data.startingEleven);
                }
            });
        }
        
        console.log('Données importées avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        return false;
    }
}

// ===== UTILITAIRES =====

/**
 * Vérification de l'état du stockage
 */
function getStorageInfo() {
    const info = {
        players: loadPlayers().length,
        compositions: listCompositions().length,
        hasCurrentMatch: !!loadCurrentMatch(),
        matchHistory: loadMatchHistory().length,
        storageUsed: 0
    };
    
    // Calculer l'espace utilisé
    let totalSize = 0;
    for (let key in localStorage) {
        if (key.startsWith('footballStats_')) {
            totalSize += localStorage[key].length;
        }
    }
    info.storageUsed = Math.round(totalSize / 1024); // en KB
    
    return info;
}

/**
 * Nettoyage automatique des anciennes données
 */
function cleanupOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Nettoyer l'historique des matchs
    const history = loadMatchHistory();
    const filteredHistory = history.filter(match => 
        new Date(match.savedAt || match.timestamp) > cutoffDate
    );
    
    if (filteredHistory.length !== history.length) {
        saveData('matchHistory', filteredHistory);
        console.log(`Nettoyage: ${history.length - filteredHistory.length} anciens matchs supprimés`);
    }
    
    // Nettoyer les données live anciennes
    const keys = Object.keys(localStorage);
    let cleanedCount = 0;
    
    keys.forEach(key => {
        if (key.startsWith('footballStats_live_')) {
            const data = loadData(key.replace('footballStats_', ''));
            if (data && data.timestamp) {
                const dataDate = new Date(data.timestamp);
                if (dataDate < cutoffDate) {
                    localStorage.removeItem(key);
                    cleanedCount++;
                }
            }
        }
    });
    
    if (cleanedCount > 0) {
        console.log(`Nettoyage: ${cleanedCount} données live anciennes supprimées`);
    }
}

// ===== INITIALISATION =====

// Nettoyage automatique au chargement (seulement une fois par jour)
document.addEventListener('DOMContentLoaded', function() {
    const lastCleanup = loadData('lastCleanup');
    const today = new Date().toDateString();
    
    if (!lastCleanup || lastCleanup !== today) {
        cleanupOldData();
        saveData('lastCleanup', today);
    }
});

// Export des fonctions globales
window.footballStorage = {
    // Données générales
    saveData,
    loadData,
    removeData,
    clearAllData,
    
    // Configuration match
    setMatchConfig,
    getMatchConfig,
    
    // Joueurs
    savePlayers,
    loadPlayers,
    addPlayer,
    updatePlayer,
    removePlayer,
    
    // Compositions
    saveComposition,
    loadComposition,
    listCompositions,
    deleteComposition,
    
    // Matchs
    saveMatch,
    loadCurrentMatch,
    saveMatchToHistory,
    loadMatchHistory,
    
    // Live
    generateLiveLink,
    updateLiveData,
    getLiveData,
    
    // Import/Export
    exportAllData,
    importAllData,
    
    // Utilitaires
    getStorageInfo,
    cleanupOldData
};