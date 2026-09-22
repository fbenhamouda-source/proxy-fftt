const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Clé applicative Smartping V2
const APP_ID = 'SERIE';
const APP_SECRET = 'a1b2c3d4e5f6'; 

function getAuthParams() {
    const tm = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14); // Format YYYYMMDDHHmmss
    const tmc = crypto.createHash('md5').update(tm + APP_SECRET).digest('hex');
    return { tm, tmc };
}

app.get('/matchs/:licence', async (req, res) => {
    try {
        const { licence } = req.params;
        const { tm, tmc } = getAuthParams();

        // Endpoint officiel APIv2 Smartping
        const url = `https://apiv2.fftt.com/mobile/pxml/xml_partie.php?serie=SMARTPING_WEB&id=${APP_ID}&tm=${tm}&tmc=${tmc}&licence=${licence}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Smartping/2.0 (Android; Mobile)',
                'Accept': 'text/xml, application/xml'
            }
        });

        if (!response.ok) {
            return res.json([]);
        }

        const xmlText = await response.text();
        const matchs = [];

        // Parsing des balises XML <partie>
        const partieRegex = /<partie>([\s\S]*?)<\/partie>/gi;
        let match;

        while ((match = partieRegex.exec(xmlText)) !== null) {
            const block = match[1];

            const nom = (block.match(/<adv>([^<]*)<\/adv>/i) || block.match(/<nom>([^<]*)<\/nom>/i) || [])[1] || "Adversaire";
            const pts = (block.match(/<pointadv>([^<]*)<\/pointadv>/i) || block.match(/<point>([^<]*)<\/point>/i) || [])[1] || "500";
            const vd = (block.match(/<vd>([^<]*)<\/vd>/i) || [])[1] || "";
            const date = (block.match(/<date>([^<]*)<\/date>/i) || [])[1] || "";

            matchs.push({
                nomAdversaire: nom.trim(),
                pointsAdversaire: parseFloat(pts) || 500,
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
