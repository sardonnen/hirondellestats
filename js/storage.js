// storage.js - Gestion du stockage localStorage (BACKEND)

// ===== CONSTANTES =====

const STORAGE_PREFIX = 'footballStats_';
const STORAGE_KEYS = {
    PLAYERS: 'players',
    MATCH_CONFIG: 'matchConfig',
    CURRENT_MATCH: 'currentMatch',
    EVENTS: 'events',
    LIVE_DATA: 'liveMatchData'
};

// ===== FONCTIONS DE BASE =====

/**
 * Construire une clé de stockage avec le préfixe
 * @param {string} key - Clé de base
 * @returns {string} Clé complète avec préfixe
 */
function buildStorageKey(key) {
    return STORAGE_PREFIX + key;
}

/**
 * Sauvegarder des données dans localStorage
 * @param {string} key - Clé de stockage
 * @param {*} data - Données à sauvegarder
 * @returns {boolean} Succès de l'opération
 */
function saveData(key, data) {
    try {
        const storageKey = buildStorageKey(key);
        const jsonData = JSON.stringify(data);
        localStorage.setItem(storageKey, jsonData);
        console.log(`💾 Données sauvegardées: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur sauvegarde ${key}:`, error);
        return false;
    }
}

/**
 * Charger des données depuis localStorage
 * @param {string} key - Clé de stockage
 * @returns {*} Données chargées ou null
 */
function loadData(key) {
    try {
        const storageKey = buildStorageKey(key);
        const jsonData = localStorage.getItem(storageKey);
        
        if (!jsonData) {
            return null;
        }
        
        const data = JSON.parse(jsonData);
        console.log(`📂 Données chargées: ${key}`);
        return data;
    } catch (error) {
        console.error(`❌ Erreur chargement ${key}:`, error);
        return null;
    }
}

/**
 * Supprimer des données du localStorage
 * @param {string} key - Clé de stockage
 * @returns {boolean} Succès de l'opération
 */
function removeData(key) {
    try {
        const storageKey = buildStorageKey(key);
        localStorage.removeItem(storageKey);
        console.log(`🗑️ Données supprimées: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur suppression ${key}:`, error);
        return false;
    }
}

/**
 * Vérifier si une clé existe dans le localStorage
 * @param {string} key - Clé de stockage
 * @returns {boolean} True si la clé existe
 */
function hasData(key) {
    const storageKey = buildStorageKey(key);
    return localStorage.getItem(storageKey) !== null;
}

/**
 * Effacer toutes les données de l'application
 * @returns {boolean} Succès de l'opération
 */
function clearAllData() {
    try {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });
        
        console.log(`🗑️ ${cleared} clés supprimées`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        return false;
    }
}

// ===== FONCTIONS SPÉCIFIQUES =====

/**
 * Sauvegarder les joueurs
 * @param {Array} players - Liste des joueurs
 */
function savePlayers(players) {
    return saveData(STORAGE_KEYS.PLAYERS, players);
}

/**
 * Charger les joueurs
 * @returns {Array} Liste des joueurs ou tableau vide
 */
function loadPlayers() {
    return loadData(STORAGE_KEYS.PLAYERS) || [];
}

/**
 * Sauvegarder la configuration du match
 * @param {Object} config - Configuration du match
 */
function saveMatchConfig(config) {
    return saveData(STORAGE_KEYS.MATCH_CONFIG, config);
}

/**
 * Charger la configuration du match
 * @returns {Object} Configuration ou objet par défaut
 */
function loadMatchConfig() {
    return loadData(STORAGE_KEYS.MATCH_CONFIG) || {
        teamName: 'Mon Équipe',
        opponentName: 'Équipe Adverse',
        venue: 'Stade',
        date: new Date().toISOString().split('T')[0],
        startTime: '15:00'
    };
}

/**
 * Sauvegarder le match actuel
 * @param {Object} matchData - Données du match
 */
function saveCurrentMatch(matchData) {
    return saveData(STORAGE_KEYS.CURRENT_MATCH, matchData);
}

/**
 * Charger le match actuel
 * @returns {Object|null} Données du match ou null
 */
function loadCurrentMatch() {
    return loadData(STORAGE_KEYS.CURRENT_MATCH);
}

/**
 * Sauvegarder les événements
 * @param {Array} events - Liste des événements
 */
function saveEvents(events) {
    return saveData(STORAGE_KEYS.EVENTS, events);
}

/**
 * Charger les événements
 * @returns {Array} Liste des événements ou tableau vide
 */
function loadEvents() {
    return loadData(STORAGE_KEYS.EVENTS) || [];
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Obtenir la taille totale du stockage utilisé
 * @returns {number} Taille en octets
 */
function getStorageSize() {
    let total = 0;
    
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_PREFIX)) {
            total += localStorage[key].length + key.length;
        }
    }
    
    return total;
}

/**
 * Obtenir la taille du stockage en format lisible
 * @returns {string} Taille formatée (ex: "2.5 KB")
 */
function getStorageSizeFormatted() {
    const bytes = getStorageSize();
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

/**
 * Lister toutes les clés de l'application
 * @returns {Array} Liste des clés
 */
function listAllKeys() {
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            keys.push(key.replace(STORAGE_PREFIX, ''));
        }
    }
    
    return keys;
}

/**
 * Exporter toutes les données de l'application
 * @returns {Object} Objet contenant toutes les données
 */
function exportAllData() {
    const exportData = {};
    const keys = listAllKeys();
    
    keys.forEach(key => {
        exportData[key] = loadData(key);
    });
    
    exportData._exportDate = new Date().toISOString();
    exportData._version = '1.0';
    
    return exportData;
}

/**
 * Importer des données dans l'application
 * @param {Object} data - Données à importer
 * @returns {boolean} Succès de l'opération
 */
function importAllData(data) {
    try {
        // Sauvegarder chaque clé
        Object.keys(data).forEach(key => {
            if (!key.startsWith('_')) { // Ignorer les métadonnées
                saveData(key, data[key]);
            }
        });
        
        console.log('✅ Données importées avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        return false;
    }
}

/**
 * Obtenir des informations sur le stockage
 * @returns {Object} Informations détaillées
 */
function getStorageInfo() {
    return {
        keys: listAllKeys(),
        keysCount: listAllKeys().length,
        totalSize: getStorageSize(),
        formattedSize: getStorageSizeFormatted(),
        hasPlayers: hasData(STORAGE_KEYS.PLAYERS),
        hasMatch: hasData(STORAGE_KEYS.CURRENT_MATCH),
        hasConfig: hasData(STORAGE_KEYS.MATCH_CONFIG)
    };
}

// ===== MIGRATION DE DONNÉES =====

/**
 * Migrer les anciennes données vers le nouveau format
 */
function migrateOldData() {
    console.log('🔄 Vérification des migrations nécessaires...');
    
    // Exemple : Ajouter des champs manquants aux joueurs
    const players = loadPlayers();
    if (players && players.length > 0) {
        let needsUpdate = false;
        
        const updatedPlayers = players.map(player => {
            if (!player.stats) {
                player.stats = {
                    goals: 0,
                    shots: 0,
                    cards: 0,
                    fouls: 0,
                    saves: 0
                };
                needsUpdate = true;
            }
            return player;
        });
        
        if (needsUpdate) {
            savePlayers(updatedPlayers);
            console.log('✅ Migration des joueurs effectuée');
        }
    }
}

// ===== EXPORT DES FONCTIONS =====

/**
 * Module de stockage exporté globalement
 */
window.storageModule = {
    // Fonctions de base
    saveData,
    loadData,
    removeData,
    hasData,
    clearAllData,
    
    // Fonctions spécifiques
    savePlayers,
    loadPlayers,
    saveMatchConfig,
    loadMatchConfig,
    saveCurrentMatch,
    loadCurrentMatch,
    saveEvents,
    loadEvents,
    
    // Utilitaires
    getStorageSize,
    getStorageSizeFormatted,
    listAllKeys,
    exportAllData,
    importAllData,
    getStorageInfo,
    
    // Migration
    migrateOldData,
    
    // Constantes
    STORAGE_PREFIX,
    STORAGE_KEYS
};

// Exposer aussi les fonctions individuellement pour compatibilité
window.saveData = saveData;
window.loadData = loadData;
window.removeData = removeData;
window.hasData = hasData;
window.clearAllData = clearAllData;
window.getMatchConfig = loadMatchConfig;
window.getMyTeamPlayers = loadPlayers;

// ===== INITIALISATION =====

// Vérifier et migrer les données au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('💾 Module storage.js initialisé');
    migrateOldData();
    
    // Afficher les infos de stockage
    const info = getStorageInfo();
    console.log(`📊 Stockage: ${info.keysCount} clés, ${info.formattedSize}`);
});

console.log('✅ Module storageModule disponible globalement');