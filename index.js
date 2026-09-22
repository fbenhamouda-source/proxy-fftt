const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;
        // API PingOpen directe
        const response = await fetch(`https://api.pingopen.fr/joueurs/${licence}/matchs`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const data = await response.json();
        const liste = Array.isArray(data) ? data : (data.matchs || []);

        const matchs = liste.map(item => ({
            nomAdversaire: item.adversaire || item.nom_adversaire || "Inconnu",
            pointsAdversaire: parseFloat(item.points_adversaire || item.points) || 500,
            victoire: item.victoire === true || item.resultat === 'V' || item.victoire === 'V',
            date: item.date || ""
        }));

        res.json(matchs);
    } catch (error) {
        console.error("Erreur PingOpen:", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
