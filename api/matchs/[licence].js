export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { licence } = req.query;

    if (!licence) {
        return res.status(400).json({ error: "Licence manquante" });
    }

    try {
        const url = `https://spid.fftt.com/spid/spid_partie_joueur.php?licence=${licence}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.fftt.com/'
            }
        });

        if (!response.ok) {
            return res.status(200).json([]);
        }

        const html = await response.text();
        const matchs = [];

        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(html)) !== null) {
            const rowContent = rowMatch[1];
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

        return res.status(200).json(matchs);

    } catch (error) {
        return res.status(200).json([]);
    }
}
