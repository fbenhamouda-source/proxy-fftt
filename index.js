const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const response = await fetch(`https://www.fftt.com/site/joueur/${req.params.licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        const matchs = [];
        
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        let match;
        
        while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[1];
            const cols = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
            
            if (cols.length >= 4) {
                matchs.push({
                    nomAdversaire: cols[0],
                    pointsAdversaire: parseFloat(cols[1]) || 500,
                    victoire: cols[2].toUpperCase() === 'V',
                    date: cols[3]
                });
            }
        }

        res.json(matchs);
    } catch (error) {
        res.status(500).json({ error: error.message, matchs: [] });
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
