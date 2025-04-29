/**
 * Authentication module for GitHub OAuth
 */
const Auth = (() => {
  // Determine if we're in production or development
  const isProduction =
    !window.location.hostname.includes("127.0.0.1") && !window.location.hostname.includes("localhost")

  // GitHub OAuth App credentials
  const CLIENT_ID = "Ov23liO4HGDGaOohco1M" // Your GitHub OAuth App client ID

  // Set the redirect URI based on environment
  const REDIRECT_URI = isProduction
    ? `${window.location.origin}/admin/callback.html`
    : `${window.location.protocol}//${window.location.host}/admin/callback.html`

  // Storage keys
  const TOKEN_KEY = "github_token"
  const USER_KEY = "github_user"

  // Authentication state
  let isInitialized = false

  /**
   * Initialize authentication
   */
  function init() {
    console.log("Auth module initializing...")

    // Mark as initialized first to prevent circular dependencies
    isInitialized = true

    // Register with global state
    if (window.AdminState) {
      window.AdminState.setInitialized("auth")
    }

    console.log("Environment:", isProduction ? "Production" : "Development")
    console.log("Redirect URI:", REDIRECT_URI)

    // Check if we're on the callback page
    const hash = window.location.hash
    if (hash && hash.includes("access_token")) {
      console.log("Found access_token in hash, handling callback")
      handleCallback()
      return
    }

    // Check if we have a code parameter
    const code = new URLSearchParams(window.location.search).get("code")
    if (code) {
      console.log("Found code parameter:", code)

      // For local development, use the standalone API server
      const apiUrl = isProduction ? `/api/auth?code=${code}` : `http://localhost:3000/auth?code=${code}`

      console.log("Redirecting to API:", apiUrl)
      window.location.href = apiUrl
      return
    }

    // Set up event listeners
    const loginBtn = document.getElementById("login-btn")
    const loginScreenBtn = document.getElementById("login-screen-btn")
    const logoutBtn = document.getElementById("logout-btn")

    if (loginBtn) {
      loginBtn.addEventListener("click", login)
    } else {
      console.warn("Login button not found")
    }

    if (loginScreenBtn) {
      loginScreenBtn.addEventListener("click", login)
    } else {
      console.warn("Login screen button not found")
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout)
    } else {
      console.warn("Logout button not found")
    }

    // Check if user is already logged in
    checkAuth()

    console.log("Auth module initialized")
  }

  /**
   * Redirect to GitHub for authentication
   */
  function login() {
    console.log("Initiating login...")
    const scope = "repo" // Permissions needed
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`
    console.log("Auth URL:", authUrl)
    window.location.href = authUrl
  }

  /**
   * Handle the OAuth callback
   */
  function handleCallback() {
    console.log("Handling callback...")
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const token = params.get("access_token")
    const code = new URLSearchParams(window.location.search).get("code")

    if (token) {
      console.log("Token found, storing and fetching user info")
      // Store the token
      localStorage.setItem(TOKEN_KEY, token)

      // Get user info
      fetchUserInfo(token)
        .then((user) => {
          console.log("User info received:", user.login)
          localStorage.setItem(USER_KEY, JSON.stringify(user))
          window.location.href = "/admin/dashboard.html" // Redirect to dashboard
        })
        .catch((error) => {
          console.error("Error fetching user info:", error)
          showError("Failed to get user information")
        })
    } else if (code) {
      // If we have a code but no token, redirect to our API route
      console.log("Code found, redirecting to API:", code)

      // For local development, use the standalone API server
      const apiUrl = isProduction ? `/api/auth?code=${code}` : `http://localhost:3000/auth?code=${code}`

      console.log("API URL:", apiUrl)
      window.location.href = apiUrl
    } else {
      console.error("No token or code found")
      showError("Authentication failed")
    }
  }

  /**
   * Fetch user information from GitHub API
   */
  async function fetchUserInfo(token) {
    console.log("Fetching user info...")
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user info")
    }

    return response.json()
  }

  /**
   * Check if user is authenticated
   */
  function checkAuth() {
    console.log("Checking authentication...")
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null")

    if (token && user) {
      console.log("User is authenticated:", user.login)
      // User is logged in
      const usernameEl = document.getElementById("username")
      const loginBtn = document.getElementById("login-btn")
      const logoutBtn = document.getElementById("logout-btn")
      const loginScreen = document.getElementById("login-screen")
      const editorContainer = document.getElementById("editor-container")

      if (usernameEl) usernameEl.textContent = user.login
      if (loginBtn) loginBtn.style.display = "none"
      if (logoutBtn) logoutBtn.style.display = "inline-block"
      if (loginScreen) loginScreen.style.display = "none"
      if (editorContainer) editorContainer.style.display = "flex"

      // Use the global state to coordinate initialization
      if (window.AdminState) {
        window.AdminState.onReady(() => {
          console.log("All modules ready, initializing editor content")
          if (window.Editor && typeof window.Editor.loadContent === "function") {
            window.Editor.loadContent()
          }
        })
      } else {
        // Fallback if global state is not available
        console.warn("AdminState not available, using fallback initialization")
        setTimeout(() => {
          if (window.Editor && typeof window.Editor.loadContent === "function") {
            console.log("Initializing editor content with fallback method")
            window.Editor.loadContent()
          } else {
            console.error("Editor module not found or loadContent method not available")
          }
        }, 1000)
      }
    } else {
      console.log("User is not authenticated")
      // User is not logged in
      const usernameEl = document.getElementById("username")
      const loginBtn = document.getElementById("login-btn")
      const logoutBtn = document.getElementById("logout-btn")
      const loginScreen = document.getElementById("login-screen")
      const editorContainer = document.getElementById("editor-container")

      if (usernameEl) usernameEl.textContent = "Not logged in"
      if (loginBtn) loginBtn.style.display = "inline-block"
      if (logoutBtn) logoutBtn.style.display = "none"
      if (loginScreen) loginScreen.style.display = "flex"
      if (editorContainer) editorContainer.style.display = "none"
    }
  }

  /**
   * Log out the user
   */
  function logout() {
    console.log("Logging out...")
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    checkAuth()
  }

  /**
   * Show error message
   */
  function showError(message) {
    console.error("Error:", message)
    const notification = document.getElementById("notification")
    const notificationMessage = document.getElementById("notification-message")

    if (notification && notificationMessage) {
      notificationMessage.textContent = message
      notification.classList.add("show", "error")

      setTimeout(() => {
        notification.classList.remove("show")
      }, 5000)
    } else {
      console.error("Notification elements not found")
      alert(message) // Fallback to alert if notification elements not found
    }
  }

  /**
   * Get the authentication token
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY)
  }

  /**
   * Get the current user
   */
  function getUser() {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null")
  }

  /**
   * Check if user is authenticated
   */
  function isAuthenticated() {
    return !!getToken() && !!getUser()
  }

  // Public API
  return {
    init,
    login,
    logout,
    getToken,
    getUser,
    isAuthenticated,
    isInitialized: () => isInitialized,
  }
})()

// Make Auth available globally
window.Auth = Auth

// Auto-initialize if this script is loaded after DOM is ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  console.log("Auth script loaded, DOM is ready")
  setTimeout(() => {
    if (Auth && typeof Auth.init === "function") {
      Auth.init()
    }
  }, 100)
} else {
  console.log("Auth script loaded, waiting for DOM")
  document.addEventListener("DOMContentLoaded", () => {
    if (Auth && typeof Auth.init === "function") {
      Auth.init()
    }
  })
}
