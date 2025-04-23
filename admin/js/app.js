/**
 * Main application entry point
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized - checking for any Decap CMS references")

  // Check if window.CMS exists (would indicate Decap CMS is still loaded)
  if (window.CMS) {
    console.error("Decap CMS is still loaded! This might be causing the config.yml error")
  }

  // Check for any script tags loading Decap CMS
  document.querySelectorAll("script").forEach((script) => {
    if (script.src && script.src.includes("decap-cms")) {
      console.error("Found Decap CMS script:", script.src)
    }
  })

  // Initialize authentication
  if (window.Auth && typeof window.Auth.init === "function") {
    window.Auth.init()
    console.log("Auth initialized")
  } else {
    console.error("Auth module not found or init method not available")
  }

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("preview-modal")
    if (event.target === modal) {
      modal.style.display = "none"
    }
  })
})
