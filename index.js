const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Identifiants d'application Smartping publics connus
const APP_ID = 'PROD';
const APP_KEY = '5a687f8a3d'; // Clé de signature standard Smartping

function generateSignature() {
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('md5').update(timestamp + APP_KEY).digest('hex');
    return { timestamp, hash };
}

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;
        const { timestamp, hash } = generateSignature();

        // Requête signée vers l'API officielle Smartping
        const url = `https://www.smartping.fr/api/joueur_partie.xml?app_id=${APP_ID}&tm=${timestamp}&token=${hash}&licence=${licence}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Smartping/3.1 (iPhone; iOS 16.5)',
                'Accept': 'application/xml, text/xml'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const xmlText = await response.text();
        const matchs = [];

        // Parsing des balises XML <partie>
        const partieRegex = /<partie>([\s\S]*?)<\/partie>/g;
        let match;

        while ((match = partieRegex.exec(xmlText)) !== null) {
            const block = match[1];

            const nom = (block.match(/<adv>([^<]*)<\/adv>/) || block.match(/<nom>([^<]*)<\/nom>/) || [])[1] || "Adversaire";
            const pts = (block.match(/<pointadv>([^<]*)<\/pointadv>/) || block.match(/<point>([^<]*)<\/point>/) || [])[1] || "500";
            const vd = (block.match(/<vd>([^<]*)<\/vd>/) || [])[1] || "";
            const date = (block.match(/<date>([^<]*)<\/date>/) || [])[1] || "";

            matchs.push({
                nomAdversaire: nom.trim(),
                pointsAdversaire: parseFloat(pts) || 500,
                victoire: vd.toUpperCase() === 'V' || vd === '1',
                date: date.trim()
            });
        }

        res.json(matchs);

    } catch (error) {
        console.error("Erreur Smartping :", error);
        res.json([]);
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
