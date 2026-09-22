const express = require('express');
const { JSDOM } = require('jsdom');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;
        
        // Exécution dans un environnement DOM virtuel pour interpréter la page
        const dom = await JSDOM.fromURL(`https://www.fftt.com/site/joueur/${licence}`, {
            runScripts: "dangerously",
            resources: "usable",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        });

        // Temps d'attente pour le chargement du tableau JS
        await new Promise(resolve => setTimeout(resolve, 2000));

        const document = dom.window.document;
        const rows = document.querySelectorAll('tr');
        const matchs = [];

        rows.forEach(row => {
            const cols = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim());
            
            if (cols.length >= 3) {
                const hasV = cols.includes('V');
                const hasD = cols.includes('D');

                if (hasV || hasD) {
                    const nom = cols.find(c => c.length > 3 && !/^\d+$/.test(c) && c !== 'V' && c !== 'D') || "Adversaire";
                    const pts = cols.find(c => /^\d{3,4}$/.test(c)) || "500";

                    matchs.push({
                        nomAdversaire: nom,
                        pointsAdversaire: parseFloat(pts),
                        victoire: hasV,
                        date: ""
                    });
                }
            }
        });

        res.json(matchs);
    } catch (error) {
        console.error("Erreur JSDOM :", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
