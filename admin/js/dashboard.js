/**
 * Main application entry point for the dashboard
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard initialized")

  // Initialize authentication
  if (window.Auth && typeof window.Auth.init === "function") {
    window.Auth.init()
    console.log("Auth initialized successfully")
  } else {
    console.error("Auth module not found or init method not available")
    // Try to load auth.js again if it failed
    const authScript = document.createElement("script")
    authScript.src = "./js/auth.js"
    authScript.onload = () => {
      console.log("Auth script loaded manually")
      if (window.Auth && typeof window.Auth.init === "function") {
        window.Auth.init()
      }
    }
    document.body.appendChild(authScript)
  }

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("preview-modal")
    if (event.target === modal) {
      modal.style.display = "none"
    }
  })
})
