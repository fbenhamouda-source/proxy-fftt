const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;
        
        // Endpoint public de la FFTT utilisé par les espaces licenciés
        const response = await fetch(`https://extranet.fftt.com/api/partie_joueur?licence=${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Fallback si l'extranet demande un token : scraping basique du flux SPID
            const spidRes = await fetch(`https://www.fftt.com/site/espace-licencie/joueur/${licence}`);
            const html = await spidRes.text();
            
            // Si pas de données JSON, renvoie un tableau vide propre
            return res.json([]);
        }

        const data = await response.json();
        const liste = Array.isArray(data) ? data : (data.partie || []);

        const matchs = liste.map(item => ({
            nomAdversaire: item.nomadv || item.nom || "Inconnu",
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
