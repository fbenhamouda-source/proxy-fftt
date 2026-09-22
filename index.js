const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Scraping léger via la fiche Pongiste
        const response = await fetch(`https://www.pongiste.fr/joueur/${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const html = await response.text();
        const matchs = [];

        // Extraction des lignes de parties
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(html)) !== null) {
            const rowContent = rowMatch[1];
            
            // Extraction des cellules
            const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            const cols = [];
            let cellMatch;

            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
                cols.push(text);
            }

            // Structure type d'une ligne de match : [Date, Adversaire, Clst/Pts, V/D]
            if (cols.length >= 3) {
                const isVictoire = cols.some(c => c === 'V' || c === 'Victoire');
                const isDefaite = cols.some(c => c === 'D' || c === 'Défaite');

                if (isVictoire || isDefaite) {
                    const nom = cols.find(c => c.length > 2 && !/^\d+$/.test(c) && !['V', 'D', 'Victoire', 'Défaite'].includes(c)) || "Adversaire";
                    const pts = cols.find(c => /^\d{3,4}$/.test(c)) || "500";
                    const date = cols.find(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c)) || "";

                    matchs.push({
                        nomAdversaire: nom,
                        pointsAdversaire: parseFloat(pts),
                        victoire: isVictoire,
                        date: date
                    });
                }
            }
        }

        res.json(matchs);
    } catch (error) {
        console.error("Erreur serveur :", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
