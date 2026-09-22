const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Interrogation de la fiche Pongiste
        const response = await fetch(`https://www.pongiste.fr/joueur/${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const html = await response.text();
        const matchs = [];

        // Extraction des blocs de matchs
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

            // Si la ligne contient au moins 3 éléments
            if (cols.length >= 3) {
                const isVictoire = cols.some(c => c === 'V' || c.toLowerCase().includes('victoire'));
                const isDefaite = cols.some(c => c === 'D' || c.toLowerCase().includes('défaite') || c.toLowerCase().includes('defaite'));

                if (isVictoire || isDefaite) {
                    // Récupération du nom (première colonne texte non numérique)
                    const nom = cols.find(c => c.length > 2 && !/^\d+$/.test(c) && !['V', 'D', 'Victoire', 'Défaite'].includes(c)) || "Adversaire";
                    
                    // Récupération des points (3 ou 4 chiffres)
                    const ptsStr = cols.find(c => /^\d{3,4}$/.test(c)) || "500";

                    // Récupération de la date (Format JJ/MM/AAAA ou JJ/MM/AA)
                    const dateStr = cols.find(c => /^\d{2}\/\d{2}\/\d{2,4}$/.test(c)) || "";

                    matchs.push({
                        nomAdversaire: nom,
                        pointsAdversaire: parseFloat(ptsStr),
                        victoire: isVictoire,
                        date: dateStr
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
