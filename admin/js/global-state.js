/**
 * Global state management for the admin panel
 * This helps coordinate initialization between modules
 */
window.AdminState = {
  // Initialization flags
  isAuthInitialized: false,
  isEditorInitialized: false,

  // Callbacks to run when both modules are initialized
  readyCallbacks: [],

  // Register a module as initialized
  setInitialized: function (module) {
    console.log(`Module ${module} marked as initialized`)

    if (module === "auth") {
      this.isAuthInitialized = true
    } else if (module === "editor") {
      this.isEditorInitialized = true
    }

    // Check if all required modules are initialized
    if (this.isAuthInitialized && this.isEditorInitialized) {
      console.log("All modules initialized, running callbacks")
      this.runReadyCallbacks()
    }
  },

  // Add a callback to run when all modules are initialized
  onReady: function (callback) {
    if (typeof callback !== "function") {
      console.error("onReady requires a function callback")
      return
    }

    // If already initialized, run immediately
    if (this.isAuthInitialized && this.isEditorInitialized) {
      console.log("All modules already initialized, running callback immediately")
      callback()
    } else {
      // Otherwise, queue for later
      this.readyCallbacks.push(callback)
    }
  },

  // Run all registered callbacks
  runReadyCallbacks: function () {
    while (this.readyCallbacks.length > 0) {
      const callback = this.readyCallbacks.shift()
      try {
        callback()
      } catch (error) {
        console.error("Error in ready callback:", error)
      }
    }
  },
}
