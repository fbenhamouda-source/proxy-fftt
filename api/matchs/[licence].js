export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { licence } = req.query;

    if (!licence) {
        return res.status(400).json({ error: "Licence manquante" });
    }

    try {
        // Interrogation de la source de données alternative
        const response = await fetch(`https://fftt.pingopen.fr/api/joueurs/${licence}/parties`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            return res.status(200).json([]);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return res.status(200).json([]);
        }

        // Formatage uniforme pour l'application ECCTT
        const matchs = data.map(item => ({
            nomAdversaire: item.nomadv || item.nom_adversaire || item.adversaire || "Adversaire",
            pointsAdversaire: parseFloat(item.pointadv || item.points_adversaire || item.points) || 500,
            victoire: item.vd === "V" || item.victoire === true,
            date: item.date || ""
        }));

        return res.status(200).json(matchs);

    } catch (error) {
        return res.status(200).json([]);
    }
}
