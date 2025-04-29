// This file is a simple API handler for local development
const express = require("express")
const fetch = require("node-fetch")
const app = express()

// GitHub OAuth credentials
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Ov23liO4HGDGaOohco1M"
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "a11339943f24ac63c2719d9acd1074ecda1b0043"

// Enable CORS for local development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

// OAuth callback endpoint
app.get("/auth", async (req, res) => {
  console.log("API auth route hit with code:", req.query.code)
  const { code } = req.query

  if (!code) {
    return res.status(400).send("Authorization code is required")
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log("Token response received:", tokenData.access_token ? "Token received" : "No token received")

    if (tokenData.error) {
      console.error("Token error:", tokenData.error_description || tokenData.error)
      return res.status(400).send(`Error: ${tokenData.error_description || "Failed to exchange code for token"}`)
    }

    // Redirect back to the admin panel with the access token
    res.redirect(`http://127.0.0.1:5501/admin/callback.html#access_token=${tokenData.access_token}`)
  } catch (error) {
    console.error("Error during GitHub OAuth:", error)
    res.status(500).send("Authentication failed")
  }
})

// Start the server
const PORT = process.env.API_PORT || 3000
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log(`Auth endpoint available at http://localhost:${PORT}/auth`)
})
