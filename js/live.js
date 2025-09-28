// ===== MODULE DE SYNCHRONISATION LIVE =====

/**
 * Module de gestion de la synchronisation live avec JSONBin.io
 * Permet le partage en temps réel des données de match
 */

// ===== CONFIGURATION =====
const LIVE_CONFIG = {
    // Clé API JSONBin.io (à remplacer par votre clé)
    API_KEY: '$2a$10$r5MbOaRyivoihBZSwAHKkOmtvWIkz6d7lOgfXHlj/0V.YKj4HSQfe',
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    UPDATE_INTERVAL: 5000, // 5 secondes
    MAX_RETRIES: 3,
    TIMEOUT: 10000, // 10 secondes
    
    // Headers pour les requêtes
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Master-Key': this.API_KEY,
            'X-Access-Key': this.API_KEY
        };
    }
};

// ===== VARIABLES GLOBALES =====
let liveState = {
    isActive: false,
    matchId: null,
    binId: null,
    lastUpdate: null,
    updateInterval: null,
    spectatorMode: false,
    connectionStatus: 'disconnected', // disconnected, connecting, connected, error
    retryCount: 0,
    lastSyncTime: null,
    syncQueue: []
};

// ===== FONCTIONS PRINCIPALES =====

/**
 * Initialisation du mode live
 */
async function initializeLive() {
    console.log('🔴 Initialisation du module Live');
    
    // Vérifier si on est en mode spectateur
    checkSpectatorMode();
    
    // Charger l'état sauvegardé
    loadLiveState();
    
    // Démarrer la synchronisation si nécessaire
    if (liveState.isActive && liveState.binId) {
        await startLiveSync();
    }
    
    console.log('✅ Module Live initialisé');
}

/**
 * Vérification du mode spectateur via l'URL
 */
function checkSpectatorMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const liveId = urlParams.get('live');
    const binId = urlParams.get('bin');
    
    if (liveId) {
        liveState.spectatorMode = true;
        liveState.matchId = liveId;
        liveState.binId = binId;
        liveState.isActive = true;
        
        console.log('👁️ Mode spectateur activé:', { liveId, binId });
        return true;
    }
    
    return false;
}

// ===== GÉNÉRATION ET PARTAGE =====

/**
 * Génération d'un lien live
 */
async function generateLiveLink() {
    try {
        updateConnectionStatus('connecting', 'Génération du lien live...');
        
        // Préparer les données du match
        const matchData = await prepareMatchData();
        
        if (!matchData) {
            throw new Error('Aucune donnée de match disponible');
        }
        
        // Créer un nouvel ID de match si nécessaire
        if (!liveState.matchId) {
            liveState.matchId = 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // Ajouter les métadonnées
        const liveData = {
            ...matchData,
            liveInfo: {
                matchId: liveState.matchId,
                createdAt: new Date().toISOString(),
                lastUpdate: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        // Uploader vers JSONBin
        const binId = await uploadToJsonBin(liveData);
        
        if (binId) {
            liveState.binId = binId;
            liveState.isActive = true;
            liveState.lastUpdate = new Date().toISOString();
            
            // Sauvegarder l'état
            saveLiveState();
            
            // Démarrer la synchronisation
            await startLiveSync();
            
            // Générer l'URL
            const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
            const liveUrl = `${baseUrl}pages/live.html?live=${liveState.matchId}&bin=${binId}`;
            
            updateConnectionStatus('connected', 'Lien live généré avec succès');
            
            return {
                url: liveUrl,
                matchId: liveState.matchId,
                binId: binId,
                qrCode: await generateQRCode(liveUrl)
            };
        } else {
            throw new Error('Échec de l\'upload vers JSONBin');
        }
        
    } catch (error) {
        console.error('Erreur génération lien live:', error);
        updateConnectionStatus('error', 'Erreur lors de la génération: ' + error.message);
        throw error;
    }
}

/**
 * Préparation des données du match pour le live
 */
async function prepareMatchData() {
    try {
        // Récupérer les données depuis l'application
        if (typeof footballApp !== 'undefined') {
            const state = footballApp.getState();
            const config = typeof getMatchConfig === 'function' ? getMatchConfig() : {};
            
            return {
                config: config,
                players: state.players || [],
                events: state.events || [],
                score: state.score || { team: 0, opponent: 0 },
                time: state.time || 0,
                half: state.half || 1,
                isPlaying: state.isPlaying || false
            };
        }
        
        // Fallback: données depuis le module match si disponible
        if (typeof matchModule !== 'undefined') {
            const matchState = matchModule.getState();
            return {
                config: { teamName: 'Mon Équipe', opponentName: 'Équipe Adverse' },
                players: [],
                events: matchState.events || [],
                score: { team: 0, opponent: 0 },
                time: matchState.currentTime / 60,
                half: matchState.currentHalf,
                isPlaying: matchState.isPlaying
            };
        }
        
        return null;
    } catch (error) {
        console.error('Erreur préparation données:', error);
        return null;
    }
}

// ===== SYNCHRONISATION =====

/**
 * Démarrage de la synchronisation live
 */
async function startLiveSync() {
    if (liveState.updateInterval) {
        clearInterval(liveState.updateInterval);
    }
    
    if (liveState.spectatorMode) {
        // Mode spectateur: récupération périodique
        liveState.updateInterval = setInterval(async () => {
            await fetchLiveData();
        }, LIVE_CONFIG.UPDATE_INTERVAL);
        
        // Première récupération immédiate
        await fetchLiveData();
    } else {
        // Mode créateur: envoi périodique
        liveState.updateInterval = setInterval(async () => {
            await pushLiveData();
        }, LIVE_CONFIG.UPDATE_INTERVAL);
        
        console.log('🔄 Synchronisation live démarrée (mode créateur)');
    }
}

/**
 * Arrêt de la synchronisation live
 */
function stopLiveSync() {
    if (liveState.updateInterval) {
        clearInterval(liveState.updateInterval);
        liveState.updateInterval = null;
    }
    
    liveState.isActive = false;
    updateConnectionStatus('disconnected', 'Synchronisation arrêtée');
    
    console.log('⏹️ Synchronisation live arrêtée');
}

/**
 * Envoi des données vers JSONBin (mode créateur)
 */
async function pushLiveData() {
    if (!liveState.binId) return;
    
    try {
        const matchData = await prepareMatchData();
        if (!matchData) return;
        
        // Ajouter les métadonnées de mise à jour
        const liveData = {
            ...matchData,
            liveInfo: {
                matchId: liveState.matchId,
                lastUpdate: new Date().toISOString(),
                updateCount: (liveState.updateCount || 0) + 1
            }
        };
        
        const success = await updateJsonBin(liveState.binId, liveData);
        
        if (success) {
            liveState.lastSyncTime = new Date().toISOString();
            liveState.updateCount = (liveState.updateCount || 0) + 1;
            liveState.retryCount = 0;
            
            updateConnectionStatus('connected', `Synchronisé • ${new Date().toLocaleTimeString()}`);
        } else {
            throw new Error('Échec de la mise à jour');
        }
        
    } catch (error) {
        console.error('Erreur push live:', error);
        handleSyncError(error);
    }
}

/**
 * Récupération des données depuis JSONBin (mode spectateur)
 */
async function fetchLiveData() {
    if (!liveState.binId) return;
    
    try {
        updateConnectionStatus('connecting', 'Récupération des données...');
        
        const data = await downloadFromJsonBin(liveState.binId);
        
        if (data) {
            // Vérifier si c'est une mise à jour
            const isNewData = !liveState.lastUpdate || 
                             (data.liveInfo && data.liveInfo.lastUpdate !== liveState.lastUpdate);
            
            if (isNewData) {
                await applyLiveData(data);
                liveState.lastUpdate = data.liveInfo?.lastUpdate || new Date().toISOString();
                liveState.retryCount = 0;
                
                updateConnectionStatus('connected', `Mis à jour • ${new Date().toLocaleTimeString()}`);
                console.log('📥 Données live reçues et appliquées');
            } else {
                updateConnectionStatus('connected', `En ligne • ${new Date().toLocaleTimeString()}`);
            }
        } else {
            throw new Error('Aucune donnée reçue');
        }
        
    } catch (error) {
        console.error('Erreur fetch live:', error);
        handleSyncError(error);
    }
}

/**
 * Application des données live reçues
 */
async function applyLiveData(data) {
    try {
        // Mettre à jour l'application si on est en mode spectateur
        if (liveState.spectatorMode && typeof displayMatchData === 'function') {
            displayMatchData(data);
        } else if (typeof footballApp !== 'undefined') {
            // Mettre à jour l'état de l'application
            const state = footballApp.getState();
            
            if (data.events) state.events = data.events;
            if (data.score) state.score = data.score;
            if (data.time !== undefined) state.time = data.time;
            if (data.half !== undefined) state.half = data.half;
            if (data.players) state.players = data.players;
            
            // Déclencher la mise à jour de l'affichage
            if (typeof footballApp.updateAllDisplays === 'function') {
                footballApp.updateAllDisplays();
            }
        }
        
        // Déclencher un événement personnalisé
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('liveDataUpdated', { 
                detail: data 
            }));
        }
        
    } catch (error) {
        console.error('Erreur application données live:', error);
    }
}

// ===== API JSONBIN.IO =====

/**
 * Upload initial vers JSONBin
 */
async function uploadToJsonBin(data) {
    try {
        const response = await fetchWithTimeout(LIVE_CONFIG.BASE_URL, {
            method: 'POST',
            headers: LIVE_CONFIG.getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('📤 Données uploadées vers JSONBin:', result.metadata.id);
            return result.metadata.id;
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Erreur upload JSONBin:', error);
        return null;
    }
}

/**
 * Mise à jour des données dans JSONBin
 */
async function updateJsonBin(binId, data) {
    try {
        const response = await fetchWithTimeout(`${LIVE_CONFIG.BASE_URL}/${binId}`, {
            method: 'PUT',
            headers: LIVE_CONFIG.getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            console.log('🔄 Données mises à jour dans JSONBin');
            return true;
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Erreur update JSONBin:', error);
        return false;
    }
}

/**
 * Téléchargement des données depuis JSONBin
 */
async function downloadFromJsonBin(binId) {
    try {
        const response = await fetchWithTimeout(`${LIVE_CONFIG.BASE_URL}/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': LIVE_CONFIG.API_KEY
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.record;
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Erreur download JSONBin:', error);
        return null;
    }
}

/**
 * Fetch avec timeout
 */
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LIVE_CONFIG.TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ===== GESTION D'ERREURS =====

/**
 * Gestion des erreurs de synchronisation
 */
function handleSyncError(error) {
    liveState.retryCount++;
    
    if (liveState.retryCount <= LIVE_CONFIG.MAX_RETRIES) {
        const retryDelay = Math.min(1000 * Math.pow(2, liveState.retryCount), 10000);
        
        updateConnectionStatus('error', 
            `Erreur • Nouvelle tentative dans ${Math.round(retryDelay/1000)}s (${liveState.retryCount}/${LIVE_CONFIG.MAX_RETRIES})`
        );
        
        setTimeout(() => {
            if (liveState.spectatorMode) {
                fetchLiveData();
            } else {
                pushLiveData();
            }
        }, retryDelay);
    } else {
        updateConnectionStatus('error', 'Connexion échouée • Arrêt de la synchronisation');
        stopLiveSync();
        
        if (typeof showNotification === 'function') {
            showNotification('Synchronisation live échouée après plusieurs tentatives', 'error');
        }
    }
}

/**
 * Mise à jour du statut de connexion
 */
function updateConnectionStatus(status, message) {
    liveState.connectionStatus = status;
    
    // Mettre à jour l'interface si les éléments existent
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const lastUpdate = document.getElementById('lastUpdate');
    
    const statusIcons = {
        disconnected: '⚫',
        connecting: '🔄',
        connected: '🟢',
        error: '🔴'
    };
    
    if (statusIcon) {
        statusIcon.textContent = statusIcons[status] || '⚫';
    }
    
    if (statusText) {
        statusText.textContent = message || status;
    }
    
    if (lastUpdate && status === 'connected') {
        lastUpdate.textContent = `Dernière sync: ${new Date().toLocaleTimeString()}`;
    }
    
    console.log(`📡 Live Status: ${status} - ${message}`);
}

// ===== UTILITAIRES =====

/**
 * Génération d'un QR Code pour le lien live
 */
async function generateQRCode(url) {
    try {
        // Utiliser l'API QR Server gratuite
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
        return qrUrl;
    } catch (error) {
        console.error('Erreur génération QR Code:', error);
        return null;
    }
}

/**
 * Copie du lien live dans le presse-papiers
 */
async function copyLiveLink(url) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
            return true;
        } else {
            // Fallback pour les navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999);
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return successful;
        }
    } catch (error) {
        console.error('Erreur copie lien:', error);
        return false;
    }
}

/**
 * Partage natif du lien live (mobile)
 */
async function shareLiveLink(url, title = 'Match Live - Football Stats') {
    try {
        if (navigator.share) {
            await navigator.share({
                title: title,
                text: 'Suivez le match en direct !',
                url: url
            });
            return true;
        } else {
            // Fallback: copier dans le presse-papiers
            return await copyLiveLink(url);
        }
    } catch (error) {
        console.error('Erreur partage lien:', error);
        return false;
    }
}

// ===== SAUVEGARDE ET CHARGEMENT =====

/**
 * Sauvegarde de l'état live
 */
function saveLiveState() {
    try {
        const dataToSave = {
            ...liveState,
            updateInterval: null // Ne pas sauvegarder l'interval
        };
        
        localStorage.setItem('footballLive_state', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Erreur sauvegarde état live:', error);
    }
}

/**
 * Chargement de l'état live
 */
function loadLiveState() {
    try {
        const saved = localStorage.getItem('footballLive_state');
        
        if (saved) {
            const data = JSON.parse(saved);
            liveState = {
                ...liveState,
                ...data,
                updateInterval: null,
                connectionStatus: 'disconnected'
            };
            
            console.log('État live chargé:', liveState);
        }
    } catch (error) {
        console.error('Erreur chargement état live:', error);
    }
}

/**
 * Nettoyage de l'état live
 */
function cleanupLive() {
    stopLiveSync();
    saveLiveState();
    console.log('🧹 Module Live nettoyé');
}

// ===== FONCTIONS PUBLIQUES =====

/**
 * API publique du module live
 */
const liveModule = {
    // Initialisation
    init: initializeLive,
    cleanup: cleanupLive,
    
    // Génération et partage
    generateLink: generateLiveLink,
    copyLink: copyLiveLink,
    shareLink: shareLiveLink,
    
    // Synchronisation
    start: startLiveSync,
    stop: stopLiveSync,
    push: pushLiveData,
    fetch: fetchLiveData,
    
    // État
    getState: () => ({ ...liveState }),
    isActive: () => liveState.isActive,
    isSpectator: () => liveState.spectatorMode,
    getStatus: () => liveState.connectionStatus,
    
    // Utilitaires
    prepareData: prepareMatchData,
    updateStatus: updateConnectionStatus
};

// ===== EXPORT ET INITIALISATION =====

// Export global
if (typeof window !== 'undefined') {
    window.liveModule = liveModule;
    
    // Auto-initialisation
    document.addEventListener('DOMContentLoaded', function() {
        initializeLive();
    });
    
    // Nettoyage avant fermeture
    window.addEventListener('beforeunload', cleanupLive);
    
    // Gestionnaire de visibilité pour optimiser la synchronisation
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && liveState.isActive) {
            // Réduire la fréquence quand la page n'est pas visible
            if (liveState.updateInterval) {
                clearInterval(liveState.updateInterval);
                liveState.updateInterval = setInterval(() => {
                    if (liveState.spectatorMode) {
                        fetchLiveData();
                    } else {
                        pushLiveData();
                    }
                }, LIVE_CONFIG.UPDATE_INTERVAL * 2); // Double l'intervalle
            }
        } else if (!document.hidden && liveState.isActive) {
            // Reprendre la fréquence normale
            startLiveSync();
        }
    });
}

console.log('📡 Module Live chargé');