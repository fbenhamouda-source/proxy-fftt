export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { licence } = req.query;

    if (!licence) {
        return res.status(400).json({ error: "Licence manquante" });
    }

    try {
        const targetUrl = `https://fftt.pingopen.fr/api/joueurs/${licence}/parties`;
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json'
            }
        });

        const textData = await response.text();

        // On renvoie un objet de diagnostic pour voir ce que l'API distante répond vraiment
        return res.status(200).json({
            statusHttp: response.status,
            urlAppellee: targetUrl,
            reponseBrute: textData
        });

    } catch (error) {
        return res.status(200).json({ erreurInterne: error.message });
    }
}
