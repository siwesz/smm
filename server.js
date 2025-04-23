const express = require("express")
const fetch = require("node-fetch")
const path = require("path")
const fs = require("fs")
const app = express()

// GitHub OAuth credentials
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Ov23liO4HGDGaOohco1M"
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "a11339943f24ac63c2719d9acd1074ecda1b0043"

// Serve static files
app.use(express.static("./"))

// Block requests for config.yml to prevent Decap CMS errors
app.get("/admin/config.yml", (req, res) => {
  res.status(404).send("Not using Decap CMS anymore")
})

// OAuth callback endpoint
app.get("/api/auth", async (req, res) => {
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

    if (tokenData.error) {
      return res.status(400).send(`Error: ${tokenData.error_description || "Failed to exchange code for token"}`)
    }

    // Redirect back to the admin panel with the access token
    res.redirect(`/admin/callback.html#access_token=${tokenData.access_token}`)
  } catch (error) {
    console.error("Error during GitHub OAuth:", error)
    res.status(500).send("Authentication failed")
  }
})

// Handle all other routes for SPA
app.get("*", (req, res) => {
  // Check if the request is for admin/index.html and redirect to dashboard.html
  if (req.path === "/admin/index.html" || req.path === "/admin/") {
    return res.redirect("/admin/dashboard.html")
  }

  res.sendFile(path.resolve(__dirname, "index.html"))
})

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5501
  app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`)
  })
}

// For Vercel
module.exports = app
