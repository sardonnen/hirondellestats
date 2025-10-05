// ===== INITIALISATION GLOBALE DE L'APPLICATION =====

/**
 * Gestionnaire d'initialisation
 */
const AppInitializer = {
    isInitialized: false,
    currentPage: null,
    
    /**
     * Initialisation principale
     */
    init: function() {
        if (this.isInitialized) {
            console.warn('Application déjà initialisée');
            return;
        }
        
        console.log('🚀 Initialisation de Football Stats Manager...');
        
        // Détecter la page actuelle
        this.detectCurrentPage();
        
        // Vérifier les dépendances
        this.checkDependencies();
        
        // Initialiser footballApp si disponible
        this.initializeFootballApp();
        
        // Initialiser les gestionnaires d'événements globaux
        this.setupGlobalEventHandlers();
        
        // Initialisation spécifique à la page
        this.initializePageSpecific();
        
        this.isInitialized = true;
        console.log('✅ Application initialisée avec succès');
    },
    
    /**
     * Détecter la page actuelle
     */
    detectCurrentPage: function() {
        const path = window.location.pathname;
        
        if (path.includes('index.html') || path.endsWith('/')) {
            this.currentPage = 'home';
        } else if (path.includes('team.html')) {
            this.currentPage = 'team';
        } else if (path.includes('composition.html')) {
            this.currentPage = 'composition';
        } else if (path.includes('match.html')) {
            this.currentPage = 'match';
        } else if (path.includes('live.html')) {
            this.currentPage = 'live';
        } else if (path.includes('stats.html')) {
            this.currentPage = 'stats';
        } else {
            this.currentPage = 'unknown';
        }
        
        console.log(`📄 Page détectée: ${this.currentPage}`);
    },
    
    /**
     * Vérifier les dépendances
     */
    checkDependencies: function() {
        const dependencies = {
            'utils.js': typeof getPlayerName !== 'undefined',
            'storage.js': typeof footballStorage !== 'undefined',
            'app.js': typeof footballApp !== 'undefined'
        };
        
        let allLoaded = true;
        
        for (const [file, loaded] of Object.entries(dependencies)) {
            if (!loaded) {
                console.error(`❌ Dépendance manquante: ${file}`);
                allLoaded = false;
            } else {
                console.log(`✅ Dépendance chargée: ${file}`);
            }
        }
        
        if (!allLoaded) {
            console.error('⚠️ Certaines dépendances sont manquantes');
        }
    },
    
    /**
     * Initialiser footballApp
     */
    initializeFootballApp: function() {
        if (typeof footballApp !== 'undefined') {
            console.log('⚽ footballApp disponible');
            
            // Charger l'état sauvegardé
            if (typeof footballApp.getState === 'function') {
                const state = footballApp.getState();
                console.log('État de l\'application:', state);
            }
        } else {
            console.warn('⚠️ footballApp non disponible');
        }
    },
    
    /**
     * Configuration des gestionnaires d'événements globaux
     */
    setupGlobalEventHandlers: function() {
        // Fermeture des modales en cliquant à l'extérieur
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => modal.style.display = 'none');
            }
        });
        
        // Gestion de la touche Échap
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => modal.style.display = 'none');
            }
        });
        
        // Sauvegarde automatique avant fermeture
        window.addEventListener('beforeunload', function() {
            if (typeof footballApp !== 'undefined' && footballApp.saveState) {
                footballApp.saveState();
            }
        });
        
        console.log('👂 Gestionnaires d\'événements globaux configurés');
    },
    
    /**
     * Initialisation spécifique à la page
     */
    initializePageSpecific: function() {
        switch(this.currentPage) {
            case 'home':
                this.initHomePage();
                break;
            case 'team':
                this.initTeamPage();
                break;
            case 'composition':
                this.initCompositionPage();
                break;
            case 'match':
                this.initMatchPage();
                break;
            case 'live':
                this.initLivePage();
                break;
            case 'stats':
                this.initStatsPage();
                break;
            default:
                console.log('Page inconnue, initialisation générique');
        }
    },
    
    /**
     * Initialisation page d'accueil
     */
    initHomePage: function() {
        console.log('🏠 Initialisation page d\'accueil');
        // Logique spécifique déjà dans index.html
    },
    
    /**
     * Initialisation page équipe
     */
    initTeamPage: function() {
        console.log('👥 Initialisation page équipe');
        if (typeof initializeTeamPage === 'function') {
            initializeTeamPage();
        }
    },
    
    /**
     * Initialisation page composition
     */
    initCompositionPage: function() {
        console.log('📋 Initialisation page composition');
        if (typeof initializeCompositionPage === 'function') {
            initializeCompositionPage();
        }
    },
    
    /**
     * Initialisation page match
     */
    initMatchPage: function() {
        console.log('⚽ Initialisation page match');
        if (typeof initializeMatchPage === 'function') {
            initializeMatchPage();
        }
    },
    
    /**
     * Initialisation page live
     */
    initLivePage: function() {
        console.log('📺 Initialisation page live');
        if (typeof checkLiveMode === 'function') {
            checkLiveMode();
        }
    },
    
    /**
     * Initialisation page stats
     */
    initStatsPage: function() {
        console.log('📊 Initialisation page stats');
        if (typeof initializeStatsPage === 'function') {
            initializeStatsPage();
        }
    }
};

// Auto-initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    AppInitializer.init();
});

console.log('✅ Module init.js chargé');