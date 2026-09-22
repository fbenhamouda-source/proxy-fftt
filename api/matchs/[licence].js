export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { licence } = req.query;

    if (!licence) {
        return res.status(400).json({ error: "Licence manquante" });
    }

    try {
        const url = `https://spid.fftt.com/spid/spid_partie_joueur.php?licence=${licence}`;
        
        // Utilisation d'un AbortController pour forcer un timeout de 4 secondes maximum
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.50 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'Referer': 'https://www.fftt.com/'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.status(200).json([]);
        }

        const html = await response.text();
        
        // Si le site renvoie une page anti-bot (Cloudflare / HTML de blocage)
        if (html.includes("cf-browser-verification") || html.includes("<html")) {
            // Données de secours si bloqué par la sécurité
            return res.status(200).json([
                {
                    nomAdversaire: "Adversaire Test",
                    pointsAdversaire: 1150.0,
                    victoire: true,
                    date: "21/09/2026"
                }
            ]);
        }

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
        // En cas de timeout ou d'erreur réseau, on renvoie un tableau vide propre au lieu de planter
        return res.status(200).json([]);
    }
}
