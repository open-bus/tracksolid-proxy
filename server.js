const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 10000;

// TracksolidPro credentials (set as environment variables)
const appKey = process.env.APP_KEY;
const appSecret = process.env.APP_SECRET;
const account = process.env.ACCOUNT;
const password = process.env.PASSWORD;

// In-memory token cache
let token = null;
let tokenTime = 0;

// Get access token
async function getToken() {
  const now = Date.now();
  if (token && now - tokenTime < 2 * 60 * 60 * 1000) return token;

  const { data } = await axios.post("https://www.tracksolidpro.com/api/user/login", {
    appKey,
    appSecret,
    account,
    password,
  });

  token = data.data.token;
  tokenTime = now;
  return token;
}

// GET /location/:imei route
app.get("/location/:imei", async (req, res) => {
  try {
    const token = await getToken();
    const imei = req.params.imei;

    const { data } = await axios.post(
      "https://www.tracksolidpro.com/api/location/getLatest",
      { imei },
      {
        headers: { token },
      }
    );

    if (!data.data) return res.status(404).json({ error: "Device not found" });

    const { lat, lng } = data.data;
    res.json({ lat, lng });
  } catch (err) {
    console.error("Error fetching location:", err.message);
    res.status(500).json({ error: "Failed to get location" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
