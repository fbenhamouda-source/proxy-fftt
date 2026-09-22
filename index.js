const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;
        const response = await fetch(`https://fftt-api.vercel.app/api/joueur/${licence}/matchs`, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const data = await response.json();
        
        // Sécurité si l'API renvoie un objet parent
        const listeMatchs = Array.isArray(data) ? data : (data.matchs || data.partie || []);
        
        const matchs = listeMatchs.map(item => {
            // Récupération souple des champs (majuscules/minuscules)
            const adv = item.NOM_ADV || item.nomAdv || item.adversaire || item.nom || "Inconnu";
            const pts = parseFloat(item.POINTS_ADV || item.pointsAdv || item.point || item.points) || 500;
            const vic = (item.VICTOIRE || item.victoire || item.res || "").toString().toUpperCase();
            const date = item.DATE || item.date || "";

            return {
                nomAdversaire: adv,
                pointsAdversaire: pts,
                victoire: vic === "V" || vic === "1" || vic === "TRUE",
                date: date
            };
        });

        res.json(matchs);
    } catch (error) {
        console.error("Erreur Proxy:", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
