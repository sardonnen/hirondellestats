# ⚽ Football Stats Manager

Une application web complète pour gérer les statistiques de matchs de football en temps réel, avec partage live et interface mobile optimisée.

## 🌟 Fonctionnalités

### 🏠 Page d'Accueil
- Configuration rapide des équipes
- Actions de gestion (nouveau match, reset, import/export)
- Résumé des statistiques récentes
- Guide d'utilisation intégré

### 👥 Gestion d'Équipe
- Ajout/suppression de joueuses avec positions
- Numéros de maillot optionnels
- Gestion des statuts (terrain, banc, sanctionnée)
- Export/import d'équipes
- Sauvegarde de compositions prédéfinies

### 📋 Composition de Départ
- Sélection interactive des 11 titulaires
- Visualisation de formation en temps réel
- Formations prédéfinies (4-4-2, 4-3-3, 3-5-2, 5-3-2)
- Validation automatique des compositions
- Aperçu du banc de touche

### ⚽ Interface de Match
- **Chronomètre** : Démarrage/arrêt/reset avec alertes automatiques
- **Actions de jeu** : Buts, tirs, cartons, fautes, arrêts gardienne
- **Équipe adverse** : Enregistrement des actions adverses
- **Substitutions** : Gestion complète des changements
- **Timeline** : Historique détaillé avec possibilité de modification
- **Bouton live** : Génération de lien de partage en temps réel

### 📺 Vue Live
- **Mode spectateur** : Interface en lecture seule
- **Timeline séparée** : 
  - Actions de votre équipe à gauche
  - Timeline centrale avec timing
  - Actions adverses à droite
- **Actualisation automatique** toutes les 5 secondes
- **Statistiques temps réel** avec comparaisons
- **Responsive** : Optimisé pour tous les appareils

### 📊 Statistiques Détaillées
- **Résumé de match** avec export/impression
- **Stats globales** : Comparaison équipe vs adversaire
- **Performances individuelles** avec système de notation
- **Analyse par mi-temps**
- **Timeline filtrable** par type d'événement
- **Graphiques** et analyses avancées
- **Top performeurs** avec joueur du match

## 🏗️ Architecture Modulaire

```
football-stats/
├── index.html              # Page d'accueil
├── pages/
│   ├── team.html           # Gestion équipe
│   ├── composition.html    # Sélection composition
│   ├── match.html          # Interface de match
│   ├── live.html           # Vue live
│   └── stats.html          # Statistiques
├── css/
│   └── style.css           # Styles globaux responsive
├── js/
│   ├── app.js              # Logique principale
│   ├── storage.js          # Gestion données & JSONBin.io
│   ├── match.js            # Fonctions match
│   └── live.js             # Synchronisation live
└── README.md               # Documentation
```

## 🚀 Installation et Déploiement

### Déploiement GitHub Pages

1. **Créer un repository GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/football-stats.git
git push -u origin main
```

2. **Activer GitHub Pages**
   - Aller dans Settings > Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Save

3. **Accéder à l'application**
   - URL: `https://username.github.io/football-stats`

### Configuration JSONBin.io

1. **Obtenir une clé API**
   - S'inscrire sur [JSONBin.io](https://jsonbin.io)
   - Créer une clé API gratuite

2. **Configurer la clé**
   - Modifier `js/storage.js` ligne 8 :
   ```javascript
   API_KEY: 'VOTRE_CLE_API_ICI'
   ```
   - Modifier `js/live.js` ligne 10 :
   ```javascript
   API_KEY: 'VOTRE_CLE_API_ICI'
   ```

## 📱 Utilisation

### Démarrage Rapide

1. **Créer l'équipe**
   - Aller dans "👥 Équipe"
   - Ajouter vos joueuses avec leurs positions
   - Une seule gardienne autorisée

2. **Définir la composition**
   - Aller dans "📋 Compo"
   - Sélectionner 11 joueuses (1 gardienne obligatoire)
   - Utiliser les formations prédéfinies si besoin
   - Valider la composition

3. **Lancer le match**
   - Aller dans "⚽ Match"
   - Démarrer le chronomètre
   - Enregistrer les événements au fur et à mesure

4. **Partager en live**
   - Cliquer sur "📡 Lien Live"
   - Partager le lien généré
   - Les spectateurs suivent en temps réel

### Fonctionnalités Avancées

#### Substitutions
- Sélectionner la joueuse sortante (sur le terrain)
- Sélectionner la joueuse entrante (sur le banc)
- Ajouter une raison optionnelle
- Maximum 5 substitutions par match

#### Cartons avec Boutons
- **🟨 Jaune** : Avertissement
- **🟥 Rouge** : Exclusion (joueuse sanctionnée)
- **⚪ Blanc** : Exclusion temporaire 10 minutes

#### Arrêts Gardienne
- **Sur sa ligne** : Arrêt classique
- **En sortie** : Sortie du but
- **Penalty** : Arrêt sur penalty
- **Corner** : Sortie sur corner

#### Coups de Pied Arrêtés
- **Coup franc** : Coup franc direct/indirect
- **Corner** : Corner
- **Penalty** : Penalty
- **Remise en jeu** : Touche

### Mode Live Spectateur

Quand un spectateur clique sur le lien live :

1. **Interface épurée** : Seulement les données du match
2. **Timeline séparée** : 
   - Gauche : Actions équipe locale
   - Centre : Timeline chronologique
   - Droite : Actions équipe adverse
3. **Auto-refresh** : Mise à jour toutes les 5 secondes
4. **Lecture seule** : Aucune modification possible
5. **Statistiques temps réel** : Comparaisons en direct

## 🔧 Personnalisation

### Couleurs et Thème
Modifier les variables CSS dans `css/style.css` :
```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    --success-color: #27ae60;
    --warning-color: #f39c12;
    --danger-color: #e74c3c;
}
```

### Durée de Match
Modifier dans `js/match.js` ligne 160 :
```javascript
// Alerte 90 minutes par défaut
if (!isFirstHalf && minutes === 90)
```

### Nombre de Substitutions
Modifier dans `js/match.js` ligne 25 :
```javascript
maxSubstitutions: 5  // Changer selon les règles
```

### Intervalle de Synchronisation Live
Modifier dans `js/live.js` ligne 12 :
```javascript
UPDATE_INTERVAL: 5000  // 5 secondes par défaut
```

## 📊 Gestion des Données

### Stockage Local
- **LocalStorage** : Sauvegarde automatique locale
- **Import/Export JSON** : Sauvegarde manuelle
- **Compositions** : Sauvegarde des équipes favorites

### Synchronisation Live
- **JSONBin.io** : Base de données cloud gratuite
- **Temps réel** : Mise à jour toutes les 5 secondes
- **Fallback** : LocalStorage si pas de connexion
- **Retry** : Nouvelles tentatives automatiques

### Historique des Matchs
- **Auto-sauvegarde** : Chaque match sauvegardé
- **Export complet** : Toutes les données en JSON
- **Import** : Restauration depuis fichier

## 🔒 Sécurité et Confidentialité

- **Aucune donnée personnelle** collectée
- **Stockage local** : Données restent sur votre appareil
- **JSONBin.io** : Service tiers pour le live uniquement
- **HTTPS** : Communication sécurisée
- **Pas de tracking** : Aucun cookie ou analytics

## 🎯 Fonctionnalités Boutons Corrigées

### ✅ Problèmes Résolus
- **Cartons** : Boutons au lieu de listbox
- **Coup de pied arrêtés** : Fonctionnalité réparée
- **Confirmations** : Reset et mi-temps
- **Gardienne unique** : Une seule sur le terrain
- **Bouton live** : Taille réduite, position fixe
- **Séparation live** : Timeline centrale + actions latérales

### 🔄 Architecture Modulaire
- **Séparation des préoccupations** : Chaque module a sa responsabilité
- **Réutilisabilité** : Code modulaire et maintenable
- **GitHub Pages** : Déploiement simple
- **No build process** : Fonctionne directement

## 📱 Responsive Design

### Mobile (< 768px)
- Navigation adaptée
- Boutons plus grands
- Layout en colonne
- Timeline empilée verticalement

### Tablet (768px - 1024px)
- Interface hybride
- Grilles adaptatives
- Navigation horizontale

### Desktop (> 1024px)
- Interface complète
- Timeline séparée (gauche/centre/droite)
- Toutes les fonctionnalités visibles

## 🛠️ Dépannage

### Le lien live ne fonctionne pas
1. Vérifier la clé API JSONBin.io
2. Vérifier la connexion internet
3. Regarder la console pour les erreurs

### Les données ne se sauvegardent pas
1. Vérifier que le localStorage est activé
2. Vider le cache du navigateur
3. Vérifier l'espace de stockage disponible

### L'affichage est cassé sur mobile
1. Vérifier la meta viewport dans le HTML
2. Tester sur plusieurs navigateurs
3. Vider le cache CSS

### Les boutons ne répondent pas
1. Vérifier la console JavaScript
2. Recharger la page
3. Vérifier que tous les fichiers JS sont chargés

## 🎉 Améliorations Futures

### Version 2.0 Prévue
- [ ] Mode hors-ligne complet
- [ ] Notifications push pour spectateurs
- [ ] Statistiques avancées avec graphiques
- [ ] Export PDF automatique
- [ ] Multi-langues
- [ ] Thèmes personnalisables
- [ ] API REST complète
- [ ] Application mobile native

### Contributions
Les contributions sont bienvenues ! 
1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - Utilisez librement pour vos projets personnels et commerciaux.

---

**Développé avec ❤️ pour les passionnés de football**

Pour toute question ou support : [Créer une issue](https://github.com/username/football-stats/issues)