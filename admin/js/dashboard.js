/**
 * Main application entry point for the dashboard
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard initialized")

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("preview-modal")
    if (event.target === modal) {
      modal.style.display = "none"
    }
  })

  // Check if modules are already initialized
  if (window.AdminState) {
    console.log("Using AdminState for initialization coordination")
  } else {
    console.warn("AdminState not available, modules will initialize independently")
  }
})
