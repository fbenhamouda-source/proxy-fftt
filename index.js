const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Requête vers le flux direct Espace Licencié SPID
        const url = `https://spid.fftt.com/spid/spid_partie_joueur.php?licence=${licence}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const html = await response.text();
        const matchs = [];

        // Parsing HTML léger des lignes du tableau de parties
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(html)) !== null) {
            const rowContent = rowMatch[1];
            
            // Nettoyage des balises <td>
            const cells = [];
            const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            let cellMatch;

            while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                const cleanText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
                cells.push(cleanText);
            }

            if (cells.length >= 4) {
                const vd = cells.find(c => c === 'V' || c === 'D');
                if (vd) {
                    const nom = cells.find(c => c.length > 2 && !/^\d+$/.test(c) && c !== 'V' && c !== 'D') || "Adversaire";
                    const pts = cells.find(c => /^\d{3,4}$/.test(c)) || "500";
                    const date = cells.find(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c)) || "";

                    matchs.push({
                        nomAdversaire: nom,
                        pointsAdversaire: parseFloat(pts),
                        victoire: vd === 'V',
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
