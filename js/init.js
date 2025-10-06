// init.js - Initialisation centralisée 

/**
 * Système d'initialisation centralisé pour Football Stats Manager
 */

(function() {
    'use strict';

    console.log('🚀 Initialisation de Football Stats Manager...');

    // Configuration
    const CONFIG = {
        appName: 'Football Stats Manager',
        version: '1.0.0',
        dependencies: {
            utils: ['debounce', 'formatDate'],
            storage: ['storageModule', 'loadData', 'saveData'],
            app: ['footballApp']
        },
        maxRetries: 10,
        retryDelay: 100
    };

    /**
     * Détecte la page courante
     */
    function detectCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        
        const pageMap = {
            'index': 'home',
            '': 'home'
        };
        
        const detectedPage = pageMap[page] || page;
        console.log('📄 Page détectée:', detectedPage);
        return detectedPage;
    }

    /**
     * Vérifie les dépendances (VERSION AMÉLIORÉE)
     */
    function checkDependencies() {
        const missing = [];
        
        for (const [module, functions] of Object.entries(CONFIG.dependencies)) {
            // Pour storage, vérifier d'abord storageModule
            if (module === 'storage') {
                if (typeof window.storageModule !== 'undefined') {
                    console.log('✅ Dépendance chargée: storage.js (via storageModule)');
                    continue;
                }
            }
            
            // Vérifier les fonctions
            const moduleMissing = functions.filter(fn => typeof window[fn] === 'undefined');
            
            if (moduleMissing.length === 0) {
                console.log(`✅ Dépendance chargée: ${module}.js`);
            } else {
                console.warn(`❌ Dépendance manquante: ${module}.js`, moduleMissing);
                missing.push({ module, functions: moduleMissing });
            }
        }
        
        if (missing.length > 0) {
            console.warn('⚠️ Certaines dépendances sont manquantes:', missing);
            return false;
        }
        
        return true;
    }

    /**
     * Attend que footballApp soit disponible
     */
    function waitForFootballApp(callback, retries = 0) {
        if (typeof window.footballApp !== 'undefined') {
            console.log('⚽ footballApp disponible');
            
            const state = window.footballApp.getState();
            console.log('État de l\'application:', state);
            
            callback();
        } else if (retries < CONFIG.maxRetries) {
            setTimeout(() => waitForFootballApp(callback, retries + 1), CONFIG.retryDelay);
        } else {
            console.error('❌ footballApp non disponible après', CONFIG.maxRetries, 'tentatives');
        }
    }

    /**
     * Initialisation des gestionnaires d'événements globaux
     */
    function setupGlobalEventHandlers() {
        // Fermeture des modales en cliquant à l'extérieur
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                if (typeof window.footballApp !== 'undefined' && 
                    typeof window.footballApp.closeAllModals === 'function') {
                    window.footballApp.closeAllModals();
                }
            }
        });

        // Fermeture avec Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                if (typeof window.footballApp !== 'undefined' && 
                    typeof window.footballApp.closeAllModals === 'function') {
                    window.footballApp.closeAllModals();
                }
            }
        });

        // Sauvegarde avant fermeture
        window.addEventListener('beforeunload', function() {
            if (typeof window.footballApp !== 'undefined' && 
                typeof window.footballApp.saveState === 'function') {
                window.footballApp.saveState();
            }
        });

        console.log('👂 Gestionnaires d\'événements globaux configurés');
    }

    /**
     * Initialisation spécifique à chaque page
     */
    function initializePage(page) {
        console.log(`🏠 Initialisation page ${page}`);

        switch(page) {
            case 'home':
                initHomePage();
                break;
            case 'team':
                if (typeof initTeamPage === 'function') initTeamPage();
                break;
            case 'composition':
                if (typeof initCompositionPage === 'function') initCompositionPage();
                break;
            case 'match':
                if (typeof initMatchPage === 'function') initMatchPage();
                break;
            case 'live':
                if (typeof initLivePage === 'function') initLivePage();
                break;
            case 'stats':
                if (typeof initStatsPage === 'function') initStatsPage();
                break;
            default:
                console.log('Page sans initialisation spécifique');
        }
    }

    /**
     * Initialisation de la page d'accueil
     */
    function initHomePage() {
        if (typeof loadMatchConfig === 'function') {
            loadMatchConfig();
        }

        if (typeof updateRecentStats === 'function') {
            updateRecentStats();
        }

        const matchDateInput = document.getElementById('matchDate');
        if (matchDateInput && !matchDateInput.value) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            matchDateInput.value = now.toISOString().slice(0, 16);
        }
    }

    /**
     * Point d'entrée principal
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        setTimeout(() => {
            const depsOk = checkDependencies();
            
            if (!depsOk) {
                console.warn('⚠️ Poursuite malgré dépendances manquantes (elles peuvent se charger)');
            }

            const currentPage = detectCurrentPage();
            setupGlobalEventHandlers();

            waitForFootballApp(() => {
                initializePage(currentPage);
                console.log('✅ Application initialisée avec succès');
            });
        }, 50);
    }

    init();

    console.log('✅ Module init.js chargé');
})();