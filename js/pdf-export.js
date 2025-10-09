/**
 * PDF Export Module
 * Gestion de l'export PDF des statistiques de match
 * Utilise jsPDF et jspdf-autotable
 */

/**
 * Génération du PDF complet du match
 */
async function generateMatchPDF() {
    try {
        // Vérifier que jsPDF est chargé
        if (typeof window.jspdf === 'undefined') {
            showNotification('Erreur : Bibliothèque PDF non chargée', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Récupérer les données
        const state = footballApp.getState();
        const config = getMatchConfig();
        const matchData = prepareMatchData(state, config);

        // Générer les sections du PDF
        let yPosition = 20;

        // 1. En-tête et résumé du match
        yPosition = addMatchHeader(doc, matchData, yPosition);

        // 2. Score et résumé
        yPosition = addMatchSummary(doc, matchData, yPosition);

        // 3. Statistiques globales
        yPosition = addGlobalStats(doc, matchData, yPosition);

        // Nouvelle page pour les stats détaillées
        doc.addPage();
        yPosition = 20;

        // 4. Timeline des événements
        yPosition = addTimeline(doc, matchData, yPosition);

        // Nouvelle page pour les stats joueuses
        doc.addPage();
        yPosition = 20;

        // 5. Statistiques des joueuses
        yPosition = addPlayersStats(doc, matchData, yPosition);

        // 6. Graphiques de performance
        yPosition = addPerformanceCharts(doc, matchData, yPosition);

        // Sauvegarder le PDF
        const fileName = `Match_${config.teamName}_vs_${config.opponentName}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        showNotification('✅ PDF exporté avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        showNotification('❌ Erreur lors de l\'export PDF', 'error');
    }
}

/**
 * Préparation des données du match
 */
function prepareMatchData(state, config) {
    // Calcul des statistiques
    const globalStats = calculateGlobalStatsForPDF(state.events);
    const playersStats = calculatePlayersStatsForPDF(state.events, state.players);
    const halftimeStats = calculateHalftimeStatsForPDF(state.events);

    return {
        config: config,
        score: state.score,
        time: state.time,
        half: state.half,
        events: state.events || [],
        players: state.players || [],
        globalStats: globalStats,
        playersStats: playersStats,
        halftimeStats: halftimeStats,
        exportDate: new Date()
    };
}

/**
 * Ajout de l'en-tête du match
 */
function addMatchHeader(doc, matchData, yPos) {
    // Titre principal
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('⚽ RAPPORT DE MATCH', 105, yPos, { align: 'center' });

    yPos += 10;

    // Informations du match
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${matchData.exportDate.toLocaleDateString('fr-FR')}`, 20, yPos);
    doc.text(`Heure: ${matchData.exportDate.toLocaleTimeString('fr-FR')}`, 150, yPos);

    yPos += 8;
    doc.text(`Lieu: ${matchData.config.venue || 'Non spécifié'}`, 20, yPos);

    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);

    return yPos + 10;
}

/**
 * Ajout du résumé du match (score)
 */
function addMatchSummary(doc, matchData, yPos) {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');

    // Équipe domicile
    doc.text(matchData.config.teamName, 40, yPos);
    
    // Score
    doc.setFontSize(24);
    const scoreText = `${matchData.score.team} - ${matchData.score.opponent}`;
    doc.text(scoreText, 105, yPos, { align: 'center' });

    // Équipe adverse
    doc.setFontSize(16);
    doc.text(matchData.config.opponentName, 170, yPos, { align: 'right' });

    yPos += 10;

    // Temps de jeu
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const minutes = Math.floor(matchData.time / 60);
    const matchStatus = matchData.half === 3 ? 'Terminé' : `${matchData.half}ère mi-temps`;
    doc.text(`Temps de jeu: ${minutes} min - ${matchStatus}`, 105, yPos, { align: 'center' });

    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);

    return yPos + 10;
}

/**
 * Ajout des statistiques globales
 */
function addGlobalStats(doc, matchData, yPos) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('📊 STATISTIQUES GLOBALES', 20, yPos);

    yPos += 8;

    // Créer le tableau des stats
    const statsData = [
        ['Statistique', matchData.config.teamName, matchData.config.opponentName],
        ['⚽ Buts', matchData.globalStats.team.goals, matchData.globalStats.opponent.goals],
        ['🎯 Tirs', matchData.globalStats.team.shots, matchData.globalStats.opponent.shots],
        ['🟨 Cartons', matchData.globalStats.team.cards, matchData.globalStats.opponent.cards],
        ['⚠️ Fautes', matchData.globalStats.team.fouls, matchData.globalStats.opponent.fouls],
        ['🧤 Arrêts', matchData.globalStats.team.saves, matchData.globalStats.opponent.saves],
        ['⚽ Coups francs', matchData.globalStats.team.freeKicks, matchData.globalStats.opponent.freeKicks]
    ];

    doc.autoTable({
        startY: yPos,
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
        styles: { fontSize: 10, halign: 'center' },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold' }
        }
    });

    return doc.lastAutoTable.finalY + 10;
}

/**
 * Ajout de la timeline des événements
 */
function addTimeline(doc, matchData, yPos) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('📝 TIMELINE DES ÉVÉNEMENTS', 20, yPos);

    yPos += 8;

    if (matchData.events.length === 0) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Aucun événement enregistré', 20, yPos);
        return yPos + 10;
    }

    // Préparer les données de la timeline
    const timelineData = matchData.events.map(event => {
        const playerName = event.playerId === 'opponent' ? 
            'Équipe Adverse' : 
            (matchData.players.find(p => p.id === event.playerId)?.name || 'Inconnu');
        
        const team = event.isTeam ? matchData.config.teamName : matchData.config.opponentName;
        const description = getEventDescriptionForPDF(event, playerName);

        return [
            event.time,
            `${event.half}ère MT`,
            team,
            description
        ];
    });

    doc.autoTable({
        startY: yPos,
        head: [['Temps', 'Période', 'Équipe', 'Événement']],
        body: timelineData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'center', cellWidth: 20 },
            2: { halign: 'left', cellWidth: 40 },
            3: { halign: 'left' }
        }
    });

    return doc.lastAutoTable.finalY + 10;
}

/**
 * Ajout des statistiques des joueuses
 */
function addPlayersStats(doc, matchData, yPos) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('👥 STATISTIQUES DES JOUEUSES', 20, yPos);

    yPos += 8;

    // Trier les joueuses par score
    const sortedPlayers = Object.values(matchData.playersStats)
        .filter(p => p.goals > 0 || p.shots > 0 || p.cards > 0 || p.saves > 0)
        .sort((a, b) => b.score - a.score);

    if (sortedPlayers.length === 0) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Aucune statistique individuelle disponible', 20, yPos);
        return yPos + 10;
    }

    // Préparer les données des joueuses
    const playersData = sortedPlayers.map(player => [
        player.name,
        player.position,
        player.goals,
        player.shots,
        player.cards,
        player.saves,
        player.score
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Joueuse', 'Poste', 'Buts', 'Tirs', 'Cartons', 'Arrêts', 'Score']],
        body: playersData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center', fontStyle: 'bold' }
        }
    });

    return doc.lastAutoTable.finalY + 10;
}

/**
 * Ajout des graphiques de performance
 */
function addPerformanceCharts(doc, matchData, yPos) {
    // Vérifier si on a assez d'espace
    if (yPos > 200) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('📈 ANALYSE DE PERFORMANCE', 20, yPos);

    yPos += 10;

    // Top 5 joueuses
    const top5 = Object.values(matchData.playersStats)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (top5.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('🏆 Top 5 Joueuses', 20, yPos);
        yPos += 8;

        top5.forEach((player, index) => {
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            
            // Barre de progression visuelle
            const barWidth = (player.score / Math.max(...top5.map(p => p.score))) * 100;
            doc.setFillColor(46, 204, 113);
            doc.rect(60, yPos - 3, barWidth, 5, 'F');
            
            // Texte
            doc.text(`${index + 1}. ${player.name}`, 20, yPos);
            doc.text(`${player.score} pts`, 165, yPos);
            
            yPos += 8;
        });
    }

    yPos += 10;

    // Statistiques par mi-temps
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('⏱️ Analyse par Mi-temps', 20, yPos);
    yPos += 8;

    const halftimeData = [
        ['Période', 'Buts', 'Tirs', 'Cartons', 'Événements'],
        [
            '1ère MT',
            matchData.halftimeStats.firstHalf.goals,
            matchData.halftimeStats.firstHalf.shots,
            matchData.halftimeStats.firstHalf.cards,
            matchData.halftimeStats.firstHalf.events
        ],
        [
            '2ème MT',
            matchData.halftimeStats.secondHalf.goals,
            matchData.halftimeStats.secondHalf.shots,
            matchData.halftimeStats.secondHalf.cards,
            matchData.halftimeStats.secondHalf.events
        ]
    ];

    doc.autoTable({
        startY: yPos,
        head: [halftimeData[0]],
        body: halftimeData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [155, 89, 182], fontStyle: 'bold' },
        styles: { fontSize: 10, halign: 'center' }
    });

    return doc.lastAutoTable.finalY + 10;
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Calcul des stats globales pour le PDF
 */
function calculateGlobalStatsForPDF(events) {
    const stats = {
        team: { goals: 0, shots: 0, cards: 0, fouls: 0, saves: 0, freeKicks: 0 },
        opponent: { goals: 0, shots: 0, cards: 0, fouls: 0, saves: 0, freeKicks: 0 }
    };

    events.forEach(event => {
        const target = event.isTeam ? stats.team : stats.opponent;
        
        switch (event.type) {
            case 'goal': target.goals++; break;
            case 'shot': target.shots++; break;
            case 'card': target.cards++; break;
            case 'foul': target.fouls++; break;
            case 'save': if (event.isTeam) target.saves++; break;
            case 'freeKick': target.freeKicks++; break;
        }
    });

    return stats;
}

/**
 * Calcul des stats des joueuses pour le PDF
 */
function calculatePlayersStatsForPDF(events, players) {
    const stats = {};

    // Initialiser
    players.forEach(player => {
        stats[player.id] = {
            ...player,
            goals: 0,
            shots: 0,
            cards: 0,
            fouls: 0,
            saves: 0,
            freeKicks: 0,
            score: 0
        };
    });

    // Calculer
    events.forEach(event => {
        if (event.playerId && event.playerId !== 'opponent' && stats[event.playerId]) {
            const playerStat = stats[event.playerId];

            switch (event.type) {
                case 'goal':
                    playerStat.goals++;
                    playerStat.score += 5;
                    break;
                case 'shot':
                    playerStat.shots++;
                    playerStat.score += 1;
                    break;
                case 'card':
                    playerStat.cards++;
                    playerStat.score -= (event.cardType === 'red' ? 3 : 1);
                    break;
                case 'save':
                    playerStat.saves++;
                    playerStat.score += 2;
                    break;
                case 'freeKick':
                    playerStat.freeKicks++;
                    playerStat.score += 1;
                    break;
                case 'foul':
                    playerStat.fouls++;
                    playerStat.score -= 0.5;
                    break;
            }
        }
    });

    return stats;
}

/**
 * Calcul des stats par mi-temps pour le PDF
 */
function calculateHalftimeStatsForPDF(events) {
    const stats = {
        firstHalf: { goals: 0, shots: 0, cards: 0, fouls: 0, events: 0 },
        secondHalf: { goals: 0, shots: 0, cards: 0, fouls: 0, events: 0 }
    };

    events.forEach(event => {
        const period = event.half === 1 ? stats.firstHalf : stats.secondHalf;
        period.events++;

        if (event.isTeam) {
            switch (event.type) {
                case 'goal': period.goals++; break;
                case 'shot': period.shots++; break;
                case 'card': period.cards++; break;
                case 'foul': period.fouls++; break;
            }
        }
    });

    return stats;
}

/**
 * Description d'événement pour le PDF
 */
function getEventDescriptionForPDF(event, playerName) {
    const icons = {
        'goal': '⚽',
        'shot': '🎯',
        'card': '🟨',
        'foul': '⚠️',
        'save': '🧤',
        'freeKick': '⚽',
        'substitution': '🔄'
    };

    const icon = icons[event.type] || '📌';
    
    switch (event.type) {
        case 'goal':
            return `${icon} But de ${playerName}`;
        case 'shot':
            return `${icon} Tir de ${playerName}`;
        case 'card':
            const cardType = event.cardType === 'yellow' ? 'Jaune' : event.cardType === 'red' ? 'Rouge' : 'Blanc';
            return `${icon} Carton ${cardType} - ${playerName}`;
        case 'foul':
            return `${icon} Faute de ${playerName}`;
        case 'save':
            return `${icon} Arrêt de ${playerName}`;
        case 'freeKick':
            return `${icon} Coup franc de ${playerName}`;
        case 'substitution':
            return `${icon} Remplacement - ${playerName}`;
        default:
            return `${icon} ${event.description || 'Événement'}`;
    }
}

/**
 * Obtenir la configuration du match (compatible avec storage.js)
 */
function getMatchConfig() {
    const config = localStorage.getItem('footballStats_matchConfig');
    if (config) {
        return JSON.parse(config);
    }
    
    return {
        teamName: 'Mon Équipe',
        opponentName: 'Équipe Adverse',
        venue: 'Non spécifié',
        duration: 90
    };
}

/**
 * Afficher une notification (compatible avec app.js)
 */
function showNotification(message, type = 'info') {
    // Si la fonction existe dans app.js, l'utiliser
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Sinon, fallback simple
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}