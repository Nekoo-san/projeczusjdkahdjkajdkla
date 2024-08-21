const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/scrape', async (req, res) => {
    const { placeId, username } = req.query;

    if (!placeId || !username) {
        return res.status(400).send('Missing placeId or username');
    }

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    try {
        await page.goto(`https://www.roblox.com/games/${placeId}`);
        await page.waitForSelector('.server-list');

        const servers = await page.evaluate((username) => {
            const serverElements = document.querySelectorAll('.server-list .server-row');
            const matchingServers = [];

            serverElements.forEach(server => {
                const players = Array.from(server.querySelectorAll('.avatar img'))
                    .map(img => img.alt);

                if (players.includes(username)) {
                    matchingServers.push(server.dataset.serverId);
                }
            });

            return matchingServers;
        }, username);

        await browser.close();

        if (servers.length > 0) {
            res.json({ found: true, servers });
        } else {
            res.json({ found: false });
        }
    } catch (err) {
        await browser.close();
        res.status(500).send('Error scraping the site');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
