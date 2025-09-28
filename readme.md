# Football Stats - Application de Suivi de Match

Une application web moderne pour suivre les statistiques de matchs de football en temps réel, avec possibilité de partage live via mobile.

## 🚀 Fonctionnalités

- **Configuration d'équipe** : Ajout et gestion des joueuses
- **Suivi en temps réel** : Chronomètre, score, événements
- **Actions rapides** : Interface intuitive avec popups pour enregistrer buts, tirs, cartons, fautes
- **Mode Live** : Partage du match en temps réel via jsonbin.io
- **Responsive** : Compatible mobile et desktop
- **Sauvegarde automatique** : Données persistantes dans le navigateur

## 📁 Structure du projet

```
football-stats/
├── index.html          # Page principale
├── css/
│   └── styles.css       # Styles CSS
├── js/
│   ├── app.js          # Logique principale
│   ├── match-actions.js # Gestion des actions du match
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

3. **Démarrer un match** :
   - Cliquez sur "Nouveau Match"

### Pendant le match

1. **Gestion du temps** :
   - Utilisez les boutons ▶️ et 🔄 pour contrôler le chronomètre

2. **Enregistrer des actions** :
   - Cliquez sur un type d'action (But, Tir, Carton, Faute)
   - Choisissez l'équipe (vôtre ou adverse)
   - Sélectionnez le joueur concerné
   - Validez l'action

3. **Mode Live** :
   - Cliquez sur "Générer Lien Live"
   - Partagez le lien pour que d'autres suivent le match
   - Les données se synchronisent automatiquement

### Navigation

- **Configuration** : Gestion des équipes et paramètres
- **Match** : Interface principale pendant le match
- **Statistiques** : Vue d'ensemble des stats
- **Live** : Affichage pour le suivi à distance

## 🎮 Interface des Actions

L'application utilise un système de popup en deux étapes :

1. **Choix de l'équipe** : Sélectionnez qui est concerné par l'action
   - Bouton vert : Votre équipe
   - Bouton rouge : Équipe adverse
   - Fond blanc sur le choix sélectionné

2. **Détails de l'action** :
   - Pour les **cartons** : Choisissez la couleur (jaune/rouge/blanc)
   - Pour tous : Sélectionnez le joueur concerné
   - Validation de l'action

## 🔄 Synchronisation Live

L'application utilise jsonbin.io pour la synchronisation en temps réel :

- **Génération du lien** : Crée un bin unique sur jsonbin.io
- **Partage mobile** : Le lien peut être ouvert sur n'importe quel appareil
- **Mise à jour automatique** : Les données se synchronisent toutes les 5 secondes
- **Mode lecture seule** : Les spectateurs voient les événements en temps réel

## 💾 Sauvegarde

- **Automatique** : Toutes les données sont sauvegardées dans le navigateur
- **Persistante** : Les informations restent disponibles après fermeture
- **Export** : Possibilité d'exporter les données (fonctionnalité à ajouter)

## 🛠️ Personnalisation

### Modifier l'API Key

Dans `js/api.js`, changez la variable :
```javascript
const API_KEY = 'votre-nouvelle-cle-api';
```

### Ajouter des positions

Dans `js/app.js`, modifiez la fonction `getPositionIcon()` :
```javascript
const icons = {
    'gardienne': '🥅',
    'defenseure': '🛡️',
    'milieu': '⚡',
    'attaquante': '⚽',
    'nouvelle-position': '🆕'
};
```

### Modifier les couleurs

Dans `css/styles.css`, ajustez les variables CSS ou les gradients :
```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🐛 Dépannage

### L'application ne fonctionne pas sur GitHub Pages

1. Vérifiez que tous les fichiers sont présents
2. Assurez-vous que les chemins sont relatifs (pas d'URLs absolues)
3. Consultez la console du navigateur pour les erreurs

### Le mode live ne fonctionne pas

1. Vérifiez votre clé API jsonbin.io
2. Assurez-vous d'avoir une connexion internet
3. Testez avec un autre navigateur

### Problèmes de responsive

1. Testez sur différentes tailles d'écran
2. Vérifiez les media queries dans le CSS
3. Assurez-vous que la meta viewport est présente

## 📞 Support

Pour toute question ou problème :
1. Consultez la console du navigateur pour les erreurs
2. Vérifiez que tous les fichiers sont bien chargés
3. Testez en mode incognito pour éliminer les problèmes de cache

## 🔮 Évolutions futures

- Export des données en PDF/Excel
- Gestion des remplacements
- Statistiques avancées par joueur
- Mode hors-ligne avec synchronisation différée
- Interface d'administration pour modifier les matchs passés