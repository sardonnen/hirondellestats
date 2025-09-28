// ===== SCRIPT DE CONFIGURATION AUTOMATIQUE =====

/**
 * Script d'aide à la configuration de l'application Football Stats
 * Facilite le premier démarrage et la configuration des API
 */

// ===== CONFIGURATION PAR DÉFAUT =====
const DEFAULT_CONFIG = {
    app: {
        name: 'Football Stats Manager',
        version: '1.0.0',
        description: 'Application de gestion des statistiques de football'
    },
    match: {
        duration: 90, // Minutes
        halftimeDuration: 15, // Minutes
        maxSubstitutions: 5,
        maxCards: 10
    },
    live: {
        updateInterval: 5000, // 5 secondes
        maxRetries: 3,
        timeout: 10000 // 10 secondes
    },
    ui: {
        theme: 'default',
        language: 'fr',
        autoSave: true,
        notifications: true
    }
};

// ===== FONCTIONS DE CONFIGURATION =====

/**
 * Initialisation de l'application
 */
function initializeApp() {
    console.log('🚀 Initialisation de Football Stats Manager...');
    
    // Vérifier la compatibilité du navigateur
    if (!checkBrowserCompatibility()) {
        showCompatibilityError();
        return false;
    }
    
    // Vérifier le stockage local
    if (!checkLocalStorageSupport()) {
        showStorageError();
        return false;
    }
    
    // Charger la configuration
    loadConfiguration();
    
    // Configurer l'interface
    setupUI();
    
    // Vérifier les APIs
    checkAPIConfiguration();
    
    // Afficher le message de bienvenue
    showWelcomeMessage();
    
    console.log('✅ Application initialisée avec succès');
    return true;
}

/**
 * Vérification de la compatibilité du navigateur
 */
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'localStorage' in window,
        'fetch' in window,
        'JSON' in window,
        'addEventListener' in window,
        'querySelector' in document
    ];
    
    const isCompatible = requiredFeatures.every(feature => feature);
    
    if (!isCompatible) {
        console.error('❌ Navigateur non compatible');
    }
    
    return isCompatible;
}

/**
 * Vérification du support localStorage
 */
function checkLocalStorageSupport() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.error('❌ LocalStorage non disponible');
        return false;
    }
}

/**
 * Chargement de la configuration
 */
function loadConfiguration() {
    try {
        const saved = localStorage.getItem('footballStats_config');
        
        if (saved) {
            const config = JSON.parse(saved);
            console.log('📋 Configuration chargée:', config);
            return { ...DEFAULT_CONFIG, ...config };
        } else {
            console.log('📋 Configuration par défaut appliquée');
            saveConfiguration(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
    } catch (error) {
        console.error('❌ Erreur chargement configuration:', error);
        return DEFAULT_CONFIG;
    }
}

/**
 * Sauvegarde de la configuration
 */
function saveConfiguration(config) {
    try {
        localStorage.setItem('footballStats_config', JSON.stringify(config));
        console.log('💾 Configuration sauvegardée');
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde configuration:', error);
        return false;
    }
}

/**
 * Configuration de l'interface utilisateur
 */
function setupUI() {
    // Configurer le thème
    document.documentElement.setAttribute('data-theme', 'default');
    
    // Ajouter les meta tags si ils n'existent pas
    addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    addMetaTag('description', 'Application de gestion des statistiques de football');
    addMetaTag('keywords', 'football, stats, match, live, sport');
    
    // Configurer les liens de navigation
    setupNavigation();
    
    // Ajouter les gestionnaires d'événements globaux
    setupGlobalEventHandlers();
    
    console.log('🎨 Interface configurée');
}

/**
 * Ajout d'un meta tag
 */
function addMetaTag(name, content) {
    if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
    }
}

/**
 * Configuration de la navigation
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        // Ajouter la classe active selon la page actuelle
        const href = link.getAttribute('href');
        const currentPage = window.location.pathname.split('/').pop();
        
        if (href && (href.includes(currentPage) || 
            (currentPage === '' && href.includes('index.html')))) {
            link.classList.add('active');
        }
        
        // Ajouter l'effet de hover
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Configuration des gestionnaires d'événements globaux
 */
function setupGlobalEventHandlers() {
    // Gestionnaire d'erreurs global
    window.addEventListener('error', function(event) {
        console.error('❌ Erreur JavaScript:', event.error);
        showErrorNotification('Une erreur est survenue. Rechargez la page si le problème persiste.');
    });
    
    // Gestionnaire de perte de connexion
    window.addEventListener('offline', function() {
        showErrorNotification('Connexion internet perdue. Le mode live sera désactivé.');
    });
    
    window.addEventListener('online', function() {
        showSuccessNotification('Connexion internet rétablie.');
    });
    
    // Prévenir la perte de données
    window.addEventListener('beforeunload', function(event) {
        if (hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
        }
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + S = Sauvegarde
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            saveCurrentData();
        }
        
        // Échap = Fermer modales
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Vérification de la configuration des APIs
 */
function checkAPIConfiguration() {
    // Vérifier JSONBin.io
    checkJSONBinConfiguration();
    
    // Afficher le statut dans la console
    console.log('🔌 Vérification des APIs terminée');
}

/**
 * Vérification de la configuration JSONBin.io
 */
function checkJSONBinConfiguration() {
    const defaultKey = '$2a$10$r5MbOaRyivoihBZSwAHKkOmtvWIkz6d7lOgfXHlj/0V.YKj4HSQfe';
    
    // Vérifier storage.js
    fetch('./js/storage.js')
        .then(response => response.text())
        .then(content => {
            if (content.includes(defaultKey)) {
                console.warn('⚠️ Clé API JSONBin par défaut détectée');
                showAPIConfigurationWarning();
            } else {
                console.log('✅ Clé API JSONBin configurée');
            }
        })
        .catch(() => {
            console.warn('⚠️ Impossible de vérifier la configuration JSONBin');
        });
}

/**
 * Affichage d'un avertissement de configuration API
 */
function showAPIConfigurationWarning() {
    if (typeof showNotification === 'function') {
        showNotification(
            'Configuration recommandée : Remplacez la clé API JSONBin.io par votre propre clé pour activer le mode live.',
            'warning',
            10000
        );
    }
    
    // Ajouter un indicateur visuel
    addConfigurationBanner();
}

/**
 * Ajout d'une bannière de configuration
 */
function addConfigurationBanner() {
    const banner = document.createElement('div');
    banner.id = 'configBanner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #f39c12, #e67e22);
        color: white;
        padding: 10px;
        text-align: center;
        font-weight: bold;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    banner.innerHTML = `
        ⚙️ Configuration recommandée : 
        <a href="#" onclick="showConfigurationHelp()" style="color: white; text-decoration: underline;">
            Configurer votre clé API JSONBin.io
        </a>
        <span onclick="dismissConfigurationBanner()" style="float: right; cursor: pointer; padding: 0 10px;">✕</span>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Ajuster le padding du body
    document.body.style.paddingTop = '50px';
}

/**
 * Affichage de l'aide à la configuration
 */
function showConfigurationHelp() {
    const helpText = `
📋 Configuration de la clé API JSONBin.io :

1. Créez un compte gratuit sur https://jsonbin.io
2. Générez une clé API dans votre dashboard
3. Remplacez la clé dans les fichiers :
   - js/storage.js (ligne 8)
   - js/live.js (ligne 10)
4. Rechargez l'application

La clé API permet d'activer :
✅ Partage live des matchs
✅ Synchronisation temps réel
✅ Mode spectateur mobile

Sans clé API personnalisée :
⚠️ Seul le stockage local fonctionne
⚠️ Pas de partage live possible
    `;
    
    alert(helpText);
}

/**
 * Fermeture de la bannière de configuration
 */
function dismissConfigurationBanner() {
    const banner = document.getElementById('configBanner');
    if (banner) {
        banner.remove();
        document.body.style.paddingTop = '0';
        
        // Marquer comme fermée pour cette session
        sessionStorage.setItem('configBannerDismissed', 'true');
    }
}

/**
 * Message de bienvenue
 */
function showWelcomeMessage() {
    // Vérifier si c'est la première visite
    const isFirstVisit = !localStorage.getItem('footballStats_visited');
    
    if (isFirstVisit) {
        localStorage.setItem('footballStats_visited', new Date().toISOString());
        
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification(
                    '🎉 Bienvenue dans Football Stats Manager ! Commencez par créer votre équipe.',
                    'success',
                    5000
                );
            }
            
            // Mettre en évidence le lien "Équipe"
            highlightTeamLink();
        }, 1000);
    }
}

/**
 * Mise en évidence du lien équipe
 */
function highlightTeamLink() {
    const teamLink = document.querySelector('a[href*="team.html"]');
    if (teamLink) {
        teamLink.style.animation = 'pulse 2s infinite';
        teamLink.style.background = 'rgba(52, 152, 219, 0.3)';
        
        // Retirer l'effet après 10 secondes
        setTimeout(() => {
            teamLink.style.animation = '';
            teamLink.style.background = '';
        }, 10000);
    }
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Vérification des modifications non sauvegardées
 */
function hasUnsavedChanges() {
    // Vérifier s'il y a des données temporaires
    return sessionStorage.getItem('hasUnsavedChanges') === 'true';
}

/**
 * Sauvegarde des données actuelles
 */
function saveCurrentData() {
    if (typeof footballApp !== 'undefined' && footballApp.saveState) {
        footballApp.saveState();
        showSuccessNotification('Données sauvegardées !');
        sessionStorage.removeItem('hasUnsavedChanges');
    }
}

/**
 * Fermeture de toutes les modales
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

/**
 * Affichage d'erreur de compatibilité
 */
function showCompatibilityError() {
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1 style="color: #e74c3c;">❌ Navigateur Non Compatible</h1>
            <p style="font-size: 18px; margin: 20px 0;">
                Votre navigateur ne supporte pas toutes les fonctionnalités requises.
            </p>
            <p style="margin: 20px 0;">
                Veuillez utiliser une version récente de :
            </p>
            <ul style="list-style: none; padding: 0;">
                <li>• Chrome 60+</li>
                <li>• Firefox 55+</li>
                <li>• Safari 12+</li>
                <li>• Edge 79+</li>
            </ul>
            <button onclick="location.reload()" style="
                background: #3498db; 
                color: white; 
                border: none; 
                padding: 15px 30px; 
                border-radius: 8px; 
                font-size: 16px; 
                cursor: pointer;
                margin-top: 20px;
            ">
                🔄 Réessayer
            </button>
        </div>
    `;
}

/**
 * Affichage d'erreur de stockage
 */
function showStorageError() {
    alert(`
❌ Stockage Local Non Disponible

L'application nécessite le stockage local pour fonctionner.

Solutions possibles :
• Désactiver le mode privé/incognito
• Autoriser les cookies et le stockage
• Vérifier les paramètres de sécurité du navigateur

Rechargez la page après avoir effectué ces changements.
    `);
}

/**
 * Notification de succès
 */
function showSuccessNotification(message) {
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    } else {
        console.log('✅ ' + message);
    }
}

/**
 * Notification d'erreur
 */
function showErrorNotification(message) {
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        console.error('❌ ' + message);
    }
}

// ===== DIAGNOSTICS ET DEBUG =====

/**
 * Diagnostic complet du système
 */
function runDiagnostics() {
    console.log('🔍 Diagnostic du système...');
    
    const diagnostics = {
        browser: getBrowserInfo(),
        storage: getStorageInfo(),
        apis: getAPIStatus(),
        performance: getPerformanceInfo(),
        configuration: loadConfiguration()
    };
    
    console.table(diagnostics);
    return diagnostics;
}

/**
 * Informations du navigateur
 */
function getBrowserInfo() {
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        cookiesEnabled: navigator.cookieEnabled
    };
}

/**
 * Informations de stockage
 */
function getStorageInfo() {
    const storage = {
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        usage: 0,
        keys: 0
    };
    
    try {
        let totalSize = 0;
        let totalKeys = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
                totalKeys++;
            }
        }
        
        storage.usage = Math.round(totalSize / 1024) + ' KB';
        storage.keys = totalKeys;
    } catch (e) {
        storage.error = e.message;
    }
    
    return storage;
}

/**
 * Statut des APIs
 */
function getAPIStatus() {
    return {
        fetch: 'fetch' in window,
        jsonbin: 'En cours de vérification...',
        websockets: 'WebSocket' in window,
        notifications: 'Notification' in window
    };
}

/**
 * Informations de performance
 */
function getPerformanceInfo() {
    if ('performance' in window) {
        return {
            loadTime: Math.round(performance.now()) + ' ms',
            memory: performance.memory ? 
                Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB' : 
                'Non disponible'
        };
    }
    
    return { available: false };
}

// ===== EXPORT ET INITIALISATION =====

// Export des fonctions utilitaires
if (typeof window !== 'undefined') {
    window.setupManager = {
        init: initializeApp,
        config: {
            load: loadConfiguration,
            save: saveConfiguration,
            default: DEFAULT_CONFIG
        },
        diagnostics: runDiagnostics,
        utils: {
            saveData: saveCurrentData,
            closeModals: closeAllModals,
            checkCompatibility: checkBrowserCompatibility
        }
    };
}

// Auto-initialisation
if (typeof document !== 'undefined') {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        // DOM déjà prêt
        initializeApp();
    }
}

console.log('🔧 Module Setup chargé');