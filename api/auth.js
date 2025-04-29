const fetch = require("node-fetch")

// GitHub OAuth credentials
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Ov23liO4HGDGaOohco1M"
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "a11339943f24ac63c2719d9acd1074ecda1b0043"

export default async function handler(req, res) {
  // Get the authorization code from the query parameters
  const { code } = req.query

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" })
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
      return res.status(400).json({ error: tokenData.error_description || "Failed to exchange code for token" })
    }

    // Redirect back to the admin panel with the access token
    res.redirect(`/admin/callback.html#access_token=${tokenData.access_token}`)
  } catch (error) {
    console.error("Error during GitHub OAuth:", error)
    res.status(500).json({ error: "Authentication failed" })
  }
}
