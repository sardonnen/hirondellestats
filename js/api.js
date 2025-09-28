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
        
        // Créer ou mettre à jour le bin
        let binId = currentMatch.liveId;
        
        if (!binId) {
            binId = await createLiveBin(liveData);
            currentMatch.liveId = binId;
        } else {
            await updateLiveBin(binId, liveData);
        }
        
        // Générer le lien
        const liveLink = `${window.location.origin}${window.location.pathname}?live=${binId}`;
        
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
        
    } catch (error) {
        console.error('Erreur génération lien:', error);
        showNotification('Erreur lors de la génération du lien', 'error');
    }
}

// Créer un nouveau bin
async function createLiveBin(data) {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
    }
    
    const result = await response.json();
    return result.metadata.id;
}

// Mettre à jour un bin existant
async function updateLiveBin(binId, data) {
    const response = await fetch(`${API_BASE_URL}/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
    }
    
    return await response.json();
}

// Récupérer les données d'un bin
async function getLiveData(binId) {
    const response = await fetch(`${API_BASE_URL}/${binId}/latest`, {
        headers: {
            'X-Master-Key': API_KEY
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
    }
    
    const result = await response.json();
    return result.record;
}

// Mettre à jour les données live (appelé automatiquement lors des événements)
async function updateLiveData() {
    if (!currentMatch.liveId) return;
    
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
        
        await updateLiveBin(currentMatch.liveId, liveData);
        console.log('Données live mises à jour');
        
    } catch (error) {
        console.error('Erreur mise à jour live:', error);
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
        // Méthode moderne pour partager sur mobile
        if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
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
            throw new Error('Copie échouée');
        }
        
    } catch (error) {
        console.error('Erreur copie:', error);
        linkInput.select();
        showNotification('Veuillez copier manuellement le lien sélectionné', 'info');
    }
}

// Initialiser la vue live
async function initializeLiveView(liveId) {
    console.log('Initialisation du mode live, ID:', liveId);
    
    try {
        // Cacher les éléments de navigation et actions
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.display = 'none';
        }
        
        // Masquer le message d'attente et afficher le chargement
        const waitingMessage = document.getElementById('waitingMessage');
        if (waitingMessage) {
            waitingMessage.innerHTML = `
                <h3>📡 Chargement du match live...</h3>
                <p>Récupération des données en cours...</p>
            `;
        }
        
        // Charger les données depuis l'API
        const liveData = await getLiveData(liveId);
        console.log('Données live récupérées:', liveData);
        
        // Mettre à jour les variables globales
        stats = liveData.stats || {
            team1: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 },
            team2: { goals: 0, shots: 0, fouls: 0, yellowCards: 0, redCards: 0, whiteCards: 0 }
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
            liveId: liveId
        };
        
        // Afficher les données live
        displayLiveMatch();
        
        // Démarrer la mise à jour automatique
        startLiveUpdates(liveId);
        
    } catch (error) {
        console.error('Erreur chargement live:', error);
        showLiveError();
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
        container.innerHTML += '<p style="text-align: center; color: #bdc3c7;">Aucun événement pour le moment</p>';
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
}

// Démarrer les mises à jour automatiques
function startLiveUpdates(liveId) {
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
        }
    }, 5000);
}

// Afficher une erreur en mode live
function showLiveError() {
    const waitingMessage = document.getElementById('waitingMessage');
    if (waitingMessage) {
        waitingMessage.innerHTML = `
            <h3>❌ Erreur de chargement</h3>
            <p>Impossible de charger les données du match live.</p>
            <p>Vérifiez le lien ou réessayez plus tard.</p>
            <button class="btn btn-primary" onclick="window.location.href = window.location.pathname">
                🏠 Retour à l'accueil
            </button>
        `;
    }
}