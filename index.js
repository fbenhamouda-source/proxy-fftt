const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;
        
        // Requête directe sur la fiche FFTT avec headers complets
        const response = await fetch(`https://www.fftt.com/site/joueur/${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const html = await response.text();
        const matchs = [];

        // Parsing HTML personnalisé pour extraire le tableau des parties
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(html)) !== null) {
            const rowContent = rowMatch[1];
            
            // Extraction de chaque cellule <td> ou <th>
            const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
            const cols = [];
            let cellMatch;
            
            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                // Nettoyage des balises HTML et des espaces vides
                const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
                cols.push(text);
            }

            // On cherche les lignes contenant une victoire (V) ou défaite (D)
            if (cols.length >= 3) {
                const isVictoire = cols.some(c => c === 'V');
                const isDefaite = cols.some(c => c === 'D');

                if (isVictoire || isDefaite) {
                    // Recherche du nom et des points dans la ligne
                    const nom = cols.find(c => c.length > 3 && !/^\d+$/.test(c) && c !== 'V' && c !== 'D') || "Adversaire";
                    const pointsStr = cols.find(c => /^\d{3,4}$/.test(c)) || "500";

                    matchs.push({
                        nomAdversaire: nom,
                        pointsAdversaire: parseFloat(pointsStr),
                        victoire: isVictoire,
                        date: ""
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
