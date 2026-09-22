const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Configuration d'Axios avec de vrais en-têtes de navigateur
        const response = await axios.get(`https://www.pongiste.fr/joueur/${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3'
            },
            timeout: 8000
        });

        const $ = cheerio.load(response.data);
        const matchs = [];

        // Parsing du DOM HTML avec Cheerio
        $('table tr').each((index, element) => {
            const cols = $(element).find('td').map((i, el) =>$(el).text().trim()).get();

            if (cols.length >= 3) {
                const textRow = cols.join(' ');
                const isVictoire = textRow.includes('V') || textRow.toLowerCase().includes('victoire');
                const isDefaite = textRow.includes('D') || textRow.toLowerCase().includes('défaite');

                if (isVictoire || isDefaite) {
                    // Recherche du nom de l'adversaire
                    const nom = cols.find(c => c.length > 2 && !/^\d+$/.test(c) && !['V', 'D', 'Victoire', 'Défaite'].includes(c)) || "Adversaire";
                    
                    // Recherche des points
                    const pts = cols.find(c => /^\d{3,4}$/.test(c)) || "500";
                    
                    // Recherche de la date
                    const date = cols.find(c => /^\d{2}\/\d{2}\/\d{2,4}$/.test(c)) || "";

                    matchs.push({
                        nomAdversaire: nom,
                        pointsAdversaire: parseFloat(pts),
                        victoire: isVictoire,
                        date: date
                    });
                }
            }
        });

        res.json(matchs);
    } catch (error) {
        console.error("Erreur de récupération :", error.message);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
