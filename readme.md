# Football Stats - Application de Suivi de Match

Application web de gestion de statistiques de football en temps réel avec partage live.

## Structure du Projet
football-stats/
├── index.html              # Page d'accueil
├── readme.md
├── css/
│   └── style.css           # Styles globaux
├── js/
│   ├── app.js              # État global et logique principale
│   ├── composition.js      # Gestion composition d'équipe
│   ├── init.js             # 
│   ├── match_actions.js    # Actions de jeu (buts, cartons, etc.)
│   ├── match.js            # Chronomètre et gestion du match
│   ├── setup.js            # Configuration et diagnostics
│   └── stats.js            # Calculs statistiques
│   ├── storage.js          # Gestion stockage (local + JSONBin)
│   └── utils.js            # Calculs statistiques
└── pages/
├── composition.html    # Composition 11 titulaires
├── live.html           # Affichage live pour spectateurs
├── match.html          # Interface de match
└── stats.html          # Statistiques détaillées
├── team.html           # Gestion des joueuses

## Fonctionnalités

### Gestion d'Équipe
- Ajout/suppression de joueuses
- Positions : Gardienne, Défenseure, Milieu, Attaquante
- Statuts : Terrain, Banc, Disponible, Sanctionné

### Composition
- Sélection 11 titulaires + remplaçantes
- Validation automatique (1 gardienne obligatoire)
- Visualisation terrain en temps réel

### Match en Direct
- **Chronomètre** : Démarrage/pause, mi-temps, prolongations
- **Actions complètes** :
  - ⚽ But (équipe/adversaire, types : normal, penalty, CSC, coup franc)
  - ➡️ Passe décisive (optionnel sur but)
  - 🎯 Tir (cadré/non cadré/contré/poteau)
  - 🧤 Arrêt gardienne (ligne/sortie)
  - ⚠️ Faute (avec sévérité)
  - 🟨 Carton (jaune/rouge/blanc avec timer 10min)
  - 🚩 Corner
  - 🛑 Hors-jeu
  - 🔄 Changement (interface dédiée)
- **Édition d'actions** : Modification/suppression des événements
- **Timeline** : Historique complet avec 3 colonnes (équipe/temps/adversaire)

### Statistiques
- **Équipe** : Buts, tirs, cartons, fautes, arrêts, coups francs
- **Individuelles** : 
  - Temps de jeu calculé automatiquement (gestion changements)
  - Score joueur (système de points)
  - Stats détaillées par action
- **Analyse** : Par mi-temps, efficacité, top performeurs

### Mode Live
- Partage temps réel via JSONBin.io
- Synchronisation automatique (10s si timer actif, 30s sinon)
- Lien unique pour spectateurs
- Mode lecture seule pour observateurs

### Sauvegarde
- **Automatique** : Toutes les 30s pendant le match
- **Manuelle** : Export/import JSON
- **Persistance** : LocalStorage + JSONBin pour le live

## Utilisation

### 1. Configuration Initiale
1. **Accueil** : Configurer noms d'équipes, lieu, date
2. **Équipe** : Ajouter vos joueuses (nom + position)
3. **Composition** : Sélectionner 11 titulaires + remplaçantes

### 2. Pendant le Match
1. **Démarrer** : Cliquer sur ▶️ Démarrer le chronomètre
2. **Actions** : Cliquer sur un bouton d'action
   - Étape 1 : Choisir équipe (votre équipe/adversaire)
   - Étape 2 : Sélectionner joueuse + options
   - Validation automatique quand tout est sélectionné
3. **Changements** : Interface dédiée (sortant → entrant)
4. **Mi-temps** : Bouton ⏱️ Mi-temps pour passer en 2ème période

### 3. Partage Live
1. Cliquer sur "📡 Lien Live"
2. Copier et partager le lien généré
3. Les spectateurs voient les mises à jour en temps réel

### 4. Consultation Stats
- **Pendant le match** : Stats temps réel dans l'onglet Stats
- **Après le match** : Analyse complète, export PDF

## Configuration JSONBin.io (Optionnel)

Pour activer le mode live :
1. Créer un compte sur https://jsonbin.io
2. Générer une clé API
3. Remplacer dans `js/storage.js` ligne 3 :
```javascript
API_KEY: 'VOTRE_CLE_API'
```
Sans configuration : L'app fonctionne en mode local uniquement.

## Système de Notation

- **But** : +5 points
- **Tir** : +1 point
- **Arrêt gardienne** : +2 points
- **Coup franc** : +1 point
- **Carton jaune** : -1 point
- **Carton rouge** : -3 points
- **Carton blanc** : -2 points
- **Faute** : -0.5 point

## Compatibilité

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile : iOS Safari, Android Chrome

## Limitations

- Stockage local : Limité par le navigateur (~5-10MB)
- Mode live : Nécessite connexion internet
- JSONBin gratuit : 100,000 requêtes/mois
- Pas de multi-utilisateurs simultanés (1 éditeur)
