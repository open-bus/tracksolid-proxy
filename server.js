const express = require('express');
const axios = require('axios');
const md5 = require('md5');
const app = express();
const PORT = process.env.PORT || 3000;

const appKey = "8FB345B8693CCD0030874ECE0B95805F";
const appSecret = "c07101ce49e144ebb04016a39e8b472d";
const user = "Offlimits";
const password = "cd9323048162e373f71fcfad77b7eb67"; // MD5 of MakinatPortokalli23
const imei = "862798051314108";

let accessToken = null;
let tokenExpiry = 0;

function generateSign(params) {
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(k => k + params[k]).join('');
    return md5(appSecret + signStr + appSecret).toUpperCase();
}

async function getAccessToken() {
    const now = Date.now();
    if (accessToken && now < tokenExpiry) return accessToken;

    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    const params = {
        method: "jimi.oauth.token.get",
        app_key: appKey,
        timestamp,
        v: "1.0",
        format: "json",
        sign_method: "md5",
        user_id: user,
        user_pwd_md5: password,
        expires_in: 7200
    };

    const sign = generateSign(params);

    const res = await axios.post("https://eu-open.tracksolidpro.com/route/rest",
        new URLSearchParams({ ...params, sign }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (res.data.code === 0) {
        accessToken = res.data.result.accessToken;
        tokenExpiry = now + (res.data.result.expiresIn * 1000);
        return accessToken;
    } else {
        throw new Error("Token fetch failed: " + res.data.message);
    }
}

app.get('/location', async (req, res) => {
    try {
        const token = await getAccessToken();
        const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
        const params = {
            method: "jimi.device.location.get",
            app_key: appKey,
            timestamp,
            v: "1.0",
            format: "json",
            sign_method: "md5",
            access_token: token,
            imeis: imei
        };

        const sign = generateSign(params);

        const response = await axios.post("https://eu-open.tracksolidpro.com/route/rest",
            new URLSearchParams({ ...params, sign }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const loc = response.data.result[0];
        res.json({ lat: loc.lat, lng: loc.lng });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
