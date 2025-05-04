document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginScreen = document.getElementById("login-screen")
  const adminDashboard = document.getElementById("admin-dashboard")
  const githubLoginBtn = document.getElementById("github-login")
  const logoutBtn = document.getElementById("logout-btn")
  const userName = document.getElementById("user-name")
  const loginError = document.getElementById("login-error")
  const sectionList = document.getElementById("section-list")
  const currentSectionTitle = document.getElementById("current-section-title")
  const editorFields = document.getElementById("editor-fields")
  const editorLoading = document.getElementById("editor-loading")
  const editorContent = document.getElementById("editor-content")
  const saveSectionBtn = document.getElementById("save-section-btn")
  const saveAllBtn = document.getElementById("save-all-btn")
  const previewBtn = document.getElementById("preview-btn")
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")

  // State
  let accessToken = localStorage.getItem("github_access_token")
  let userData = JSON.parse(localStorage.getItem("github_user_data") || "{}")
  let websiteContent = null
  let originalContent = null
  let currentSection = null
  const editableContent = {}
  const contentSections = [
    { id: "hero", title: "Hero Section", selector: "#home" },
    { id: "services", title: "Services Section", selector: "#services" },
    { id: "this-and-that", title: "This & That Section", selector: ".this-and-that" },
    { id: "portfolio", title: "Portfolio Section", selector: "#portfolio" },
    { id: "testimonial", title: "Testimonial Section", selector: ".testimonial" },
    { id: "stats", title: "Stats Section", selector: "#stats" },
    { id: "contact", title: "Contact Section", selector: "#contact" },
    { id: "footer", title: "Footer Section", selector: "footer" },
  ]

  // Configuration - Replace with your own values
  const config = {
    clientId: "YOUR_GITHUB_CLIENT_ID",
    clientSecret: "YOUR_GITHUB_CLIENT_SECRET",
    redirectUri: window.location.origin, // Or your specific redirect URI
    scope: "repo", // Adjust scopes as needed
    owner: "YOUR_GITHUB_USERNAME",
    repo: "YOUR_GITHUB_REPO_NAME",
    contentFile: "index.html", // Or the name of your content file
    mainBranch: "main", // Or your main branch name
  }

  // Check if we're returning from GitHub OAuth
  function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")

    if (code) {
      // For local development, we'll use a different approach since we can't make server-side requests
      // Store the code in localStorage and show a message to the user
      localStorage.setItem("github_auth_code", code)

      // Create a basic token exchange function that works client-side for demo purposes
      // Note: In production, this should be done server-side
      exchangeCodeForToken(code)
        .then((token) => {
          if (token) {
            accessToken = token
            localStorage.setItem("github_access_token", accessToken)

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)

            // Get user data
            fetchUserData()
          } else {
            showLoginError("Failed to authenticate with GitHub.")
          }
        })
        .catch((error) => {
          console.error("Authentication error:", error)
          showLoginError("Authentication error. Please try again.")
        })
    }
  }

  // Add this new function to handle token exchange
  async function exchangeCodeForToken(code) {
    // This is a client-side workaround - in production, use a server endpoint
    // Using a CORS proxy to make the request
    try {
      const tokenUrl = `https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token`
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
        }),
      })

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error("Error exchanging code for token:", error)
      // Fallback for demo purposes - in production, never do this
      showLoginError("GitHub token exchange failed. For demo purposes, please enter a personal access token:")

      // Create a simple input for demo purposes
      const tokenInput = document.createElement("input")
      tokenInput.type = "text"
      tokenInput.placeholder = "Paste your GitHub personal access token"
      tokenInput.style.width = "100%"
      tokenInput.style.marginTop = "10px"
      tokenInput.style.padding = "8px"

      const submitButton = document.createElement("button")
      submitButton.textContent = "Use Token"
      submitButton.style.marginTop = "10px"
      submitButton.style.padding = "8px 16px"

      submitButton.addEventListener("click", () => {
        const token = tokenInput.value.trim()
        if (token) {
          accessToken = token
          localStorage.setItem("github_access_token", accessToken)
          fetchUserData()
        }
      })

      loginError.innerHTML = ""
      loginError.appendChild(
        document.createTextNode(
          "GitHub token exchange failed. For demo purposes, please enter a personal access token:",
        ),
      )
      loginError.appendChild(document.createElement("br"))
      loginError.appendChild(tokenInput)
      loginError.appendChild(document.createElement("br"))
      loginError.appendChild(submitButton)

      return null
    }
  }

  // Fetch user data from GitHub
  function fetchUserData() {
    if (!accessToken) return

    fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        return response.json()
      })
      .then((data) => {
        userData = data
        localStorage.setItem("github_user_data", JSON.stringify(userData))
        showAdminDashboard()
      })
      .catch((error) => {
        console.error("Error fetching user data:", error)
        logout()
        showLoginError("Failed to fetch user data. Please try again.")
      })
  }

  // Show login error
  function showLoginError(message) {
    loginError.textContent = message
    loginError.style.display = "block"
  }

  // Show admin dashboard
  function showAdminDashboard() {
    if (userData && userData.login) {
      userName.textContent = userData.name || userData.login
      loginScreen.classList.add("hidden")
      adminDashboard.classList.remove("hidden")

      // Load website content
      loadWebsiteContent()

      // Populate section list
      populateSectionList()
    } else {
      logout()
    }
  }

  // Load website content from GitHub
  function loadWebsiteContent() {
    editorLoading.classList.remove("hidden")
    editorContent.classList.add("hidden")

    // Fetch the index.html file from GitHub
    fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.contentFile}?ref=${config.mainBranch}`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3.raw",
        },
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch website content")
        }
        return response.text()
      })
      .then((content) => {
        websiteContent = content
        originalContent = content
        parseEditableContent()
      })
      .catch((error) => {
        console.error("Error loading website content:", error)
        showNotification("Failed to load website content. Please try again.", "error")
      })
  }

  // Parse editable content from HTML
  function parseEditableContent() {
    // Create a temporary DOM parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(websiteContent, "text/html")

    // Extract editable content for each section
    contentSections.forEach((section) => {
      const sectionElement = doc.querySelector(section.selector)
      if (sectionElement) {
        editableContent[section.id] = {
          texts: extractTextContent(sectionElement),
          images: extractImageContent(sectionElement),
          links: extractLinkContent(sectionElement),
        }
      }
    })

    // If a section is already selected, load it
    if (currentSection) {
      loadSectionEditor(currentSection)
    }
  }

  // Extract text content from a section
  function extractTextContent(element) {
    const texts = []

    // Get all text elements (headings, paragraphs, spans with text)
    const textElements = element.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, div.testimonial-text, div.testimonial-author",
    )

    textElements.forEach((el, index) => {
      // Skip empty elements or those that are part of other components
      if (el.textContent.trim() === "" || el.closest(".service-icon") || el.closest(".portfolio-overlay")) {
        return
      }

      // Skip elements that are containers for other text elements
      if (el.querySelector("h1, h2, h3, h4, h5, h6, p, span")) {
        return
      }

      texts.push({
        id: `text-${index}`,
        element: el.tagName.toLowerCase(),
        content: el.textContent.trim(),
        path: getElementPath(el),
      })
    })

    return texts
  }

  // Extract image content from a section
  function extractImageContent(element) {
    const images = []

    // Get all images
    const imageElements = element.querySelectorAll("img")

    imageElements.forEach((el, index) => {
      images.push({
        id: `image-${index}`,
        src: el.getAttribute("src"),
        alt: el.getAttribute("alt") || "",
        path: getElementPath(el),
      })
    })

    return images
  }

  // Extract link content from a section
  function extractLinkContent(element) {
    const links = []

    // Get all links
    const linkElements = element.querySelectorAll("a")

    linkElements.forEach((el, index) => {
      links.push({
        id: `link-${index}`,
        href: el.getAttribute("href"),
        text: el.textContent.trim(),
        path: getElementPath(el),
      })
    })

    return links
  }

  // Get a unique path to an element for later identification
  function getElementPath(el) {
    // This is a simplified version - in a real app, you'd want a more robust selector
    if (el.id) {
      return `#${el.id}`
    }

    let path = el.tagName.toLowerCase()
    if (el.className) {
      const classes = el.className.split(" ").filter((c) => c.trim() !== "")
      if (classes.length > 0) {
        path += `.${classes.join(".")}`
      }
    }

    // Add index if there are siblings of the same type
    const siblings = Array.from(el.parentNode.children).filter(
      (child) => child.tagName === el.tagName && child.className === el.className,
    )

    if (siblings.length > 1) {
      const index = siblings.indexOf(el)
      path += `:nth-of-type(${index + 1})`
    }

    return path
  }

  // Populate section list in sidebar
  function populateSectionList() {
    sectionList.innerHTML = ""

    contentSections.forEach((section) => {
      const li = document.createElement("li")
      li.textContent = section.title
      li.dataset.sectionId = section.id

      li.addEventListener("click", () => {
        // Remove active class from all items
        document.querySelectorAll(".section-list li").forEach((item) => {
          item.classList.remove("active")
        })

        // Add active class to clicked item
        li.classList.add("active")

        // Load section editor
        loadSectionEditor(section)
      })

      sectionList.appendChild(li)
    })
  }

  // Load section editor
  function loadSectionEditor(section) {
    currentSection = section
    currentSectionTitle.textContent = section.title

    editorLoading.classList.add("hidden")
    editorContent.classList.remove("hidden")

    // Clear existing fields
    editorFields.innerHTML = ""

    // Get section content
    const sectionContent = editableContent[section.id]
    if (!sectionContent) {
      editorFields.innerHTML = "<p>No editable content found in this section.</p>"
      return
    }

    // Add text fields
    if (sectionContent.texts && sectionContent.texts.length > 0) {
      const textFieldsContainer = document.createElement("div")
      textFieldsContainer.className = "editor-section"
      textFieldsContainer.innerHTML = "<h3>Text Content</h3>"

      sectionContent.texts.forEach((text) => {
        const fieldGroup = createTextField(text)
        textFieldsContainer.appendChild(fieldGroup)
      })

      editorFields.appendChild(textFieldsContainer)
    }

    // Add image fields
    if (sectionContent.images && sectionContent.images.length > 0) {
      const imageFieldsContainer = document.createElement("div")
      imageFieldsContainer.className = "editor-section"
      imageFieldsContainer.innerHTML = "<h3>Images</h3>"

      sectionContent.images.forEach((image) => {
        const fieldGroup = createImageField(image)
        imageFieldsContainer.appendChild(fieldGroup)
      })

      editorFields.appendChild(imageFieldsContainer)
    }

    // Add link fields
    if (sectionContent.links && sectionContent.links.length > 0) {
      const linkFieldsContainer = document.createElement("div")
      linkFieldsContainer.className = "editor-section"
      linkFieldsContainer.innerHTML = "<h3>Links</h3>"

      sectionContent.links.forEach((link) => {
        const fieldGroup = createLinkField(link)
        linkFieldsContainer.appendChild(fieldGroup)
      })

      editorFields.appendChild(linkFieldsContainer)
    }
  }

  // Create text field
  function createTextField(text) {
    const fieldGroup = document.createElement("div")
    fieldGroup.className = "field-group"

    const label = document.createElement("label")
    label.textContent = `${text.element.toUpperCase()} Text`
    fieldGroup.appendChild(label)

    const input = document.createElement("textarea")
    input.value = text.content
    input.dataset.id = text.id
    input.dataset.path = text.path
    input.dataset.type = "text"

    input.addEventListener("input", () => {
      // Update the content in the editableContent object
      const sectionContent = editableContent[currentSection.id]
      const textItem = sectionContent.texts.find((t) => t.id === text.id)
      if (textItem) {
        textItem.content = input.value
      }
    })

    fieldGroup.appendChild(input)
    return fieldGroup
  }

  // Create image field
  function createImageField(image) {
    const fieldGroup = document.createElement("div")
    fieldGroup.className = "field-group"

    const label = document.createElement("label")
    label.textContent = "Image URL"
    fieldGroup.appendChild(label)

    const input = document.createElement("input")
    input.type = "url"
    input.value = image.src
    input.dataset.id = image.id
    input.dataset.path = image.path
    input.dataset.type = "image-src"

    input.addEventListener("input", () => {
      // Update the content in the editableContent object
      const sectionContent = editableContent[currentSection.id]
      const imageItem = sectionContent.images.find((i) => i.id === image.id)
      if (imageItem) {
        imageItem.src = input.value
      }
    })

    fieldGroup.appendChild(input)

    // Alt text field
    const altLabel = document.createElement("label")
    altLabel.textContent = "Alt Text"
    fieldGroup.appendChild(altLabel)

    const altInput = document.createElement("input")
    altInput.type = "text"
    altInput.value = image.alt
    altInput.dataset.id = image.id
    altInput.dataset.path = image.path
    altInput.dataset.type = "image-alt"

    altInput.addEventListener("input", () => {
      // Update the content in the editableContent object
      const sectionContent = editableContent[currentSection.id]
      const imageItem = sectionContent.images.find((i) => i.id === image.id)
      if (imageItem) {
        imageItem.alt = altInput.value
      }
    })

    fieldGroup.appendChild(altInput)

    // Image preview
    const preview = document.createElement("div")
    preview.className = "image-preview"
    const previewImg = document.createElement("img")
    previewImg.src = image.src
    previewImg.alt = image.alt
    preview.appendChild(previewImg)
    fieldGroup.appendChild(preview)

    // Update preview when URL changes
    input.addEventListener("change", () => {
      previewImg.src = input.value
    })

    return fieldGroup
  }

  // Create link field
  function createLinkField(link) {
    const fieldGroup = document.createElement("div")
    fieldGroup.className = "field-group"

    // URL field
    const urlLabel = document.createElement("label")
    urlLabel.textContent = "Link URL"
    fieldGroup.appendChild(urlLabel)

    const urlInput = document.createElement("input")
    urlInput.type = "url"
    urlInput.value = link.href
    urlInput.dataset.id = link.id
    urlInput.dataset.path = link.path
    urlInput.dataset.type = "link-href"

    urlInput.addEventListener("input", () => {
      // Update the content in the editableContent object
      const sectionContent = editableContent[currentSection.id]
      const linkItem = sectionContent.links.find((l) => l.id === link.id)
      if (linkItem) {
        linkItem.href = urlInput.value
      }
    })

    fieldGroup.appendChild(urlInput)

    // Text field
    const textLabel = document.createElement("label")
    textLabel.textContent = "Link Text"
    fieldGroup.appendChild(textLabel)

    const textInput = document.createElement("input")
    textInput.type = "text"
    textInput.value = link.text
    textInput.dataset.id = link.id
    textInput.dataset.path = link.path
    textInput.dataset.type = "link-text"

    textInput.addEventListener("input", () => {
      // Update the content in the editableContent object
      const sectionContent = editableContent[currentSection.id]
      const linkItem = sectionContent.links.find((l) => l.id === link.id)
      if (linkItem) {
        linkItem.text = textInput.value
      }
    })

    fieldGroup.appendChild(textInput)

    return fieldGroup
  }

  // Apply changes to HTML content
  function applyChangesToHTML() {
    // Create a temporary DOM parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(websiteContent, "text/html")

    // Apply changes for each section
    Object.keys(editableContent).forEach((sectionId) => {
      const section = contentSections.find((s) => s.id === sectionId)
      if (!section) return

      const sectionElement = doc.querySelector(section.selector)
      if (!sectionElement) return

      const sectionContent = editableContent[sectionId]

      // Update text content
      if (sectionContent.texts) {
        sectionContent.texts.forEach((text) => {
          try {
            const element = sectionElement.querySelector(text.path)
            if (element) {
              element.textContent = text.content
            }
          } catch (error) {
            console.error(`Error updating text ${text.id}:`, error)
          }
        })
      }

      // Update images
      if (sectionContent.images) {
        sectionContent.images.forEach((image) => {
          try {
            const element = sectionElement.querySelector(image.path)
            if (element) {
              element.setAttribute("src", image.src)
              element.setAttribute("alt", image.alt)
            }
          } catch (error) {
            console.error(`Error updating image ${image.id}:`, error)
          }
        })
      }

      // Update links
      if (sectionContent.links) {
        sectionContent.links.forEach((link) => {
          try {
            const element = sectionElement.querySelector(link.path)
            if (element) {
              element.setAttribute("href", link.href)
              element.textContent = link.text
            }
          } catch (error) {
            console.error(`Error updating link ${link.id}:`, error)
          }
        })
      }
    })

    // Convert back to string
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML
  }

  // Save changes to GitHub
  function saveChangesToGitHub() {
    const updatedContent = applyChangesToHTML()

    // First, get the current file to get its SHA
    fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.contentFile}`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Now update the file with the new content
        return fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.contentFile}`, {
          method: "PUT",
          headers: {
            Authorization: `token ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Update website content via admin panel",
            content: btoa(unescape(encodeURIComponent(updatedContent))),
            sha: data.sha,
            branch: config.mainBranch,
          }),
        })
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save changes")
        }
        return response.json()
      })
      .then(() => {
        websiteContent = updatedContent
        showNotification("Changes saved successfully!")
      })
      .catch((error) => {
        console.error("Error saving changes:", error)
        showNotification("Failed to save changes. Please try again.", "error")
      })
  }

  // Show notification
  function showNotification(message, type = "success") {
    notificationMessage.textContent = message
    notification.className = "notification"

    if (type === "error") {
      notification.classList.add("error")
    } else if (type === "warning") {
      notification.classList.add("warning")
    }

    notification.classList.add("show")

    setTimeout(() => {
      notification.classList.remove("show")
    }, 3000)
  }

  // Logout function
  function logout() {
    localStorage.removeItem("github_access_token")
    localStorage.removeItem("github_user_data")
    accessToken = null
    userData = {}
    adminDashboard.classList.add("hidden")
    loginScreen.classList.remove("hidden")
  }

  // Event Listeners
  githubLoginBtn.addEventListener("click", () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scope}`
  })

  logoutBtn.addEventListener("click", logout)

  saveSectionBtn.addEventListener("click", () => {
    saveChangesToGitHub()
  })

  saveAllBtn.addEventListener("click", () => {
    saveChangesToGitHub()
  })

  previewBtn.addEventListener("click", () => {
    // Open the main site in a new tab
    window.open("/", "_blank")
  })

  // Initialize
  if (accessToken && userData.login) {
    showAdminDashboard()
  } else {
    handleAuthCallback()
  }
})
