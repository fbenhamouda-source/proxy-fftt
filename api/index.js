module.exports = async (req, res) => {
    // Gestion des CORS pour ton application ECCTT
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Récupération de la licence depuis l'URL
    const urlParts = req.url.split('/');
    const licence = urlParts[urlParts.length - 1] || '0213164';

    try {
        const response = await fetch(`https://www.pongiste.fr/joueur/${licence}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            }
        });

        if (!response.ok) {
            return res.status(200).json([]);
        }

        const html = await response.text();
        const matchs = [];

        // Extraction des lignes du tableau HTML
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

        return res.status(200).json(matchs);

    } catch (error) {
        return res.status(200).json([]);
    }
};
