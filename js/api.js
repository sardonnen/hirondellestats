// js/api.js - Gestion API jsonbin.io pour le live

const API_KEY = '$2a$10$r5MbOaRyivoihBZSwAHKkO';
const API_BASE_URL = 'https://api.jsonbin.io/v3/b';

// Fonction pour générer un lien live
async function generateLiveLink() {
    if (!currentMatch.id) {
        showNotification('Démarrez un match avant de générer le lien live', 'error');
        return;
    }
    
    try {
        showNotification('Génération du lien live...', 'info');
        console.log('Génération lien live pour match:', currentMatch.id);
        
        // Données à synchroniser
        const liveData = {
            matchId: currentMatch.id,
            team1: currentMatch.team1 || 'Mon Équipe',
            team2: currentMatch.team2 || 'Équipe Adverse',
            venue: currentMatch.venue || 'Terrain',
            stats: stats,
            events: events,
            timer: {
                minutes: timer.minutes,
                seconds: timer.seconds,
                isRunning: timer.isRunning
            },
            lastUpdate: new Date().toISOString()
        };
        
        console.log('Données à envoyer:', liveData);
        
        // Créer ou mettre à jour le bin
        let binId = currentMatch.liveId;
        
        if (!binId) {
            console.log('Création d\'un nouveau bin...');
            binId = await createLiveBin(liveData);
            currentMatch.liveId = binId;
            console.log('Bin créé avec ID:', binId);
        } else {
            console.log('Mise à jour du bin existant:', binId);
            await updateLiveBin(binId, liveData);
        }
        
        // Générer le lien
        const liveLink = `${window.location.origin}${window.location.pathname}?live=${binId}`;
        console.log('Lien généré:', liveLink);
        
        // Afficher le lien
        const linkInput = document.getElementById('liveLink');
        const copyBtn = document.getElementById('copyLinkBtn');
        
        if (linkInput) {
            linkInput.value = liveLink;
            linkInput.style.display = 'block';
        }
        
        if (copyBtn) {
            copyBtn.style.display = 'inline-block';
        }
        
        saveData();
        showNotification('Lien live généré !', 'success');
        
        // Auto-copie sur mobile Android
        if (/Android/i.test(navigator.userAgent)) {
            setTimeout(() => {
                copyLiveLink();
            }, 1000);
        }
        
    } catch (error) {
        console.error('Erreur génération lien:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

// Créer un nouveau bin
async function createLiveBin(data) {
    console.log('Création bin avec API_KEY:', API_KEY.substring(0, 10) + '...');
    
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY,
            'X-Bin-Name': `football-match-${Date.now()}`
        },
        body: JSON.stringify(data)
    });
    
    console.log('Réponse création:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API création:', errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Résultat création:', result);
    
    if (!result.metadata || !result.metadata.id) {
        throw new Error('ID du bin non reçu');
    }
    
    return result.metadata.id;
}

// Mettre à jour un bin existant
async function updateLiveBin(binId, data) {
    console.log('Mise à jour bin:', binId);
    
    const response = await fetch(`${API_BASE_URL}/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify(data)
    });
    
    console.log('Réponse mise à jour:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API mise à jour:', errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Mise à jour réussie');
    return result;
}

// Récupérer les données d'un bin
async function getLiveData(binId) {
    console.log('Récupération données bin:', binId);
    
    const response = await fetch(`${API_BASE_URL}/${binId}/latest`, {
        headers: {
            'X-Master-Key': API_KEY
        }
    });
    
    console.log('Réponse récupération:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API récupération:', errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Données récupérées:', result);
    
    if (!result.record) {
        throw new Error('Aucune donnée trouvée');
    }
    
    return result.record;
}

// Mettre à jour les données live (appelé automatiquement lors des événements)
async function updateLiveData() {
    if (!currentMatch.liveId) {
        console.log('Pas de liveId, pas de mise à jour live');
        return;
    }
    
    try {
        const liveData = {
            matchId: currentMatch.id,
            team1: currentMatch.team1 || 'Mon Équipe',
            team2: currentMatch.team2 || 'Équipe Adverse',
            venue: currentMatch.venue || 'Terrain',
            stats: stats,
            events: events,
            timer: {
                minutes: timer.minutes,
                seconds: timer.seconds,
                isRunning: timer.isRunning
            },
            lastUpdate: new Date().toISOString()
        };
        
        console.log('Mise à jour automatique live...');
        await updateLiveBin(currentMatch.liveId, liveData);
        console.log('Live mis à jour automatiquement');
        
    } catch (error) {
        console.error('Erreur mise à jour live automatique:', error);
        // Ne pas notifier l'utilisateur pour les erreurs automatiques
    }
}

// Copier le lien live
async function copyLiveLink() {
    const linkInput = document.getElementById('liveLink');
    const link = linkInput ? linkInput.value : '';
    
    if (!link) {
        showNotification('Aucun lien à copier', 'error');
        return;
    }
    
    try {
        // Méthode moderne pour partager sur mobile Android
        if (navigator.share && /Android/i.test(navigator.userAgent)) {
            await navigator.share({
                title: 'Match Live - Football Stats',
                text: 'Suivez le match en direct !',
                url: link
            });
            showNotification('Lien partagé !', 'success');
            return;
        }
        
        // Méthode clipboard moderne
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(link);
            showNotification('Lien copié !', 'success');
            return;
        }
        
        // Fallback pour navigateurs anciens
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Lien copié !', 'success');
        } else {
            // Dernière option : sélectionner pour copie manuelle
            linkInput.select();
            showNotification('Lien sélectionné - copiez manuellement', 'info');
        }
        
    } catch (error) {
        console.error('Erreur copie:', error);
        // En dernier recours, sélectionner le texte pour copie manuelle
        linkInput.select();
        showNotification('Lien sélectionné - copiez manuellement', 'info');
    }
}

// Initialiser la vue live
async function initializeLiveView(liveId) {
    console.log('Initialisation du mode live, ID:', liveId);
    
    try {
        // Cacher les éléments de navigation
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.display = 'none';
        }
        
        // Masquer le message d'attente et afficher le chargement
        const waitingMessage = document.getElementById('waitingMessage');
        if (waitingMessage) {
            waitingMessage.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
                    <h3>Chargement du match live...</h3>
                    <p>Récupération des données en cours...</p>
                    <div style="margin-top: 2rem;">
                        <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    </div>
                </div>
            `;
        }
        
        // Charger les données depuis l'API
        console.log('Chargement des données live...');
        const liveData = await getLiveData(liveId);
        console.log('Données live récupérées:', liveData);
        
        // Mettre à jour les variables globales
        stats = liveData.stats || {
            team1: { goals: 0, shots: 0, shotsOn: 0, shotsOff: 0, saves: 0, fouls: 0, freeKicks: 0, yellowCards: 0, redCards: 0, whiteCards: 0 },
            team2: { goals: 0, shots: 0, shotsOn: 0, shotsOff: 0, saves: 0, fouls: 0, freeKicks: 0, yellowCards: 0, redCards: 0, whiteCards: 0 }
        };
        events = liveData.events || [];
        
        if (liveData.timer) {
            timer.minutes = liveData.timer.minutes || 0;
            timer.seconds = liveData.timer.seconds || 0;
            timer.isRunning = liveData.timer.isRunning || false;
        }
        
        currentMatch = {
            id: liveData.matchId,
            team1: liveData.team1,
            team2: liveData.team2,
            venue: liveData.venue,
            liveId: liveId,
            lastUpdate: liveData.lastUpdate
        };
        
        console.log('Données live chargées, affichage...');
        
        // Afficher les données live
        displayLiveMatch();
        
        // Démarrer la mise à jour automatique
        startLiveUpdates(liveId);
        
    } catch (error) {
        console.error('Erreur chargement live:', error);
        showLiveError(error.message);
    }
}

// Afficher le match en mode live
function displayLiveMatch() {
    const waitingMessage = document.getElementById('waitingMessage');
    const liveMatch = document.getElementById('liveMatch');
    
    if (waitingMessage) waitingMessage.style.display = 'none';
    if (liveMatch) liveMatch.style.display = 'block';
    
    updateLiveDisplay();
}

// Mettre à jour l'affichage live
function updateLiveDisplay() {
    console.log('Mise à jour affichage live');
    
    // Noms des équipes
    const liveTeam1 = document.getElementById('liveTeam1');
    const liveTeam2 = document.getElementById('liveTeam2');
    
    if (liveTeam1) liveTeam1.textContent = currentMatch.team1 || 'Équipe 1';
    if (liveTeam2) liveTeam2.textContent = currentMatch.team2 || 'Équipe 2';
    
    // Scores
    const liveScore1 = document.getElementById('liveScore1');
    const liveScore2 = document.getElementById('liveScore2');
    
    if (liveScore1) liveScore1.textContent = stats.team1.goals;
    if (liveScore2) liveScore2.textContent = stats.team2.goals;
    
    // Timer
    const liveTimer = document.getElementById('liveTimer');
    if (liveTimer) {
        const minutes = String(timer.minutes).padStart(2, '0');
        const seconds = String(timer.seconds).padStart(2, '0');
        liveTimer.textContent = `${minutes}:${seconds}`;
        
        // Ajouter un indicateur si le match est en cours
        if (timer.isRunning) {
            liveTimer.style.color = '#2ecc71';
            liveTimer.textContent += ' ▶️';
        } else {
            liveTimer.style.color = '#f39c12';
        }
    }
    
    // Événements
    updateLiveEvents();
}

// Mettre à jour les événements live
function updateLiveEvents() {
    const container = document.getElementById('liveEvents');
    if (!container) return;
    
    container.innerHTML = '<h3>⏱️ Événements du match</h3>';
    
    if (events.length === 0) {
        container.innerHTML += '<p style="text-align: center; color: #bdc3c7; padding: 2rem;">Aucun événement pour le moment</p>';
        return;
    }
    
    events.forEach(event => {
        const div = document.createElement('div');
        div.className = `timeline-event ${event.team ? event.team + '-event' : ''}`;
        div.innerHTML = `
            <strong>${event.time}</strong> ${event.icon} 
            <strong>${event.player}</strong> - ${event.description}
        `;
        container.appendChild(div);
    });
    
    // Scroll vers le bas pour voir les derniers événements
    container.scrollTop = container.scrollHeight;
}

// Démarrer les mises à jour automatiques
function startLiveUpdates(liveId) {
    console.log('Démarrage des mises à jour automatiques live');
    
    // Mettre à jour toutes les 5 secondes
    setInterval(async () => {
        try {
            const liveData = await getLiveData(liveId);
            
            // Vérifier s'il y a des changements
            const lastUpdate = new Date(liveData.lastUpdate).getTime();
            const currentLastUpdate = currentMatch.lastUpdate ? new Date(currentMatch.lastUpdate).getTime() : 0;
            
            if (lastUpdate > currentLastUpdate) {
                console.log('Nouvelles données détectées, mise à jour...');
                
                // Mettre à jour les données
                stats = liveData.stats;
                events = liveData.events;
                timer = liveData.timer;
                currentMatch.lastUpdate = liveData.lastUpdate;
                
                // Mettre à jour l'affichage
                updateLiveDisplay();
            }
            
        } catch (error) {
            console.error('Erreur mise à jour live:', error);
            // Continuer à essayer même en cas d'erreur
        }
    }, 5000);
}

// Afficher une erreur en mode live
function showLiveError(errorMessage = '') {
    const waitingMessage = document.getElementById('waitingMessage');
    if (waitingMessage) {
        waitingMessage.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les données du match live.</p>
                ${errorMessage ? `<p style="color: #e74c3c; font-size: 0.9rem;">Détail: ${errorMessage}</p>` : ''}
                <div style="margin-top: 2rem;">
                    <button class="btn btn-primary" onclick="window.location.href = window.location.pathname">
                        🏠 Retour à l'accueil
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-left: 1rem;">
                        🔄 Réessayer
                    </button>
                </div>
            </div>
        `;
    }
}

// Test de connexion API (fonction de debug)
async function testAPIConnection() {
    try {
        console.log('Test de connexion à jsonbin.io...');
        
        const testData = {
            test: true,
            timestamp: new Date().toISOString()
        };
        
        const binId = await createLiveBin(testData);
        console.log('Test réussi, bin créé:', binId);
        
        const retrievedData = await getLiveData(binId);
        console.log('Test récupération réussi:', retrievedData);
        
        showNotification('Test API réussi !', 'success');
        return true;
        
    } catch (error) {
        console.error('Test API échoué:', error);
        showNotification(`Test API échoué: ${error.message}`, 'error');
        return false;
    }
}