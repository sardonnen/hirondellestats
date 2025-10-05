// ===== FONCTIONS UTILITAIRES PARTAGÉES =====

/**
 * Obtenir le nom d'un joueur depuis son ID
 */
function getPlayerName(playerId) {
    if (playerId === 'opponent' || playerId === 'opponent_player') {
        return 'Équipe Adverse';
    }
    
    if (playerId === 'my_goalkeeper') {
        const players = getMyTeamPlayers();
        const goalkeeper = players.find(p => 
            p.status === 'field' && 
            p.position && 
            p.position.toLowerCase().includes('garden')
        );
        return goalkeeper ? goalkeeper.name : 'Mon Gardien';
    }
    
    if (playerId === 'opponent_goalkeeper') {
        return 'Gardien Adverse';
    }
    
    if (typeof footballApp !== 'undefined') {
        const state = footballApp.getState();
        const player = state.players.find(p => p.id === playerId);
        return player ? player.name : 'Joueur Inconnu';
    }
    
    return 'Joueur';
}

/**
 * Obtenir les joueurs de l'équipe
 */
function getMyTeamPlayers() {
    if (typeof footballApp !== 'undefined' && footballApp.getState) {
        const appState = footballApp.getState();
        if (appState.players && appState.players.length > 0) {
            return appState.players;
        }
    }
    
    const players = JSON.parse(localStorage.getItem('footballStats_players') || '[]');
    
    return players.map(player => ({
        ...player,
        status: player.status || 'bench',
        id: player.id || `player_${Date.now()}_${Math.random()}`
    }));
}

/**
 * Obtenir la configuration du match
 */
function getMatchConfig() {
    const saved = localStorage.getItem('footballStats_matchConfig');
    if (saved) {
        return JSON.parse(saved);
    }
    
    return {
        teamName: 'Mon Équipe',
        opponentName: 'Équipe Adverse',
        venue: 'Stade Municipal',
        matchDate: new Date().toISOString()
    };
}

/**
 * Sauvegarder une donnée dans le localStorage
 */
function saveData(key, data) {
    try {
        const serialized = JSON.stringify(data);
        const size = new Blob([serialized]).size;
        
        if (size > 4.5 * 1024 * 1024) { // 4.5MB
            throw new Error('Données trop volumineuses');
        }
        
        localStorage.setItem(`footballStats_${key}`, serialized);
        return { success: true };
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            return { 
                success: false, 
                error: 'QUOTA_EXCEEDED',
                message: 'Mémoire pleine. Exportez et supprimez d\'anciens matchs.'
            };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Charger une donnée depuis le localStorage
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
 * Supprimer une donnée du localStorage
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
 * Obtenir l'icône d'une position
 */
function getPositionIcon(position) {
    const icons = {
        'gardienne': '🥅',
        'défenseure': '🛡️',
        'milieu': '⚙️',
        'attaquante': '⚽'
    };
    return icons[position] || '👤';
}

/**
 * Formater le temps en MM:SS
 */
function formatTime(timeInMinutes) {
    const minutes = Math.floor(timeInMinutes);
    const seconds = Math.floor((timeInMinutes % 1) * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Obtenir l'icône d'un événement
 */
function getEventIcon(event) {
    const icons = {
        'goal': '⚽',
        'assist': '➡️',
        'shot': '🎯',
        'card': event.cardType === 'yellow' ? '🟨' : event.cardType === 'red' ? '🟥' : '⬜',
        'foul': '⚠️',
        'save': '🧤',
        'freeKick': '⚽',
        'substitution': '🔄',
        'halfTime': '⏱️',
        'timeout': '⏰',
        'injury': '🏥',
        'offside': '🚩',
        'corner': '🚩'
    };
    return icons[event.type] || '📝';
}

/**
 * Attendre que footballApp soit disponible
 */
function waitForFootballApp(callback) {
    if (typeof footballApp !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForFootballApp(callback), 100);
    }
}

/**
 * Afficher une notification
 */
function showNotification(message, type = 'info') {
    if (typeof footballApp !== 'undefined' && footballApp.showNotification) {
        footballApp.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Vérifier si un élément existe dans le DOM
 */
function elementExists(id) {
    return document.getElementById(id) !== null;
}

/**
 * Mettre à jour un élément si il existe
 */
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
        return true;
    }
    return false;
}

/**
 * Obtenir le statut d'un joueur en texte
 */
function getStatusText(status) {
    const statusTexts = {
        'field': '🟢 Titulaire',
        'bench': '🪑 Remplaçante',
        'available': '⚪ Disponible',
        'sanctioned': '⚠️ Sanctionnée',
        'out': '🔴 Sortie'
    };
    return statusTexts[status] || status;
}

/**
 * Validation d'email simple
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Générer un ID unique
 */
function generateUniqueId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Copier du texte dans le presse-papiers
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback pour les anciens navigateurs
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    } catch (error) {
        console.error('Erreur copie presse-papiers:', error);
        return false;
    }
}

/**
 * Débounce - limite les appels de fonction
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Vérifier si l'application est en mode mobile
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Formater une date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

console.log('✅ Module utils.js chargé');