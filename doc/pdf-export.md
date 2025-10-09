# 📄 Guide d'Intégration - Export PDF

## 📦 Fichiers Créés/Modifiés

### ✨ Nouveau fichier
- **`js/pdf-export.js`** : Module complet d'export PDF

### 🔧 Fichiers modifiés
- **`pages/stats.html`** : Ajout du bouton "📄 Exporter PDF" et imports
- **`pages/match.html`** : Ajout du bouton "📄 Exporter PDF" et imports

---

## 🚀 Installation

### Étape 1 : Ajouter le nouveau fichier JS

Créez le fichier **`js/pdf-export.js`** avec le contenu fourni dans l'artifact `pdf_export_module`.

### Étape 2 : Remplacer les fichiers HTML

Remplacez vos fichiers actuels par les nouvelles versions :
- **`pages/stats.html`** → Version de l'artifact `stats_html_with_pdf`
- **`pages/match.html`** → Version de l'artifact `match_html_with_pdf`

### Étape 3 : Vérifier la structure

Assurez-vous que votre structure de fichiers ressemble à ceci :

```
football-stats/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── composition.js
│   ├── init.js
│   ├── match_actions.js
│   ├── match.js
│   ├── setup.js
│   ├── stats.js
│   ├── storage.js
│   ├── utils.js
│   └── pdf-export.js          ⬅️ NOUVEAU
└── pages/
    ├── composition.html
    ├── live.html
    ├── match.html             ⬅️ MODIFIÉ
    ├── stats.html             ⬅️ MODIFIÉ
    └── team.html
```

---

## ✅ Vérification de l'Installation

### Test 1 : Vérifier les imports
Ouvrez les **DevTools** (F12) sur `stats.html` ou `match.html` et vérifiez dans la console qu'il n'y a pas d'erreur de chargement des scripts.

### Test 2 : Tester l'export
1. Allez sur la page **Stats** ou **Match**
2. Cliquez sur le bouton **"📄 Exporter PDF"**
3. Un PDF devrait se télécharger automatiquement

---

## 📋 Fonctionnalités du PDF

Le PDF généré contient **toutes les informations** du match :

### Page 1 : Vue d'ensemble
- ✅ **En-tête** : Date, heure, lieu
- ✅ **Score final** : Résultat du match
- ✅ **Statistiques globales** : Tableau comparatif équipe vs adversaire
  - Buts, Tirs, Cartons, Fautes, Arrêts, Coups francs

### Page 2 : Timeline complète
- ✅ **Timeline détaillée** : Tous les événements chronologiques
  - Temps, Période (1ère/2ème MT), Équipe, Description

### Page 3 : Performances individuelles
- ✅ **Statistiques des joueuses** : Tableau complet trié par performance
  - Nom, Poste, Buts, Tirs, Cartons, Arrêts, Score
- ✅ **Top 5 joueuses** : Graphique à barres avec scores
- ✅ **Analyse par mi-temps** : Comparaison 1ère/2ème mi-temps

---

## 🎨 Personnalisation du PDF

### Modifier les couleurs

Dans `js/pdf-export.js`, vous pouvez modifier les couleurs des tableaux :

```javascript
// Ligne 119 - Statistiques globales
headStyles: { fillColor: [41, 128, 185] }  // Bleu

// Ligne 165 - Timeline
headStyles: { fillColor: [52, 152, 219] }  // Bleu clair

// Ligne 218 - Stats joueuses
headStyles: { fillColor: [46, 204, 113] }  // Vert

// Ligne 293 - Mi-temps
headStyles: { fillColor: [155, 89, 182] }  // Violet
```

### Ajouter un logo ou en-tête personnalisé

Dans la fonction `addMatchHeader()` (ligne 82), vous pouvez ajouter :

```javascript
// Après le titre
doc.addImage('data:image/png;base64,...', 'PNG', 15, 10, 30, 30);
```

### Modifier le nom du fichier

Ligne 54 dans `generateMatchPDF()` :

```javascript
const fileName = `Match_${config.teamName}_vs_${config.opponentName}_${new Date().toISOString().split('T')[0]}.pdf`;
```

---

## 🐛 Dépannage

### Erreur : "jsPDF is not defined"
**Solution** : Vérifiez que les scripts CDN sont bien chargés dans `<head>` :
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
```

### Erreur : "footballApp is not defined"
**Solution** : Assurez-vous que `app.js` est chargé **avant** `pdf-export.js`

### Le PDF est vide ou incomplet
**Solution** : Vérifiez que vous avez des données dans votre match (événements, joueurs, etc.)

### Problème avec les accents
**Solution** : Les bibliothèques PDF gèrent automatiquement l'UTF-8. Si problème, vérifiez l'encodage de vos fichiers JS.

---

## 🔧 Utilisation

### Depuis la page Stats
1. Allez sur **📊 Stats**
2. Cliquez sur **📄 Exporter PDF** (en haut, à côté des autres boutons)
3. Le PDF se télécharge avec toutes les statistiques

### Depuis la page Match
1. Pendant ou après un match sur **⚽ Match**
2. Dans la section "Timeline du Match"
3. Cliquez sur **📄 Exporter PDF**
4. Le PDF se génère avec l'état actuel du match

---

## 📊 Contenu Détaillé du PDF

### Informations incluses
- ✅ Date et heure d'export
- ✅ Lieu du match
- ✅ Score final (Équipe vs Adversaire)
- ✅ Durée et statut du match
- ✅ Nombre total d'événements

### Statistiques globales (Tableau)
- ⚽ Buts
- 🎯 Tirs
- 🟨 Cartons
- ⚠️ Fautes
- 🧤 Arrêts
- ⚽ Coups francs

### Timeline (Tableau détaillé)
Chaque événement avec :
- ⏱️ Temps exact
- 📍 Période (1ère/2ème MT)
- 👥 Équipe concernée
- 📝 Description complète

### Statistiques individuelles (Tableau)
Pour chaque joueuse ayant participé :
- 👤 Nom
- 📍 Poste
- ⚽ Buts marqués
- 🎯 Tirs tentés
- 🟨 Cartons reçus
- 🧤 Arrêts (gardienne)
- 🏆 Score de performance

### Graphiques et analyses
- 📊 Top 5 joueuses (barres de performance)
- ⏱️ Comparaison 1ère/2ème mi-temps
- 📈 Statistiques par période

---

## 🎯 Avantages de cette implémentation

### ✅ Respect de votre structure
- Pas de modification des fichiers backend existants
- Nouveau module séparé (`pdf-export.js`)
- Réutilise les fonctions existantes (`footballApp`, `getMatchConfig`)

### ✅ Autonome et réutilisable
- Toutes les fonctions de calcul sont dans `pdf-export.js`
- Aucune dépendance externe (sauf jsPDF)
- Facile à désactiver si besoin

### ✅ Design professionnel
- Tableaux avec en-têtes colorés
- Mise en page claire et structurée
- Graphiques visuels simples
- Export multi-pages

### ✅ Performance
- Génération rapide (< 1 seconde)
- Pas de requête serveur
- Traitement 100% côté client

---

## 📝 Notes Importantes

### Compatibilité navigateurs
- ✅ Chrome/Edge : Compatible
- ✅ Firefox : Compatible
- ✅ Safari : Compatible
- ⚠️ IE11 : Non supporté (jsPDF)

### Limites
- Le PDF est généré côté client (navigateur)
- Pas de personnalisation graphique avancée (pas de charts.js)
- Les graphiques sont des barres simples textuelles

### Sécurité
- Aucune donnée n'est envoyée à un serveur
- Export 100% local
- Respect de la vie privée

---

## 🚀 Évolutions Futures Possibles

Si vous souhaitez améliorer l'export PDF à l'avenir :

1. **Graphiques avancés** : Intégrer Chart.js pour des graphiques plus visuels
2. **Logo personnalisé** : Ajouter le logo de votre club
3. **Signature numérique** : Pour valider officiellement les rapports
4. **Export automatique** : À la fin de chaque match
5. **Templates multiples** : Plusieurs styles de rapport
6. **Multi-langue** : Support de plusieurs langues

---

## 💡 Support

Si vous rencontrez un problème :
1. Vérifiez la console du navigateur (F12)
2. Assurez-vous que tous les fichiers sont bien en place
3. Vérifiez que les CDN jsPDF sont accessibles
4. Testez avec des données de match complètes

---

**🎉 Installation terminée ! Vous pouvez maintenant exporter vos matchs en PDF professionnel.**