const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;

        // Appel de la passerelle Smartping
        const response = await fetch(`https://apiping.fftt.com/api/joueur_partie.xml?licence=${licence}`, {
            headers: {
                'User-Agent': 'Smartping/3.0.1 (iPhone; iOS 16.0; Scale/3.00)',
                'Accept': 'text/xml, application/xml'
            }
        });

        if (!response.ok) {
            // Passerelle alternative JSON si le serveur principal est indisponible
            const altResponse = await fetch(`https://api.pingopen.fr/joueurs/${licence}/joueur`);
            if (altResponse.ok) {
                const altData = await altResponse.json();
                return res.json(altData.matchs || []);
            }
            return res.json([]);
        }

        const xmlText = await response.text();
        const matchs = [];

        // Extraction Regex des balises XML <partie> de la FFTT
        const partieRegex = /<partie>([\s\S]*?)<\/partie>/g;
        let match;

        while ((match = partieRegex.exec(xmlText)) !== null) {
            const block = match[1];

            const nom = (block.match(/<nom>([^<]*)<\/nom>/) || [])[1] || 
                        (block.match(/<adv>([^<]*)<\/adv>/) || [])[1] || "Inconnu";
            const points = (block.match(/<point>([^<]*)<\/point>/) || [])[1] || 
                           (block.match(/<pointadv>([^<]*)<\/pointadv>/) || [])[1] || "500";
            const vd = (block.match(/<vd>([^<]*)<\/vd>/) || [])[1] || "";
            const date = (block.match(/<date>([^<]*)<\/date>/) || [])[1] || "";

            matchs.push({
                nomAdversaire: nom.trim(),
                pointsAdversaire: parseFloat(points) || 500,
                victoire: vd.toUpperCase() === 'V' || vd === '1',
                date: date.trim()
            });
        }

        res.json(matchs);
    } catch (error) {
        console.error("Erreur serveur :", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
