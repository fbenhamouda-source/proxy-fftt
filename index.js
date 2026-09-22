const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // API directe Espace Licencié FFTT
        const response = await fetch(`https://extranet.fftt.com/api/partie_joueur?licence=${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const data = await response.json();
        
        // Extraction du tableau de parties
        const liste = Array.isArray(data) ? data : (data.partie || data.matchs || []);

        const matchs = liste.map(item => ({
            nomAdversaire: item.nomadv || item.adversaire || item.nom || "Inconnu",
            pointsAdversaire: parseFloat(item.pointadv || item.points) || 500,
            victoire: item.vd === "V" || item.victoire === "1" || item.victoire === true,
            date: item.date || ""
        }));

        res.json(matchs);
    } catch (error) {
        console.error("Erreur serveur :", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
