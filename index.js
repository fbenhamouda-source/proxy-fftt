const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Requête vers le miroir JSON public mis à jour
        const response = await fetch(`https://fftt.pingopen.fr/api/joueurs/${licence}/parties`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Tentative sur la route secondaire de recherche directe
            const altResponse = await fetch(`https://fftt.pingopen.fr/api/joueur/${licence}`);
            if (altResponse.ok) {
                const altData = await altResponse.json();
                const partieList = altData.parties || altData.matchs || [];
                return res.json(formatMatchs(partieList));
            }
            return res.json([]);
        }

        const data = await response.json();
        return res.json(formatMatchs(data));

    } catch (error) {
        console.error("Erreur proxy :", error.message);
        res.json([]);
    }
});

function formatMatchs(liste) {
    if (!Array.isArray(liste)) return [];

    return liste.map(item => ({
        nomAdversaire: item.nomadv || item.nom_adversaire || item.adversaire || item.nom || "Adversaire",
        pointsAdversaire: parseFloat(item.pointadv || item.points_adversaire || item.points) || 500,
        victoire: item.vd === "V" || item.victoire === true || item.resultat === 'V',
        date: item.date || ""
    }));
}

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
