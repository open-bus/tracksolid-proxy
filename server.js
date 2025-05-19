// server.js
const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const TRACKSOLID = {
  appKey: process.env.APP_KEY,
  appSecret: process.env.APP_SECRET,
  account: process.env.ACCOUNT,
  password: process.env.PASSWORD,
};

let accessToken = null;

async function getAccessToken() {
  try {
    const res = await axios.post("https://open.10086cloud.com/api/oauth2/token", {
      appKey: TRACKSOLID.appKey,
      appSecret: TRACKSOLID.appSecret,
      account: TRACKSOLID.account,
      password: TRACKSOLID.password,
    });
    accessToken = res.data.data.accessToken;
    return accessToken;
  } catch (err) {
    console.error("Auth error:", err.response?.data || err.message);
    return null;
  }
}

app.get("/locations", async (req, res) => {
  if (!accessToken) await getAccessToken();
  if (!accessToken) return res.status(500).json({ error: "Auth failed" });

  try {
    const imeis = ["862798051314033", "862798051314108"];
    const response = await axios.post(
      "https://open.10086cloud.com/api/location/list",
      { imeiList: imeis },
      { headers: { accessToken } }
    );

    const locations = response.data.data.map(dev => ({
      imei: dev.imei,
      lat: dev.latitude,
      lng: dev.longitude,
      time: dev.gpsTime,
    }));

    res.json(locations);
  } catch (err) {
    if (err.response?.data?.code === 401) {
      accessToken = null;
      return res.redirect("/locations");
    }
    console.error("Location error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
