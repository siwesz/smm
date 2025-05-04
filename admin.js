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
    { id: "header", title: "Header", selector: "header" },
    { id: "hero", title: "Hero Section", selector: "#home" },
    { id: "services", title: "Services Section", selector: "#services" },
    { id: "this-and-that", title: "This & That Section", selector: ".this-and-that" },
    { id: "portfolio", title: "Portfolio Section", selector: "#portfolio" },
    { id: "testimonial", title: "Testimonial Section", selector: ".testimonial" },
    { id: "stats", title: "Stats Section", selector: "#stats" },
    { id: "contact", title: "Contact Section", selector: "#contact" },
    { id: "footer", title: "Footer Section", selector: "footer" },
  ]

  // Configuration with your actual GitHub details
  const config = {
    clientId: "Ov23liO4HGDGaOohco1M",
    clientSecret: "a11339943f24ac63c2719d9acd1074ecda1b0043",
    redirectUri: "http://127.0.0.1:5501/auth-callback.html",
    scope: "repo",
    owner: "siwesz",
    repo: "smm",
    contentFile: "index.html",
    mainBranch: "main",
    imagesFolder: "images", // Folder where uploaded images will be stored
  }

  // Declare these variables to avoid errors
  let addNewTextElement
  let addNewImage
  let addNewLink
  let applyNewElementsToHTML

  // Check if we're returning from GitHub OAuth
  function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")

    // Check if we have a token in localStorage (from manual entry)
    const token = localStorage.getItem("github_access_token")

    if (token) {
      accessToken = token
      fetchUserData()
      return
    }

    if (code) {
      // Redirect to auth-callback.html to handle the token exchange
      window.location.href = `auth-callback.html?code=${code}`
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

    // Show loading message
    const loadingMessage = document.createElement("p")
    loadingMessage.textContent = "Fetching content from GitHub..."
    editorLoading.appendChild(loadingMessage)

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
          throw new Error(`Failed to fetch website content: ${response.status} ${response.statusText}`)
        }
        loadingMessage.textContent = "Content retrieved, parsing elements..."
        return response.text()
      })
      .then((content) => {
        websiteContent = content
        originalContent = content

        try {
          parseEditableContent()
          loadingMessage.textContent = "Content parsed successfully!"

          // Select the first section by default
          if (contentSections.length > 0) {
            const firstSection = contentSections[0]
            const firstSectionItem = document.querySelector(`.section-list li[data-section-id="${firstSection.id}"]`)
            if (firstSectionItem) {
              firstSectionItem.click()
            }
          }
        } catch (error) {
          console.error("Error parsing content:", error)
          loadingMessage.textContent = `Error parsing content: ${error.message}`
          showNotification("Error parsing content. Check console for details.", "error")
        }
      })
      .catch((error) => {
        console.error("Error loading website content:", error)
        loadingMessage.textContent = `Error: ${error.message}`
        showNotification(
          "Failed to load website content. Please check your GitHub token and repository details.",
          "error",
        )
      })
  }

  // Parse editable content from HTML
  function parseEditableContent() {
    // Create a temporary DOM parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(websiteContent, "text/html")

    // Extract editable content for each section
    contentSections.forEach((section) => {
      try {
        const sectionElement = doc.querySelector(section.selector)
        if (sectionElement) {
          editableContent[section.id] = {
            texts: extractTextContent(sectionElement),
            images: extractImageContent(sectionElement),
            links: extractLinkContent(sectionElement),
          }
          console.log(`Parsed section ${section.id}:`, editableContent[section.id])
        } else {
          console.warn(`Section element not found for selector: ${section.selector}`)
        }
      } catch (error) {
        console.error(`Error parsing section ${section.id}:`, error)
      }
    })
  }

  // Extract text content from a section
  function extractTextContent(element) {
    const texts = []
    const processedElements = new Set() // Keep track of elements we've already processed

    // First, handle special elements like logo-text that have mixed content
    const logoElements = element.querySelectorAll(".logo-text, .footer-logo h2")
    logoElements.forEach((el, index) => {
      // Skip if already processed
      if (processedElements.has(el)) return

      // For logo text, we need to handle the "Social" and "Spark" parts separately
      if (el.childNodes.length > 0) {
        // Find the text nodes and element nodes
        const childNodes = Array.from(el.childNodes)
        let mainText = ""
        let spanText = ""

        // Extract the main text and span text
        childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            mainText += node.textContent.trim()
          } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
            spanText = node.textContent.trim()
          }
        })

        // Add the main part (usually "Social")
        if (mainText) {
          texts.push({
            id: `text-logo-main-${index}`,
            element: el.tagName.toLowerCase(),
            content: mainText,
            path: getElementPath(el),
            part: "main",
            originalElement: el.outerHTML,
          })
        }

        // Add the span part (usually "Spark")
        if (spanText) {
          texts.push({
            id: `text-logo-span-${index}`,
            element: "span",
            content: spanText,
            path: getElementPath(el) + " span",
            part: "span",
            originalElement: el.outerHTML,
          })
        }

        // Mark as processed
        processedElements.add(el)
        el.querySelectorAll("*").forEach((child) => {
          processedElements.add(child)
        })
      }
    })

    // Now handle all other text elements
    const textElements = element.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, div, li, a, label, button, figcaption, blockquote, cite, strong, em, small, time, address",
    )

    textElements.forEach((el, index) => {
      // Skip if already processed
      if (processedElements.has(el)) return

      // Skip empty elements
      if (el.textContent.trim() === "") return

      // Skip elements that are containers for other text elements we're already capturing
      if (
        el.querySelector("h1, h2, h3, h4, h5, h6, p, span, a, strong, em, small") &&
        !el.classList.contains("testimonial-text") &&
        !el.classList.contains("testimonial-author")
      ) {
        return
      }

      // Skip elements that are part of form controls or interactive elements
      if (el.tagName === "BUTTON" || el.tagName === "LABEL" || el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        return
      }

      // Skip service icons and portfolio overlays
      if (el.closest(".service-icon") || el.closest(".portfolio-overlay") || el.closest(".social-icon")) {
        return
      }

      // Skip if this is a link and we're already capturing links separately
      if (el.tagName === "A" && el.textContent.trim() !== el.innerHTML.trim()) {
        return
      }

      // Add the text element to our collection
      texts.push({
        id: `text-${index}`,
        element: el.tagName.toLowerCase(),
        content: el.textContent.trim(),
        path: getElementPath(el),
      })

      processedElements.add(el)
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
    // If element has an ID, use that
    if (el.id) {
      return `#${el.id}`
    }

    // Try to create a unique path based on classes and position
    let path = el.tagName.toLowerCase()

    // Add classes if present
    if (el.className) {
      const classes = el.className
        .split(" ")
        .filter((c) => c.trim() !== "" && !c.includes(":"))
        .map((c) => c.trim())

      if (classes.length > 0) {
        path += `.${classes.join(".")}`
      }
    }

    // If there are siblings of the same type, add nth-child
    const parent = el.parentNode
    if (parent) {
      const siblings = Array.from(parent.children).filter((child) => child.tagName === el.tagName)

      if (siblings.length > 1) {
        const index = siblings.indexOf(el)
        path += `:nth-child(${index + 1})`
      }
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
    const textFieldsContainer = document.createElement("div")
    textFieldsContainer.className = "editor-section"
    textFieldsContainer.innerHTML = "<h3>Text Content</h3>"

    if (sectionContent.texts && sectionContent.texts.length > 0) {
      sectionContent.texts.forEach((text) => {
        const fieldGroup = createTextField(text)
        textFieldsContainer.appendChild(fieldGroup)
      })
    } else {
      textFieldsContainer.innerHTML += "<p>No text content found in this section.</p>"
    }

    // Add "Add New Text" button
    const addTextBtn = document.createElement("button")
    addTextBtn.className = "btn-secondary"
    addTextBtn.textContent = "Add New Text"
    addTextBtn.addEventListener("click", () => {
      // Load the admin-add-content.js script if not already loaded
      if (typeof addNewTextElement !== "function") {
        const script = document.createElement("script")
        script.src = "admin-add-content.js"
        document.head.appendChild(script)
        script.onload = () => {
          if (typeof addNewTextElement === "function") {
            addNewTextElement(section.id)
          } else {
            console.error("addNewTextElement is not a function after script load")
          }
        }
      } else {
        addNewTextElement(section.id)
      }
    })
    textFieldsContainer.appendChild(addTextBtn)
    editorFields.appendChild(textFieldsContainer)

    // Add image fields
    const imageFieldsContainer = document.createElement("div")
    imageFieldsContainer.className = "editor-section"
    imageFieldsContainer.innerHTML = "<h3>Images</h3>"

    if (sectionContent.images && sectionContent.images.length > 0) {
      sectionContent.images.forEach((image) => {
        const fieldGroup = createImageField(image)
        imageFieldsContainer.appendChild(fieldGroup)
      })
    } else {
      imageFieldsContainer.innerHTML += "<p>No images found in this section.</p>"
    }

    // Add "Add New Image" button
    const addImageBtn = document.createElement("button")
    addImageBtn.className = "btn-secondary"
    addImageBtn.textContent = "Add New Image"
    addImageBtn.addEventListener("click", () => {
      // Load the admin-add-content.js script if not already loaded
      if (typeof addNewImage !== "function") {
        const script = document.createElement("script")
        script.src = "admin-add-content.js"
        document.head.appendChild(script)
        script.onload = () => {
          if (typeof addNewImage === "function") {
            addNewImage(section.id)
          } else {
            console.error("addNewImage is not a function after script load")
          }
        }
      } else {
        addNewImage(section.id)
      }
    })
    imageFieldsContainer.appendChild(addImageBtn)
    editorFields.appendChild(imageFieldsContainer)

    // Add link fields
    const linkFieldsContainer = document.createElement("div")
    linkFieldsContainer.className = "editor-section"
    linkFieldsContainer.innerHTML = "<h3>Links</h3>"

    if (sectionContent.links && sectionContent.links.length > 0) {
      sectionContent.links.forEach((link) => {
        const fieldGroup = createLinkField(link)
        linkFieldsContainer.appendChild(fieldGroup)
      })
    } else {
      linkFieldsContainer.innerHTML += "<p>No links found in this section.</p>"
    }

    // Add "Add New Link" button
    const addLinkBtn = document.createElement("button")
    addLinkBtn.className = "btn-secondary"
    addLinkBtn.textContent = "Add New Link"
    addLinkBtn.addEventListener("click", () => {
      // Load the admin-add-content.js script if not already loaded
      if (typeof addNewLink !== "function") {
        const script = document.createElement("script")
        script.src = "admin-add-content.js"
        document.head.appendChild(script)
        script.onload = () => {
          if (typeof addNewLink === "function") {
            addNewLink(section.id)
          } else {
            console.error("addNewLink is not a function after script load")
          }
        }
      } else {
        addNewLink(section.id)
      }
    })
    linkFieldsContainer.appendChild(addLinkBtn)
    editorFields.appendChild(linkFieldsContainer)
  }

  // Create text field
  function createTextField(text) {
    const fieldGroup = document.createElement("div")
    fieldGroup.className = "field-group"

    // Create a more descriptive label based on the element type and content
    let labelText = `${text.element.toUpperCase()} Text`

    // For logo parts, make the label more descriptive
    if (text.part === "main") {
      labelText = "Logo Main Text"
    } else if (text.part === "span") {
      labelText = "Logo Accent Text"
    }

    const label = document.createElement("label")
    label.textContent = labelText
    fieldGroup.appendChild(label)

    const input = document.createElement("textarea")
    input.value = text.content
    input.dataset.id = text.id
    input.dataset.path = text.path
    input.dataset.type = "text"
    input.dataset.part = text.part || ""

    // Store original element HTML if available
    if (text.originalElement) {
      input.dataset.originalElement = text.originalElement
    }

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

  // Create image field with both URL and upload options
  function createImageField(image) {
    const fieldGroup = document.createElement("div")
    fieldGroup.className = "field-group image-field-group"

    // Image source label and tabs
    const sourceLabel = document.createElement("div")
    sourceLabel.className = "image-source-label"
    sourceLabel.innerHTML = "<span>Image Source:</span>"

    const tabsContainer = document.createElement("div")
    tabsContainer.className = "image-source-tabs"

    const urlTab = document.createElement("button")
    urlTab.className = "image-tab active"
    urlTab.textContent = "URL"
    urlTab.dataset.tab = "url"

    const uploadTab = document.createElement("button")
    uploadTab.className = "image-tab"
    uploadTab.textContent = "Upload"
    uploadTab.dataset.tab = "upload"

    tabsContainer.appendChild(urlTab)
    tabsContainer.appendChild(uploadTab)
    sourceLabel.appendChild(tabsContainer)
    fieldGroup.appendChild(sourceLabel)

    // URL input container
    const urlContainer = document.createElement("div")
    urlContainer.className = "image-source-container url-container"

    const urlLabel = document.createElement("label")
    urlLabel.textContent = "Image URL"
    urlContainer.appendChild(urlLabel)

    const urlInput = document.createElement("input")
    urlInput.type = "url"
    urlInput.value = image.src
    urlInput.dataset.id = image.id
    urlInput.dataset.path = image.path
    urlInput.dataset.type = "image-src"

    urlInput.addEventListener("input", () => {
      // Update the content in the editableContent object
      const sectionContent = editableContent[currentSection.id]
      const imageItem = sectionContent.images.find((i) => i.id === image.id)
      if (imageItem) {
        imageItem.src = urlInput.value
        // Update preview
        previewImg.src = urlInput.value
      }
    })

    urlContainer.appendChild(urlInput)
    fieldGroup.appendChild(urlContainer)

    // Upload input container
    const uploadContainer = document.createElement("div")
    uploadContainer.className = "image-source-container upload-container hidden"

    const uploadLabel = document.createElement("label")
    uploadLabel.textContent = "Upload Image"
    uploadContainer.appendChild(uploadLabel)

    const uploadInput = document.createElement("input")
    uploadInput.type = "file"
    uploadInput.accept = "image/*"
    uploadInput.dataset.id = image.id
    uploadInput.dataset.path = image.path
    uploadInput.dataset.type = "image-upload"

    uploadInput.addEventListener("change", async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]

        // Show loading state
        const uploadStatus = document.createElement("div")
        uploadStatus.className = "upload-status"
        uploadStatus.innerHTML = '<div class="spinner"></div><span>Uploading image...</span>'
        uploadContainer.appendChild(uploadStatus)

        try {
          // Upload the file to GitHub
          const imageUrl = await uploadImageToGitHub(file)

          // Update the content in the editableContent object
          const sectionContent = editableContent[currentSection.id]
          const imageItem = sectionContent.images.find((i) => i.id === image.id)
          if (imageItem) {
            imageItem.src = imageUrl
            // Update URL input and preview
            urlInput.value = imageUrl
            previewImg.src = imageUrl
          }

          // Show success message
          uploadStatus.innerHTML = '<span class="success">Upload successful!</span>'
          setTimeout(() => {
            uploadStatus.remove()
          }, 3000)
        } catch (error) {
          console.error("Error uploading image:", error)
          // Show error message
          uploadStatus.innerHTML = `<span class="error">Upload failed: ${error.message}</span>`
          setTimeout(() => {
            uploadStatus.remove()
          }, 5000)
        }
      }
    })

    uploadContainer.appendChild(uploadInput)
    fieldGroup.appendChild(uploadContainer)

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

    // Tab switching functionality
    urlTab.addEventListener("click", () => {
      urlTab.classList.add("active")
      uploadTab.classList.remove("active")
      urlContainer.classList.remove("hidden")
      uploadContainer.classList.add("hidden")
    })

    uploadTab.addEventListener("click", () => {
      uploadTab.classList.add("active")
      urlTab.classList.remove("active")
      uploadContainer.classList.remove("hidden")
      urlContainer.classList.add("hidden")
    })

    return fieldGroup
  }

  // Function to upload an image to GitHub
  async function uploadImageToGitHub(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file selected"))
        return
      }

      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          // Get base64 encoded content (remove the data:image/xxx;base64, part)
          const content = e.target.result.split(",")[1]

          // Generate a unique filename
          const timestamp = new Date().getTime()
          const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const path = `${config.imagesFolder}/${filename}`

          // Upload to GitHub
          const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            method: "PUT",
            headers: {
              Authorization: `token ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Upload image: ${filename}`,
              content: content,
              branch: config.mainBranch,
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()

          // Return the URL to the uploaded image
          // Use the raw content URL for images
          const imageUrl = data.content.download_url
          resolve(imageUrl)
        } catch (error) {
          console.error("Error uploading image:", error)
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error("Error reading file"))
      }

      // Read the file as Data URL
      reader.readAsDataURL(file)
    })
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
        // First, group texts by their original element to handle logo parts together
        const textsByOriginalElement = {}

        sectionContent.texts.forEach((text) => {
          if (text.part && text.originalElement) {
            if (!textsByOriginalElement[text.originalElement]) {
              textsByOriginalElement[text.originalElement] = []
            }
            textsByOriginalElement[text.originalElement].push(text)
          }
        })

        // Handle special cases like logo text with parts
        Object.keys(textsByOriginalElement).forEach((originalElement) => {
          const parts = textsByOriginalElement[originalElement]
          if (parts.length > 0) {
            // Find the main element
            const mainPart = parts.find((p) => p.part === "main")
            const spanPart = parts.find((p) => p.part === "span")

            if (mainPart && spanPart) {
              // Find the element in the DOM
              const element = sectionElement.querySelector(mainPart.path.split(" ")[0])
              if (element) {
                // Update the main text and span text
                const mainText = mainPart.content
                const spanText = spanPart.content

                // Find all text nodes and span elements
                const childNodes = Array.from(element.childNodes)
                childNodes.forEach((node) => {
                  if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = mainText
                  } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
                    node.textContent = spanText
                  }
                })
              }
            }
          }
        })

        // Handle regular text elements
        sectionContent.texts.forEach((text) => {
          try {
            // Skip new elements and parts of composite elements
            if (text.isNew || text.part) return

            const element = sectionElement.querySelector(text.path)
            if (element) {
              element.textContent = text.content
            } else {
              console.warn(`Element not found for path: ${text.path}`)
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
            // Skip new elements, they'll be handled separately
            if (image.isNew) return

            const element = sectionElement.querySelector(image.path)
            if (element) {
              element.setAttribute("src", image.src)
              element.setAttribute("alt", image.alt)
            } else {
              console.warn(`Element not found for path: ${image.path}`)
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
            // Skip new elements, they'll be handled separately
            if (link.isNew) return

            const element = sectionElement.querySelector(link.path)
            if (element) {
              element.setAttribute("href", link.href)
              element.textContent = link.text
            } else {
              console.warn(`Element not found for path: ${link.path}`)
            }
          } catch (error) {
            console.error(`Error updating link ${link.id}:`, error)
          }
        })
      }
    })

    // Handle adding new elements
    if (typeof applyNewElementsToHTML === "function") {
      applyNewElementsToHTML(doc)
    } else {
      console.warn("applyNewElementsToHTML function not found. New elements will not be added.")
    }

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
    // Get the registered callback URL from GitHub OAuth app settings
    // IMPORTANT: This must EXACTLY match what's in your GitHub OAuth app settings
    const registeredRedirectUri = "http://127.0.0.1:5501/auth-callback.html"

    window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23liO4HGDGaOohco1M&redirect_uri=${encodeURIComponent(registeredRedirectUri)}&scope=repo`
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
