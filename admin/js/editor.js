/**
 * Editor module for managing content editing
 */
const Editor = (() => {
  // Import GitHubAPI module (assuming it's in a separate file)
  // You might need to adjust the path depending on your project structure
  // For example: import * as GitHubAPI from './github-api.js';
  // If you're not using modules, you'll need to ensure GitHubAPI is defined globally
  // before this script runs.  For example, by including it in a <script> tag in your HTML.
  // For this example, I'm assuming it's globally available.

  // Current content state
  let currentData = null
  let currentContent = ""
  let currentSha = ""
  let currentSection = null

  /**
   * Initialize the editor
   */
  async function init() {
    showLoading(true)

    try {
      // Fetch content from GitHub
      const { content, sha } = await GitHubAPI.getContentFile()

      // Parse front matter
      const { data, content: markdownContent } = GitHubAPI.parseFrontMatter(content)

      // Store current state
      currentData = data
      currentContent = markdownContent
      currentSha = sha

      // Populate section list
      populateSectionList()

      // Set up event listeners
      document.getElementById("save-btn").addEventListener("click", saveChanges)
      document.getElementById("preview-btn").addEventListener("click", showPreview)

      // Set up modal close button
      document.querySelector(".modal .close").addEventListener("click", () => {
        document.getElementById("preview-modal").style.display = "none"
      })

      // Select first section by default
      const firstSection = document.querySelector(".section-list li")
      if (firstSection) {
        firstSection.click()
      }
    } catch (error) {
      console.error("Error initializing editor:", error)
      showNotification("Failed to load content", "error")
    } finally {
      showLoading(false)
    }
  }

  /**
   * Populate the section list in the sidebar
   */
  function populateSectionList() {
    const sectionList = document.getElementById("section-list")
    sectionList.innerHTML = ""

    // Add sections based on the data structure
    const sections = [
      { id: "header", label: "Header" },
      { id: "navigation", label: "Navigation" },
      { id: "hero", label: "Hero Section" },
      { id: "services", label: "Services Section" },
      { id: "thisAndThat", label: "This & That Section" },
      { id: "portfolio", label: "Portfolio Section" },
      { id: "testimonial", label: "Testimonial Section" },
      { id: "stats", label: "Stats Section" },
      { id: "contact", label: "Contact Section" },
      { id: "footer", label: "Footer" },
      { id: "notification", label: "Notification" },
    ]

    sections.forEach((section) => {
      const li = document.createElement("li")
      li.textContent = section.label
      li.dataset.section = section.id
      li.addEventListener("click", () => selectSection(section.id))
      sectionList.appendChild(li)
    })
  }

  /**
   * Select a section to edit
   */
  function selectSection(sectionId) {
    // Update active section in sidebar
    document.querySelectorAll(".section-list li").forEach((li) => {
      li.classList.remove("active")
      if (li.dataset.section === sectionId) {
        li.classList.add("active")
      }
    })

    // Store current section
    currentSection = sectionId

    // Render editor for the selected section
    renderSectionEditor(sectionId)
  }

  /**
   * Render the editor for the selected section
   */
  function renderSectionEditor(sectionId) {
    const editorElement = document.getElementById("editor")
    editorElement.innerHTML = ""

    // Get section data
    const sectionData = currentData[sectionId]
    if (!sectionData) {
      editorElement.innerHTML = "<p>No data found for this section</p>"
      return
    }

    // Create form based on section type
    const form = document.createElement("form")
    form.id = "section-form"
    form.addEventListener("submit", (e) => e.preventDefault())

    // Render different forms based on section
    switch (sectionId) {
      case "header":
        renderHeaderForm(form, sectionData)
        break
      case "navigation":
        renderNavigationForm(form, sectionData)
        break
      case "hero":
        renderHeroForm(form, sectionData)
        break
      case "services":
        renderServicesForm(form, sectionData)
        break
      case "thisAndThat":
        renderThisAndThatForm(form, sectionData)
        break
      case "portfolio":
        renderPortfolioForm(form, sectionData)
        break
      case "testimonial":
        renderTestimonialForm(form, sectionData)
        break
      case "stats":
        renderStatsForm(form, sectionData)
        break
      case "contact":
        renderContactForm(form, sectionData)
        break
      case "footer":
        renderFooterForm(form, sectionData)
        break
      case "notification":
        renderNotificationForm(form, sectionData)
        break
      default:
        form.innerHTML = "<p>Unknown section</p>"
    }

    editorElement.appendChild(form)
  }

  /**
   * Render form for header section
   */
  function renderHeaderForm(form, data) {
    form.innerHTML = `
      <h2>Header</h2>
      <div class="form-group">
        <label for="header-logo">Logo</label>
        <input type="text" id="header-logo" class="form-control" value="${data.logo || ""}">
      </div>
    `
  }

  /**
   * Render form for navigation section
   */
  function renderNavigationForm(form, data) {
    form.innerHTML = `
      <h2>Navigation</h2>
      <div id="navigation-items">
        ${(data || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Navigation Item ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>  class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="nav-label-${index}">Label</label>
              <input type="text" id="nav-label-${index}" class="form-control" value="${item.label || ""}">
            </div>
            <div class="form-group">
              <label for="nav-url-${index}">URL</label>
              <input type="text" id="nav-url-${index}" class="form-control" value="${item.url || ""}">
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-nav-item">Add Navigation Item</button>
    `

    // Add event listeners for add/remove buttons
    form.querySelector("#add-nav-item").addEventListener("click", () => addNavigationItem(form))
    form.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => removeArrayItem(e, "navigation"))
    })
  }

  /**
   * Render form for hero section
   */
  function renderHeroForm(form, data) {
    form.innerHTML = `
      <h2>Hero Section</h2>
      <div class="form-group">
        <label>Title</label>
        <div class="form-group">
          <label for="hero-title-line1">Line 1</label>
          <input type="text" id="hero-title-line1" class="form-control" value="${data.title?.line1 || ""}">
        </div>
        <div class="form-group">
          <label for="hero-title-line2">Line 2</label>
          <input type="text" id="hero-title-line2" class="form-control" value="${data.title?.line2 || ""}">
        </div>
        <div class="form-group">
          <label for="hero-title-line3">Line 3</label>
          <input type="text" id="hero-title-line3" class="form-control" value="${data.title?.line3 || ""}">
        </div>
      </div>
      <div class="form-group">
        <label for="hero-description">Description</label>
        <textarea id="hero-description" class="form-control">${data.description || ""}</textarea>
      </div>
      <div class="form-group">
        <label>Button</label>
        <div class="form-group">
          <label for="hero-button-text">Text</label>
          <input type="text" id="hero-button-text" class="form-control" value="${data.button?.text || ""}">
        </div>
        <div class="form-group">
          <label for="hero-button-url">URL</label>
          <input type="text" id="hero-button-url" class="form-control" value="${data.button?.url || ""}">
        </div>
      </div>
      <div class="form-group">
        <label for="hero-image">Image URL</label>
        <input type="text" id="hero-image" class="form-control" value="${data.image || ""}">
      </div>
      <div class="form-group">
        <label for="hero-sticker">Sticker Text</label>
        <input type="text" id="hero-sticker" class="form-control" value="${data.sticker || ""}">
      </div>
      <div class="form-group">
        <label for="hero-polaroid-caption">Polaroid Caption</label>
        <input type="text" id="hero-polaroid-caption" class="form-control" value="${data.polaroidCaption || ""}">
      </div>
    `
  }

  /**
   * Render form for services section
   */
  function renderServicesForm(form, data) {
    form.innerHTML = `
      <h2>Services Section</h2>
      <div class="form-group">
        <label for="services-title">Title</label>
        <input type="text" id="services-title" class="form-control" value="${data.title || ""}">
      </div>
      <div class="form-group">
        <label for="services-subtitle">Subtitle</label>
        <input type="text" id="services-subtitle" class="form-control" value="${data.subtitle || ""}">
      </div>
      <h3>Service Items</h3>
      <div id="services-items">
        ${(data.items || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Service Item ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="service-icon-${index}">Icon</label>
              <input type="text" id="service-icon-${index}" class="form-control" value="${item.icon || ""}">
            </div>
            <div class="form-group">
              <label for="service-title-${index}">Title</label>
              <input type="text" id="service-title-${index}" class="form-control" value="${item.title || ""}">
            </div>
            <div class="form-group">
              <label for="service-description-${index}">Description</label>
              <textarea id="service-description-${index}" class="form-control">${item.description || ""}</textarea>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-service-item">Add Service Item</button>
    `

    // Add event listeners for add/remove buttons
    form.querySelector("#add-service-item").addEventListener("click", () => addServiceItem(form))
    form.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => removeArrayItem(e, "services.items"))
    })
  }

  /**
   * Render form for This & That section
   */
  function renderThisAndThatForm(form, data) {
    form.innerHTML = `
      <h2>This & That Section</h2>
      <div class="form-group">
        <label for="this-and-that-title">Title</label>
        <input type="text" id="this-and-that-title" class="form-control" value="${data.title || ""}">
      </div>
      <div class="form-group">
        <label for="this-and-that-subtitle">Subtitle</label>
        <input type="text" id="this-and-that-subtitle" class="form-control" value="${data.subtitle || ""}">
      </div>
      <h3>Items</h3>
      <div id="this-and-that-items">
        ${(data.items || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Item ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="this-and-that-first-${index}">First Term</label>
              <input type="text" id="this-and-that-first-${index}" class="form-control" value="${item.firstTerm || ""}">
            </div>
            <div class="form-group">
              <label for="this-and-that-second-${index}">Second Term</label>
              <input type="text" id="this-and-that-second-${index}" class="form-control" value="${item.secondTerm || ""}">
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-this-and-that-item">Add Item</button>
    `

    // Add event listeners for add/remove buttons
    form.querySelector("#add-this-and-that-item").addEventListener("click", () => addThisAndThatItem(form))
    form.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => removeArrayItem(e, "thisAndThat.items"))
    })
  }

  /**
   * Render form for portfolio section
   */
  function renderPortfolioForm(form, data) {
    form.innerHTML = `
      <h2>Portfolio Section</h2>
      <div class="form-group">
        <label for="portfolio-title">Title</label>
        <input type="text" id="portfolio-title" class="form-control" value="${data.title || ""}">
      </div>
      <div class="form-group">
        <label for="portfolio-subtitle">Subtitle</label>
        <input type="text" id="portfolio-subtitle" class="form-control" value="${data.subtitle || ""}">
      </div>
      <h3>Mockups</h3>
      <div id="portfolio-mockups">
        ${(data.mockups || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Mockup ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="mockup-image-${index}">Image URL</label>
              <input type="text" id="mockup-image-${index}" class="form-control" value="${item.image || ""}">
            </div>
            <div class="form-group">
              <label for="mockup-caption-${index}">Caption</label>
              <input type="text" id="mockup-caption-${index}" class="form-control" value="${item.caption || ""}">
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-mockup-item">Add Mockup</button>
      
      <div class="form-group">
        <label for="portfolio-grid-title">Grid Title</label>
        <input type="text" id="portfolio-grid-title" class="form-control" value="${data.gridTitle || ""}">
      </div>
      
      <h3>Portfolio Items</h3>
      <div id="portfolio-items">
        ${(data.items || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Portfolio Item ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="portfolio-item-image-${index}">Image URL</label>
              <input type="text" id="portfolio-item-image-${index}" class="form-control" value="${item.image || ""}">
            </div>
            <div class="form-group">
              <label for="portfolio-item-title-${index}">Title</label>
              <input type="text" id="portfolio-item-title-${index}" class="form-control" value="${item.title || ""}">
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-portfolio-item">Add Portfolio Item</button>
    `

    // Add event listeners for add/remove buttons
    form.querySelector("#add-mockup-item").addEventListener("click", () => addMockupItem(form))
    form.querySelector("#add-portfolio-item").addEventListener("click", () => addPortfolioItem(form))
    form.querySelectorAll(".remove-item-btn").forEach((btn) => {
      const parent = btn.closest(".array-item")
      const parentId = parent.parentElement.id

      if (parentId === "portfolio-mockups") {
        btn.addEventListener("click", (e) => removeArrayItem(e, "portfolio.mockups"))
      } else if (parentId === "portfolio-items") {
        btn.addEventListener("click", (e) => removeArrayItem(e, "portfolio.items"))
      }
    })
  }

  /**
   * Render form for testimonial section
   */
  function renderTestimonialForm(form, data) {
    form.innerHTML = `
      <h2>Testimonial Section</h2>
      <div class="form-group">
        <label for="testimonial-quote">Quote</label>
        <textarea id="testimonial-quote" class="form-control">${data.quote || ""}</textarea>
      </div>
      <div class="form-group">
        <label for="testimonial-author">Author</label>
        <input type="text" id="testimonial-author" class="form-control" value="${data.author || ""}">
      </div>
    `
  }

  /**
   * Render form for stats section
   */
  function renderStatsForm(form, data) {
    form.innerHTML = `
      <h2>Stats Section</h2>
      <h3>Stat Items</h3>
      <div id="stats-items">
        ${(data.items || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Stat Item ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="stat-value-${index}">Value</label>
              <input type="text" id="stat-value-${index}" class="form-control" value="${item.value || ""}">
            </div>
            <div class="form-group">
              <label for="stat-label-${index}">Label</label>
              <input type="text" id="stat-label-${index}" class="form-control" value="${item.label || ""}">
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-stat-item">Add Stat Item</button>
    `

    // Add event listeners for add/remove buttons
    form.querySelector("#add-stat-item").addEventListener("click", () => addStatItem(form))
    form.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => removeArrayItem(e, "stats.items"))
    })
  }

  /**
   * Render form for contact section
   */
  function renderContactForm(form, data) {
    form.innerHTML = `
      <h2>Contact Section</h2>
      <div class="form-group">
        <label for="contact-title">Title</label>
        <input type="text" id="contact-title" class="form-control" value="${data.title || ""}">
      </div>
      <div class="form-group">
        <label for="contact-subtitle">Subtitle</label>
        <input type="text" id="contact-subtitle" class="form-control" value="${data.subtitle || ""}">
      </div>
      <h3>Contact Info</h3>
      <div id="contact-info-items">
        ${(data.info || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Contact Info ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="contact-info-icon-${index}">Icon</label>
              <input type="text" id="contact-info-icon-${index}" class="form-control" value="${item.icon || ""}">
            </div>
            <div class="form-group">
              <label for="contact-info-text-${index}">Text</label>
              <input type="text" id="contact-info-text-${index}" class="form-control" value="${item.text || ""}">
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-contact-info">Add Contact Info</button>
      
      <h3>Form</h3>
      <div class="form-group">
        <label for="contact-form-action">Form Action URL</label>
        <input type="text" id="contact-form-action" class="form-control" value="${data.form?.action || ""}">
      </div>
    `

    // Add event listeners for add/remove buttons
    form.querySelector("#add-contact-info").addEventListener("click", () => addContactInfo(form))
    form.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => removeArrayItem(e, "contact.info"))
    })
  }

  /**
   * Render form for footer section
   */
  function renderFooterForm(form, data) {
    form.innerHTML = `
      <h2>Footer Section</h2>
      <div class="form-group">
        <label for="footer-logo">Logo</label>
        <input type="text" id="footer-logo" class="form-control" value="${data.logo || ""}">
      </div>
      <div class="form-group">
        <label for="footer-description">Description</label>
        <textarea id="footer-description" class="form-control">${data.description || ""}</textarea>
      </div>
      <h3>Social Media</h3>
      <div class="form-group">
        <label for="footer-social-title">Social Title</label>
        <input type="text" id="footer-social-title" class="form-control" value="${data.social?.title || ""}">
      </div>
      <h4>Social Icons</h4>
      <div id="footer-social-icons">
        ${(data.social?.icons || [])
          .map(
            (item, index) => `
          <div class="array-item" data-index="${index}">
            <div class="array-item-header">
              <span class="array-item-title">Social Icon ${index + 1}</span>
              <div class="array-actions">
                <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
              </div>
            </div>
            <div class="form-group">
              <label for="social-icon-type-${index}">Type</label>
              <select id="social-icon-type-${index}" class="form-control">
                <option value="facebook" ${item.type === "facebook" ? "selected" : ""}>Facebook</option>
                <option value="instagram" ${item.type === "instagram" ? "selected" : ""}>Instagram</option>
                <option value="x" ${item.type === "x" ? "selected" : ""}>X (Twitter)</option>
                <option value="youtube" ${item.type === "youtube" ? "selected" : ""}>YouTube</option>
              </select>
            </div>
            <div class="form-group">
              <label for="social-icon-url-${index}">URL</label>
              <input type="text" id="social-icon-url-${index}" class="form-control" value="${item.url || ""}">
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button type="button" class="btn add-item-btn" id="add-social-icon">Add Social Icon</button>
      
      <div class="form-group">
        <label for="footer-copyright">Copyright</label>
        <input type="text" id="footer-copyright" class="form-control" value="${data.copyright || ""}">
      </div>
    `

    // Add event listeners for add/remove buttons
    form.querySelector("#add-social-icon").addEventListener("click", () => addSocialIcon(form))
    form.querySelectorAll(".remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => removeArrayItem(e, "footer.social.icons"))
    })
  }

  /**
   * Render form for notification section
   */
  function renderNotificationForm(form, data) {
    form.innerHTML = `
      <h2>Notification</h2>
      <div class="form-group">
        <label for="notification-message">Message</label>
        <input type="text" id="notification-message" class="form-control" value="${data.message || ""}">
      </div>
    `
  }

  /**
   * Add a new navigation item
   */
  function addNavigationItem(form) {
    const navItems = form.querySelector("#navigation-items")
    const index = navItems.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Navigation Item ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="nav-label-${index}">Label</label>
        <input type="text" id="nav-label-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="nav-url-${index}">URL</label>
        <input type="text" id="nav-url-${index}" class="form-control" value="">
      </div>
    `

    navItems.appendChild(newItem)

    // Add event listener for remove button
    newItem.querySelector(".remove-item-btn").addEventListener("click", (e) => removeArrayItem(e, "navigation"))
  }

  /**
   * Add a new service item
   */
  function addServiceItem(form) {
    const serviceItems = form.querySelector("#services-items")
    const index = serviceItems.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Service Item ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="service-icon-${index}">Icon</label>
        <input type="text" id="service-icon-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="service-title-${index}">Title</label>
        <input type="text" id="service-title-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="service-description-${index}">Description</label>
        <textarea id="service-description-${index}" class="form-control"></textarea>
      </div>
    `

    serviceItems.appendChild(newItem)

    // Add event listener for remove button
    newItem.querySelector(".remove-item-btn").addEventListener("click", (e) => removeArrayItem(e, "services.items"))
  }

  /**
   * Add a new This & That item
   */
  function addThisAndThatItem(form) {
    const items = form.querySelector("#this-and-that-items")
    const index = items.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Item ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="this-and-that-first-${index}">First Term</label>
        <input type="text" id="this-and-that-first-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="this-and-that-second-${index}">Second Term</label>
        <input type="text" id="this-and-that-second-${index}" class="form-control" value="">
      </div>
    `

    items.appendChild(newItem)

    // Add event listener for remove button
    newItem.querySelector(".remove-item-btn").addEventListener("click", (e) => removeArrayItem(e, "thisAndThat.items"))
  }

  /**
   * Add a new mockup item
   */
  function addMockupItem(form) {
    const items = form.querySelector("#portfolio-mockups")
    const index = items.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Mockup ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="mockup-image-${index}">Image URL</label>
        <input type="text" id="mockup-image-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="mockup-caption-${index}">Caption</label>
        <input type="text" id="mockup-caption-${index}" class="form-control" value="">
      </div>
    `

    items.appendChild(newItem)

    // Add event listener for remove button
    newItem.querySelector(".remove-item-btn").addEventListener("click", (e) => removeArrayItem(e, "portfolio.mockups"))
  }

  /**
   * Add a new portfolio item
   */
  function addPortfolioItem(form) {
    const items = form.querySelector("#portfolio-items")
    const index = items.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Portfolio Item ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="portfolio-item-image-${index}">Image URL</label>
        <input type="text" id="portfolio-item-image-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="portfolio-item-title-${index}">Title</label>
        <input type="text" id="portfolio-item-title-${index}" class="form-control" value="">
      </div>
    `

    items.appendChild(newItem)

    // Add event listener for remove button
    newItem.querySelector(".remove-item-btn").addEventListener("click", (e) => removeArrayItem(e, "portfolio.items"))
  }

  /**
   * Add a new stat item
   */
  function addStatItem(form) {
    const items = form.querySelector("#stats-items")
    const index = items.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Stat Item ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="stat-value-${index}">Value</label>
        <input type="text" id="stat-value-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="stat-label-${index}">Label</label>
        <input type="text" id="stat-label-${index}" class="form-control" value="">
      </div>
    `

    items.appendChild(newItem)

    // Add event listener for remove button
    newItem.querySelector(".remove-item-btn").addEventListener("click", (e) => removeArrayItem(e, "stats.items"))
  }

  /**
   * Add a new contact info item
   */
  function addContactInfo(form) {
    const items = form.querySelector("#contact-info-items")
    const index = items.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Contact Info ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="contact-info-icon-${index}">Icon</label>
        <input type="text" id="contact-info-icon-${index}" class="form-control" value="">
      </div>
      <div class="form-group">
        <label for="contact-info-text-${index}">Text</label>
        <input type="text" id="contact-info-text-${index}" class="form-control" value="">
      </div>
    `

    items.appendChild(newItem)

    // Add event listener for remove button
    newItem.querySelector(".remove-item-btn").addEventListener("click", (e) => removeArrayItem(e, "contact.info"))
  }

  /**
   * Add a new social icon
   */
  function addSocialIcon(form) {
    const items = form.querySelector("#footer-social-icons")
    const index = items.children.length

    const newItem = document.createElement("div")
    newItem.className = "array-item"
    newItem.dataset.index = index
    newItem.innerHTML = `
      <div class="array-item-header">
        <span class="array-item-title">Social Icon ${index + 1}</span>
        <div class="array-actions">
          <button type="button" class="btn btn-sm remove-item-btn">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label for="social-icon-type-${index}">Type</label>
        <select id="social-icon-type-${index}" class="form-control">
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="x">X (Twitter)</option>
          <option value="youtube">YouTube</option>
        </select>
      </div>
      <div class="form-group">
        <label for="social-icon-url-${index}">URL</label>
        <input type="text" id="social-icon-url-${index}" class="form-control" value="">
      </div>
    `

    items.appendChild(newItem)

    // Add event listener for remove button
    newItem
      .querySelector(".remove-item-btn")
      .addEventListener("click", (e) => removeArrayItem(e, "footer.social.icons"))
  }

  /**
   * Remove an array item
   */
  function removeArrayItem(event, path) {
    const item = event.target.closest(".array-item")
    const container = item.parentElement

    // Remove the item
    container.removeChild(item)

    // Update indices for remaining items
    Array.from(container.children).forEach((child, index) => {
      child.dataset.index = index
      child.querySelector(".array-item-title").textContent = child
        .querySelector(".array-item-title")
        .textContent.replace(/\d+/, index + 1)
    })
  }

  /**
   * Save changes to the content
   */
  async function saveChanges() {
    showLoading(true)

    try {
      // Get updated data from form
      const updatedData = getFormData()

      // Update current data
      currentData = updatedData

      // Generate markdown
      const markdown = GitHubAPI.generateMarkdown(currentData, currentContent)

      // Update file in GitHub
      await GitHubAPI.updateContentFile(markdown, currentSha)

      // Show success message
      showNotification("Content saved successfully", "success")

      // Refresh content
      init()
    } catch (error) {
      console.error("Error saving changes:", error)
      showNotification("Failed to save changes", "error")
    } finally {
      showLoading(false)
    }
  }

  /**
   * Get form data based on current section
   */
  function getFormData() {
    const data = { ...currentData }

    switch (currentSection) {
      case "header":
        data.logo = document.getElementById("header-logo").value
        break

      case "navigation":
        data.navigation = Array.from(document.querySelectorAll("#navigation-items .array-item")).map((item, index) => ({
          label: document.getElementById(`nav-label-${index}`).value,
          url: document.getElementById(`nav-url-${index}`).value,
        }))
        break

      case "hero":
        data.hero = {
          title: {
            line1: document.getElementById("hero-title-line1").value,
            line2: document.getElementById("hero-title-line2").value,
            line3: document.getElementById("hero-title-line3").value,
          },
          description: document.getElementById("hero-description").value,
          button: {
            text: document.getElementById("hero-button-text").value,
            url: document.getElementById("hero-button-url").value,
          },
          image: document.getElementById("hero-image").value,
          sticker: document.getElementById("hero-sticker").value,
          polaroidCaption: document.getElementById("hero-polaroid-caption").value,
        }
        break

      case "services":
        data.services = {
          title: document.getElementById("services-title").value,
          subtitle: document.getElementById("services-subtitle").value,
          items: Array.from(document.querySelectorAll("#services-items .array-item")).map((item, index) => ({
            icon: document.getElementById(`service-icon-${index}`).value,
            title: document.getElementById(`service-title-${index}`).value,
            description: document.getElementById(`service-description-${index}`).value,
          })),
        }
        break

      case "thisAndThat":
        data.thisAndThat = {
          title: document.getElementById("this-and-that-title").value,
          subtitle: document.getElementById("this-and-that-subtitle").value,
          items: Array.from(document.querySelectorAll("#this-and-that-items .array-item")).map((item, index) => ({
            firstTerm: document.getElementById(`this-and-that-first-${index}`).value,
            secondTerm: document.getElementById(`this-and-that-second-${index}`).value,
          })),
        }
        break

      case "portfolio":
        data.portfolio = {
          title: document.getElementById("portfolio-title").value,
          subtitle: document.getElementById("portfolio-subtitle").value,
          mockups: Array.from(document.querySelectorAll("#portfolio-mockups .array-item")).map((item, index) => ({
            image: document.getElementById(`mockup-image-${index}`).value,
            caption: document.getElementById(`mockup-caption-${index}`).value,
          })),
          gridTitle: document.getElementById("portfolio-grid-title").value,
          items: Array.from(document.querySelectorAll("#portfolio-items .array-item")).map((item, index) => ({
            image: document.getElementById(`portfolio-item-image-${index}`).value,
            title: document.getElementById(`portfolio-item-title-${index}`).value,
          })),
        }
        break

      case "testimonial":
        data.testimonial = {
          quote: document.getElementById("testimonial-quote").value,
          author: document.getElementById("testimonial-author").value,
        }
        break

      case "stats":
        data.stats = {
          items: Array.from(document.querySelectorAll("#stats-items .array-item")).map((item, index) => ({
            value: document.getElementById(`stat-value-${index}`).value,
            label: document.getElementById(`stat-label-${index}`).value,
          })),
        }
        break

      case "contact":
        data.contact = {
          title: document.getElementById("contact-title").value,
          subtitle: document.getElementById("contact-subtitle").value,
          info: Array.from(document.querySelectorAll("#contact-info-items .array-item")).map((item, index) => ({
            icon: document.getElementById(`contact-info-icon-${index}`).value,
            text: document.getElementById(`contact-info-text-${index}`).value,
          })),
          form: {
            action: document.getElementById("contact-form-action").value,
          },
        }
        break

      case "footer":
        data.footer = {
          logo: document.getElementById("footer-logo").value,
          description: document.getElementById("footer-description").value,
          social: {
            title: document.getElementById("footer-social-title").value,
            icons: Array.from(document.querySelectorAll("#footer-social-icons .array-item")).map((item, index) => ({
              type: document.getElementById(`social-icon-type-${index}`).value,
              url: document.getElementById(`social-icon-url-${index}`).value,
            })),
          },
          copyright: document.getElementById("footer-copyright").value,
        }
        break

      case "notification":
        data.notification = {
          message: document.getElementById("notification-message").value,
        }
        break
    }

    return data
  }

  /**
   * Show preview of the website
   */
  function showPreview() {
    // Get updated data from form
    const updatedData = getFormData()

    // Generate markdown
    const markdown = GitHubAPI.generateMarkdown(updatedData, currentContent)

    // Create a blob URL for the preview
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)

    // Open preview modal
    const modal = document.getElementById("preview-modal")
    modal.style.display = "block"

    // Set up preview frame
    const previewFrame = document.getElementById("preview-frame")
    previewFrame.src = url

    // Clean up when modal is closed
    document.querySelector(".modal .close").addEventListener("click", () => {
      URL.revokeObjectURL(url)
    })
  }

  /**
   * Show or hide loading indicator
   */
  function showLoading(show) {
    const loading = document.getElementById("loading")
    loading.style.display = show ? "flex" : "none"
  }

  /**
   * Show notification
   */
  function showNotification(message, type = "success") {
    const notification = document.getElementById("notification")
    const notificationMessage = document.getElementById("notification-message")

    notification.className = "notification"
    notification.classList.add(type)
    notification.classList.add("show")

    notificationMessage.textContent = message

    setTimeout(() => {
      notification.classList.remove("show")
    }, 5000)
  }

  // Public API
  return {
    init,
    saveChanges,
    showPreview,
  }
})()
