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
    : "http://127.0.0.1:5501/admin/callback.html"

  // Storage keys
  const TOKEN_KEY = "github_token"
  const USER_KEY = "github_user"

  /**
   * Initialize authentication
   */
  function init() {
    console.log("Auth module initializing...")

    // Check if we're on the callback page
    const hash = window.location.hash
    if (hash && hash.includes("access_token")) {
      handleCallback()
    }

    // Set up event listeners
    const loginBtn = document.getElementById("login-btn")
    const loginScreenBtn = document.getElementById("login-screen-btn")
    const logoutBtn = document.getElementById("logout-btn")

    if (loginBtn) {
      loginBtn.addEventListener("click", login)
    } else {
      console.error("Login button not found")
    }

    if (loginScreenBtn) {
      loginScreenBtn.addEventListener("click", login)
    } else {
      console.error("Login screen button not found")
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout)
    } else {
      console.error("Logout button not found")
    }

    // Check if user is already logged in
    checkAuth()

    console.log("Auth module initialized")
  }

  /**
   * Redirect to GitHub for authentication
   */
  function login() {
    const scope = "repo" // Permissions needed
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`
    window.location.href = authUrl
  }

  /**
   * Handle the OAuth callback
   */
  function handleCallback() {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const token = params.get("access_token")
    const code = params.get("code")

    if (token) {
      // Store the token
      localStorage.setItem(TOKEN_KEY, token)

      // Get user info
      fetchUserInfo(token)
        .then((user) => {
          localStorage.setItem(USER_KEY, JSON.stringify(user))
          window.location.href = "/admin/dashboard.html" // Redirect to dashboard instead of index
        })
        .catch((error) => {
          console.error("Error fetching user info:", error)
          showError("Failed to get user information")
        })
    } else if (code) {
      // If we have a code but no token, redirect to our API route
      window.location.href = `/api/auth?code=${code}`
    } else {
      showError("Authentication failed")
    }
  }

  /**
   * Fetch user information from GitHub API
   */
  async function fetchUserInfo(token) {
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
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null")

    if (token && user) {
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

      // Initialize the editor
      if (window.Editor && typeof window.Editor.init === "function") {
        window.Editor.init()
      } else {
        console.error("Editor module not found or init method not available")
      }
    } else {
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
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    checkAuth()
  }

  /**
   * Show error message
   */
  function showError(message) {
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
