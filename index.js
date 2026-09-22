const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Requête directe au serveur Smartping (API mobile)
        const response = await fetch(`https://smartping.fftt.com/api/joueur/${licence}/parties`, {
            headers: {
                'User-Agent': 'Smartping/3.1 (iPhone; iOS 16.5; Scale/3.00)',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        if (!response.ok) {
            // Fallback sur le miroir API si le serveur principal rejette le header
            const fbResponse = await fetch(`https://api.fftt.com/api/joueur_partie?licence=${licence}`);
            if (fbResponse.ok) {
                const fbData = await fbResponse.json();
                return res.json(formatMatchs(fbData));
            }
            return res.json([]);
        }

        const data = await response.json();
        return res.json(formatMatchs(data));

    } catch (error) {
        console.error("Erreur serveur :", error);
        res.json([]);
    }
});

function formatMatchs(data) {
    const liste = Array.isArray(data) ? data : (data.partie || data.parties || data.matchs || []);
    
    return liste.map(item => ({
        nomAdversaire: item.nomadv || item.nom_adversaire || item.adversaire || item.nom || "Inconnu",
        pointsAdversaire: parseFloat(item.pointadv || item.points_adversaire || item.points) || 500,
        victoire: item.vd === "V" || item.victoire === "1" || item.victoire === true || item.resultat === 'V',
        date: item.date || ""
    }));
}

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
