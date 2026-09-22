const express = require('express');
const app = express();

app.get('/api/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        const response = await fetch(`https://www.pongiste.fr/joueur/${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        });

        if (!response.ok) return res.json([]);

        const html = await response.text();
        const matchs = [];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(html)) !== null) {
            const cols = [];
            const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            let cellMatch;

            while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
                cols.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
            }

            if (cols.length >= 3) {
                const isV = cols.some(c => c === 'V' || c === 'Victoire');
                const isD = cols.some(c => c === 'D' || c === 'Défaite');

                if (isV || isD) {
                    const nom = cols.find(c => c.length > 2 && !/^\d+$/.test(c) && !['V','D','Victoire','Défaite'].includes(c)) || "Adversaire";
                    const pts = cols.find(c => /^\d{3,4}$/.test(c)) || "500";
                    const date = cols.find(c => /^\d{2}\/\d{2}\/\d{2,4}$/.test(c)) || "";

                    matchs.push({
                        nomAdversaire: nom,
                        pointsAdversaire: parseFloat(pts),
                        victoire: isV,
                        date: date
                    });
                }
            }
        }

        res.json(matchs);
    } catch (e) {
        res.json([]);
    }
});

module.exports = app;
