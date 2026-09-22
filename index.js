const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Source JSON publique stable sans scraping HTML
        const response = await fetch(`https://fftt.pingify.fr/api/joueurs/${licence}/matchs`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const data = await response.json();
        const liste = Array.isArray(data) ? data : (data.matchs || data.parties || []);

        const matchs = liste.map(item => ({
            nomAdversaire: item.nom_adversaire || item.adversaire || item.nom || "Inconnu",
            pointsAdversaire: parseFloat(item.points_adversaire || item.points || item.clst) || 500,
            victoire: item.victoire === true || item.victoire === 'V' || item.resultat === 'V',
            date: item.date || ""
        }));

        res.json(matchs);
    } catch (error) {
        console.error("Erreur serveur :", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
