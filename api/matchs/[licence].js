export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { licence } = req.query;

    if (!licence) {
        return res.status(400).json({ error: "Licence manquante" });
    }

    try {
        // Utilisation d'une autre API publique stable pour la FFTT
        const targetUrl = `https://apiv2.pingify.fr/api/v1/joueur/${licence}/parties`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(200).json([]);
        }

        const data = await response.json();
        
        // Sécurité selon la structure renvoyée
        const parties = Array.isArray(data) ? data : (data.parties || data.list || []);

        const matchs = parties.map(item => ({
            nomAdversaire: item.nomadv || item.adversaire || item.nomAdversaire || "Adversaire",
            pointsAdversaire: parseFloat(item.pointadv || item.pointsAdversaire || item.classement) || 500,
            victoire: item.vd === "V" || item.victoire === true,
            date: item.date || ""
        }));

        return res.status(200).json(matchs);

    } catch (error) {
        return res.status(200).json([]);
    }
}
