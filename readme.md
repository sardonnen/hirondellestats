# Football Stats - Application de Suivi de Match

Une application web moderne pour suivre les statistiques de matchs de football en temps réel, avec possibilité de partage live via mobile.

## 🚀 Fonctionnalités

- **Configuration d'équipe** : Ajout et gestion des joueuses avec positions
- **Composition d'équipe** : Sélection des 11 titulaires et gestion banc/terrain
- **Gestion des remplacements** : Interface dédiée pour les substitutions
- **Suivi en temps réel** : Chronomètre, score, événements avec mi-temps
- **Actions complètes** : 
  - ⚽ Buts (équipe/adversaire)
  - 🎯 Tirs cadrés / 📐 Tirs non cadrés  
  - 🟨 Cartons (jaune/rouge/blanc)
  - 🧤 Arrêts de gardienne (ligne/sortie)
  - ⚠️ Fautes
  - ⚽ Coups francs
  - 🔄 Changements de joueurs
- **Interface intuitive** : Popups en 2 étapes avec feedback visuel
- **Mode Live** : Partage du match en temps réel via jsonbin.io
- **Statistiques complètes** : Équipe et individuelles
- **Responsive** : Compatible mobile et desktop
- **Sauvegarde** : Compositions et données persistantes

## 📁 Structure du projet

```
football-stats/
├── index.html          # Page principale
├── css/
│   └── styles.css       # Styles CSS
├── js/
│   ├── app.js          # Logique principale
│   ├── match-actions.js # Gestion des actions du match
│   ├── lineup.js       # Gestion de la composition d'équipe
│   └── api.js          # Intégration jsonbin.io
└── README.md           # Ce fichier
```

## 🔧 Déploiement sur GitHub Pages

### 1. Préparation du repository

1. Créez un nouveau repository sur GitHub
2. Clonez le repository localement :
```bash
git clone https://github.com/votre-username/votre-repo.git
cd votre-repo
```

### 2. Ajout des fichiers

Copiez tous les fichiers dans votre repository :

```
votre-repo/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── match-actions.js
│   └── api.js
└── README.md
```

### 3. Configuration GitHub Pages

1. Allez dans les paramètres de votre repository
2. Section "Pages" dans le menu de gauche
3. Source : "Deploy from a branch"
4. Branch : "main" ou "master"
5. Folder : "/ (root)"
6. Cliquez sur "Save"

### 4. Déploiement

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

Votre application sera disponible à : `https://votre-username.github.io/votre-repo/`

## 📱 Utilisation

### Configuration initiale

1. **Ajouter des joueuses** :
   - Allez dans l'onglet "Configuration"
   - Saisissez le nom et la position
   - Cliquez sur "Ajouter Joueuse"

2. **Paramètres du match** :
   - Définissez les noms des équipes
   - Choisissez le lieu et la durée

3. **Composer l'équipe** :
   - Allez dans l'onglet "Composition"
   - Sélectionnez vos 11 titulaires (max)
   - Visualisez terrain/banc en temps réel

4. **Démarrer un match** :
   - Cliquez sur "Nouveau Match"

### Pendant le match

1. **Gestion du temps** :
   - Utilisez les boutons ▶️, 🔄 Mi-temps et ⏹️ Reset
   - Le chrono se met en pause automatiquement

2. **Enregistrer des actions** (2 étapes) :
   - Cliquez sur un type d'action (8 actions disponibles)
   - **Étape 1** : Choisissez l'équipe (vôtre ou adverse)
   - **Étape 2** : Sélectionnez le joueur + détails
   - **Feedback visuel** : Fond blanc sur les choix sélectionnés

3. **Actions disponibles** :
   - ⚽ **But** : Mon équipe ou adverse
   - 🎯 **Tir Cadré** / 📐 **Tir Non Cadré**
   - 🟨 **Carton** : Jaune/Rouge/Blanc avec choix joueur
   - 🧤 **Arrêt Gardienne** : Ligne ou sortie
   - ⚠️ **Faute** : Équipe ou adverse
   - ⚽ **Coup Franc** : Joueur de votre équipe
   - 🔄 **Changement** : Substitution joueur

4. **Gestion des remplacements** :
   - Interface dédiée sortant/entrant
   - Validation automatique des règles (11 max sur terrain)

5. **Mode Live** :
   - Cliquez sur "Générer Lien Live"
   - Partagez le lien pour que d'autres suivent le match
   - Synchronisation automatique toutes les 5 secondes

### Navigation

- **Configuration** : Gestion des équipes et paramètres
- **Composition** : Sélection titulaires et visualisation terrain
- **Match** : Interface principale pendant le match
- **Statistiques** : Vue d'ensemble équipe + stats individuelles
- **Live** : Affichage pour le suivi à distance

## 🎮 Interface des Actions

L'application utilise un système de popup en deux étapes avec feedback visuel clair :

### 1️⃣ Choix de l'équipe 
- **Bouton vert** : Votre équipe
- **Bouton rouge** : Équipe adverse  
- **Feedback** : Fond blanc + bordure verte sur le choix sélectionné

### 2️⃣ Détails de l'action
- **Pour les cartons** : Choisissez la couleur (🟨 Jaune / 🟥 Rouge / ⬜ Blanc)
- **Pour tous** : Sélectionnez le joueur concerné
- **Indicateurs visuels** :
  - 🟢 Joueur sur le terrain
  - 🔵 Joueur sur le banc  
  - 🥅 Gardienne (arrière-plan orange)
- **Validation** : Bouton actif seulement quand tout est sélectionné

### 📋 Actions spéciales

- **🧤 Arrêt Gardienne** : Seulement les gardiennes sur terrain + type d'arrêt
- **🔄 Changement** : Interface dédiée avec sortant (terrain) et entrant (banc)
- **⚽ Coup Franc** : Directement les joueurs de votre équipe sur terrain

### 🎯 Grille des Actions
**2 boutons par ligne** pour un accès rapide :
```
⚽ But           🎯 Tir Cadré
📐 Tir Non Cadré  🟨 Carton  
🧤 Arrêt Gardienne ⚠️ Faute
⚽ Coup Franc     🔄 Changement
```

## 🔑 Raccourcis Clavier

L'application inclut des raccourcis clavier pour une utilisation rapide :

- **Espace** : Démarrer/Arrêter le chronomètre
- **R** : Reset du chronomètre
- **G** : Enregistrer un but (ouvre le modal de choix)
- **T** : Enregistrer un tir (ouvre le modal de choix)
- **C** : Enregistrer un carton (ouvre le modal de choix)
- **F** : Enregistrer une faute (ouvre le modal de choix)
- **Échap** : Fermer tous les modals ouverts

## 📱 Installation en tant qu'App Mobile

1. Ouvrez l'application dans votre navigateur mobile
2. **iOS Safari** : Appuyez sur "Partager" puis "Sur l'écran d'accueil"
3. **Android Chrome** : Menu ⋮ puis "Ajouter à l'écran d'accueil"
4. L'application s'ouvrira comme une app native !

## 🏆 Fonctionnalités Avancées

### Gestion Intelligente des Joueurs
- **Validation automatique** : Impossible d'avoir plus de 11 joueurs sur le terrain
- **Statuts visuels** : 🟢 Terrain, 🔵 Banc, 🟡 Sanctionné, 🔴 Exclu
- **Historique complet** : Tous les mouvements sont enregistrés

### Statistiques Complètes
- **Équipe** : Buts, tirs (cadrés/non cadrés), arrêts, fautes, cartons
- **Individuelles** : Stats détaillées par joueuse avec historique
- **Temps réel** : Mise à jour instantanée pendant le match

### Synchronisation Live Avancée
- **Reconnexion automatique** : En cas de perte de connexion
- **Mise à jour temps réel** : Toutes les 5 secondes
- **Mode lecture seule** : Les spectateurs ne peuvent pas modifier
- **Partage multi-plateforme** : Fonctionne sur tous les appareils

## 🔧 Personnalisation

### Modifier les Positions
Dans `js/app.js`, fonction `getPositionIcon()` :
```javascript
const icons = {
    'gardienne': '🥅',
    'defenseure': '🛡️', 
    'milieu': '⚡',
    'attaquante': '⚽',
    'libero': '🔄' // Nouvelle position
};
```

### Ajouter des Actions
Dans `index.html`, section actions-grid :
```html
<div class="action-card" onclick="showActionChoiceModal('nouvelle_action')">
    <div class="action-icon">🆕</div>
    <div>Nouvelle Action</div>
</div>
```

Puis implémentez dans `js/match-actions.js`.

## 🚨 Limitations Importantes

- **Stockage local** : Les données sont sauvées dans le navigateur
- **Pas de base de données** : Utilisez l'export pour sauvegarder
- **Mode live** : Dépendant de jsonbin.io (gratuit avec limites)
- **Hors ligne** : Fonctionne mais pas de sync en mode live

## 🔄 Évolutions Futures Possibles

- **Backend complet** : Base de données pour multi-utilisateurs
- **Statistiques avancées** : Cartes de chaleur, graphiques
- **Export avancé** : PDF automatique, partage réseaux sociaux
- **Mode tournoi** : Gestion de plusieurs matchs
- **IA Assistant** : Suggestions tactiques basées sur les stats

## 📋 Changelog

### Version 2.0 (Actuelle)
- ✅ Composition d'équipe avec 11 titulaires
- ✅ Gestion complète des remplacements  
- ✅ 8 types d'actions (buts, tirs, cartons, etc.)
- ✅ Interface 2x2 avec popups en 2 étapes
- ✅ Feedback visuel (fond blanc sur sélection)
- ✅ Terrain visuel avec statuts joueurs
- ✅ Statistiques individuelles complètes
- ✅ Mode live avec jsonbin.io
- ✅ Responsive design complet
- ✅ Raccourcis clavier
- ✅ Sauvegarde/chargement compositions

### Prochaines Versions
- 🔲 Mode sombre
- 🔲 Export PDF des stats
- 🔲 Notifications push pour le live
- 🔲 Mode multi-matchs


### Calcul des statistiques des joueurs
 
SYSTÈME DE NOTATION :
- But : +5 points
- Tir : +1 point
- Arrêt gardienne : +2 points
- Coup franc : +1 point
- Carton jaune : -1 point
- Carton rouge : -3 points
- Carton blanc : -2 points
- Faute : -0.5 point
