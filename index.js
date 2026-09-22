const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/matchs/:licence', async (req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--single-process',
                '--no-zygote'
            ]
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(`https://www.fftt.com/site/joueur/${req.params.licence}`, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
        });

        const matchs = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tr'));
            return rows.map(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length < 4) return null;
                return {
                    nomAdversaire: cols[0].innerText.trim(),
                    pointsAdversaire: parseFloat(cols[1].innerText.trim()) || 500,
                    victoire: cols[2].innerText.trim().toUpperCase() === 'V',
                    date: cols[3].innerText.trim()
                };
            }).filter(item => item !== null);
        });

        await browser.close();
        res.json(matchs);
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ error: error.message, matchs: [] });
    }
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
