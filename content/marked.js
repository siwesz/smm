/**
 * Parse YAML front matter from markdown content
 * @param {string} markdown - The markdown content with front matter
 * @returns {Object} - The parsed front matter as an object
 */
function parseFrontMatter(markdown) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = markdown.match(frontMatterRegex)

  if (!match) {
    console.error("No front matter found in markdown file")
    return {}
  }

  const frontMatter = match[1]
  const data = {}

  // Split by lines and process each line
  const lines = frontMatter.split("\n")

  // Helper function to get indentation level
  const getIndent = (line) => line.search(/\S/)

  // Process the YAML structure
  const processYAML = (startIndex, parentObj, baseIndent) => {
    let i = startIndex
    const currentObj = parentObj

    while (i < lines.length) {
      const line = lines[i].trimRight()
      if (!line.trim() || line.trim().startsWith("#")) {
        i++
        continue // Skip empty lines and comments
      }

      const indent = getIndent(line)

      // If we're back to a lower indentation level, return to parent
      if (indent < baseIndent) {
        return i - 1 // Go back one line as we've gone too far
      }

      // Check if this is a new section at the same level
      if (indent === baseIndent) {
        const colonIndex = line.indexOf(":")
        if (colonIndex !== -1) {
          const key = line.substring(indent, colonIndex).trim()
          const value = line.substring(colonIndex + 1).trim()

          // Check if this is an array item
          if (key.startsWith("-")) {
            // This is an array item
            const itemKey = key.substring(1).trim()

            // If parent is not an array yet, make it one
            if (!Array.isArray(currentObj)) {
              Object.keys(currentObj).forEach((k) => delete currentObj[k])
              Object.setPrototypeOf(currentObj, Array.prototype)
              currentObj.length = 0
            }

            if (itemKey) {
              // This is a key-value pair in an array item
              const newItem = {}
              if (value) {
                newItem[itemKey] = value
              } else {
                // Process nested object in array item
                const nestedObj = {}
                newItem[itemKey] = nestedObj
                i = processYAML(i + 1, nestedObj, indent + 2)
              }
              currentObj.push(newItem)
            } else if (value) {
              // Simple array item
              currentObj.push(value)
            } else {
              // Empty object in array
              const newItem = {}
              currentObj.push(newItem)
              i = processYAML(i + 1, newItem, indent + 2)
            }
          } else {
            // Regular key-value pair
            if (value) {
              // Simple value
              currentObj[key] = value
            } else {
              // Nested object or array
              const nextLine = i + 1 < lines.length ? lines[i + 1] : ""
              const nextIndent = nextLine ? getIndent(nextLine) : -1

              if (nextIndent > indent && nextLine.trim().startsWith("-")) {
                // This is an array
                currentObj[key] = []
                i = processYAML(i + 1, currentObj[key], nextIndent)
              } else {
                // This is an object
                currentObj[key] = {}
                i = processYAML(i + 1, currentObj[key], indent + 2)
              }
            }
          }
        }
      } else if (indent > baseIndent) {
        // This is a nested item, but we're expecting to process at baseIndent level
        // Skip it as it will be processed by a recursive call
        i++
        continue
      }

      i++
    }

    return i
  }

  // Start processing from the top level
  processYAML(0, data, 0)

  return data
}

/**
 * Safely get a nested property from an object
 * @param {Object} obj - The object to get the property from
 * @param {string} path - The path to the property (e.g. 'a.b.c')
 * @param {*} defaultValue - The default value to return if the property doesn't exist
 * @returns {*} - The property value or the default value
 */
function getValue(obj, path, defaultValue = "") {
  if (!obj) return defaultValue

  const keys = path.split(".")
  let current = obj

  for (const key of keys) {
    if (current[key] === undefined) {
      return defaultValue
    }
    current = current[key]
  }

  return current || defaultValue
}

// Replace the populateWebsite function with this updated version that ensures navigation links work correctly
function populateWebsite(data) {
  if (!data) {
    console.error("No data to populate website")
    return
  }

  console.log("Populating website with data:", data)

  // Clear all content containers first
  document.querySelectorAll("[data-content]").forEach((el) => {
    el.innerHTML = ""
  })

  // Header
  const headerLogo = document.querySelector(".logo-text")
  if (headerLogo) {
    headerLogo.innerHTML = getValue(data, "logo")
  }

  // Hero Section
  const heroTitle = document.querySelector(".hero-content h1")
  if (heroTitle && data.hero && data.hero.title) {
    heroTitle.innerHTML = `${data.hero.title.line1} <span>${data.hero.title.line2}</span> <span>${data.hero.title.line3}</span>`
  }

  const heroDescription = document.querySelector(".hero-content p")
  if (heroDescription) {
    heroDescription.textContent = getValue(data, "hero.description")
  }

  const heroButton = document.querySelector(".hero-content .btn")
  if (heroButton && data.hero && data.hero.button) {
    heroButton.textContent = data.hero.button.text
    heroButton.href = data.hero.button.url
    // Add click event listener to hero button
    heroButton.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      if (targetId && targetId !== "#") {
        const targetElement = document.querySelector(targetId)
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          })
        }
      }
    })
  }

  const heroImage = document.querySelector(".hero-image img")
  if (heroImage) {
    heroImage.src = getValue(data, "hero.image")
    heroImage.alt = "Social Media Marketing"
  }

  const heroSticker = document.querySelector(".hero-sticker")
  if (heroSticker) {
    heroSticker.textContent = getValue(data, "hero.sticker")
  }

  const polaroid = document.querySelector(".polaroid")
  if (polaroid && data.hero) {
    polaroid.setAttribute("data-caption", data.hero.polaroidCaption)
    // Update the ::after content in CSS
    const style = document.createElement("style")
    style.textContent = `.polaroid::after { content: '${data.hero.polaroidCaption}'; }`
    document.head.appendChild(style)
  }

  // Services Section
  const servicesTitle = document.querySelector(".grid-section .section-header h2")
  if (servicesTitle) {
    servicesTitle.textContent = getValue(data, "services.title")
  }

  const servicesSubtitle = document.querySelector(".grid-section .section-header p")
  if (servicesSubtitle) {
    servicesSubtitle.textContent = getValue(data, "services.subtitle")
  }

  const servicesGrid = document.querySelector(".services-grid")
  if (servicesGrid && data.services && data.services.items) {
    servicesGrid.innerHTML = ""
    data.services.items.forEach((service) => {
      const serviceCard = document.createElement("div")
      serviceCard.className = "service-card"
      serviceCard.innerHTML = `
        <div class="service-icon">
          <span>${service.icon}</span>
        </div>
        <h3>${service.title}</h3>
        <p>${service.description}</p>
      `
      servicesGrid.appendChild(serviceCard)
    })
  }

  // This & That Section
  const thisAndThatTitle = document.querySelector(".this-and-that-header h2")
  if (thisAndThatTitle) {
    thisAndThatTitle.textContent = getValue(data, "thisAndThat.title")
  }

  const thisAndThatSubtitle = document.querySelector(".this-and-that-header p")
  if (thisAndThatSubtitle) {
    thisAndThatSubtitle.textContent = getValue(data, "thisAndThat.subtitle")
  }

  const thisAndThatGrid = document.querySelector(".this-and-that-grid")
  if (thisAndThatGrid && data.thisAndThat && data.thisAndThat.items) {
    thisAndThatGrid.innerHTML = ""
    data.thisAndThat.items.forEach((item) => {
      const thisAndThatItem = document.createElement("div")
      thisAndThatItem.className = "this-and-that-item"
      thisAndThatItem.innerHTML = `
        <span>${item.firstTerm}</span>
        <span>${item.secondTerm}</span>
      `
      thisAndThatGrid.appendChild(thisAndThatItem)
    })
  }

  // Portfolio Section
  const portfolioTitle = document.querySelector(".portfolio .section-header h2")
  if (portfolioTitle) {
    portfolioTitle.textContent = getValue(data, "portfolio.title")
  }

  const portfolioSubtitle = document.querySelector(".portfolio .section-header p")
  if (portfolioSubtitle) {
    portfolioSubtitle.textContent = getValue(data, "portfolio.subtitle")
  }

  const mockupShowcase = document.querySelector(".mockup-showcase")
  if (mockupShowcase && data.portfolio && data.portfolio.mockups) {
    mockupShowcase.innerHTML = ""
    data.portfolio.mockups.forEach((mockup) => {
      const phoneMockup = document.createElement("div")
      phoneMockup.className = "phone-mockup"
      phoneMockup.innerHTML = `
        <div class="phone-frame">
          <div class="screen">
            <img src="${mockup.image}" alt="${mockup.caption}">
          </div>
        </div>
        <p>${mockup.caption}</p>
      `
      mockupShowcase.appendChild(phoneMockup)
    })
  }

  const portfolioGridTitle = document.querySelector(".portfolio-grid-title")
  if (portfolioGridTitle) {
    portfolioGridTitle.textContent = getValue(data, "portfolio.gridTitle")
  }

  const portfolioGrid = document.querySelector(".portfolio-grid")
  if (portfolioGrid && data.portfolio && data.portfolio.items) {
    portfolioGrid.innerHTML = ""
    data.portfolio.items.forEach((item) => {
      const portfolioItem = document.createElement("div")
      portfolioItem.className = "portfolio-item fade-up"
      portfolioItem.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="portfolio-overlay">
          <h3>${item.title}</h3>
        </div>
      `
      portfolioGrid.appendChild(portfolioItem)
    })
  }

  // Testimonial Section
  const testimonialText = document.querySelector(".testimonial-text")
  if (testimonialText) {
    testimonialText.textContent = getValue(data, "testimonial.quote")
  }

  const testimonialAuthor = document.querySelector(".testimonial-author")
  if (testimonialAuthor) {
    testimonialAuthor.textContent = getValue(data, "testimonial.author")
  }

  // Stats Section
  const statsGrid = document.querySelector(".stats-grid")
  if (statsGrid && data.stats && data.stats.items) {
    statsGrid.innerHTML = ""
    data.stats.items.forEach((stat) => {
      const statCard = document.createElement("div")
      statCard.className = "stat-card"
      statCard.innerHTML = `
        <h3>${stat.value}</h3>
        <p>${stat.label}</p>
      `
      statsGrid.appendChild(statCard)
    })
  }

  // Contact Section
  const contactTitle = document.querySelector(".contact .section-header h2")
  if (contactTitle) {
    contactTitle.textContent = getValue(data, "contact.title")
  }

  const contactSubtitle = document.querySelector(".contact .section-header p")
  if (contactSubtitle) {
    contactSubtitle.textContent = getValue(data, "contact.subtitle")
  }

  const contactInfo = document.querySelector(".contact-info")
  if (contactInfo && data.contact && data.contact.info) {
    contactInfo.innerHTML = ""
    data.contact.info.forEach((item) => {
      const contactItem = document.createElement("div")
      contactItem.className = "contact-item"
      contactItem.innerHTML = `
        <div class="icon">${item.icon}</div>
        <p>${item.text}</p>
      `
      contactInfo.appendChild(contactItem)
    })
  }

  const contactForm = document.getElementById("contactForm")
  if (contactForm && data.contact && data.contact.form) {
    contactForm.action = data.contact.form.action
  }

  // Footer
  const footerLogo = document.querySelector(".footer-logo h2")
  if (footerLogo) {
    footerLogo.innerHTML = getValue(data, "footer.logo")
  }

  const footerDescription = document.querySelector(".footer-logo p")
  if (footerDescription) {
    footerDescription.textContent = getValue(data, "footer.description")
  }

  const footerSocialTitle = document.querySelector(".footer-social h3")
  if (footerSocialTitle && data.footer && data.footer.social) {
    footerSocialTitle.textContent = data.footer.social.title
  }

  const socialIcons = document.querySelector(".social-icons")
  if (socialIcons && data.footer && data.footer.social && data.footer.social.icons) {
    socialIcons.innerHTML = ""
    data.footer.social.icons.forEach((icon) => {
      const a = document.createElement("a")
      a.href = icon.url
      a.className = `social-icon ${icon.type}`
      socialIcons.appendChild(a)
    })
  }

  const copyright = document.querySelector(".footer-bottom p")
  if (copyright) {
    copyright.innerHTML = getValue(data, "footer.copyright")
  }

  // Notification
  const notification = document.querySelector(".notification p")
  if (notification) {
    notification.textContent = getValue(data, "notification.message")
  }

  // Re-initialize animations
  initializeAnimations()
}

// Remove the initializeFooterNavigation function since we're now adding event listeners directly
// Remove the initializeSmoothScrolling function since we're now adding event listeners directly

/**
 * Initialize animations for the website
 */
function initializeAnimations() {
  // Set up scroll animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show-animation")
        }
      })
    },
    {
      threshold: 0.1,
    },
  )

  // Observe all sections
  document.querySelectorAll("section").forEach((section) => {
    section.classList.add("fade-in")
    observer.observe(section)
  })

  // Add animation classes
  document.querySelectorAll(".service-card, .stat-card, .phone-mockup, .portfolio-item").forEach((element) => {
    element.classList.add("fade-up")
    observer.observe(element)
  })
}

/**
 * Load the markdown content and populate the website
 */
async function loadContent() {
  try {
    const response = await fetch("./content/content.md")
    if (!response.ok) {
      throw new Error(`Failed to fetch markdown file: ${response.status}`)
    }

    const markdown = await response.text()
    const data = parseFrontMatter(markdown)

    populateWebsite(data)

    // Fix for mobile menu toggle
    const menuToggle = document.querySelector(".menu-toggle")
    const nav = document.querySelector("nav")

    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        menuToggle.classList.toggle("active")
        nav.classList.toggle("active")
      })
    }

    // Close mobile menu when clicking on a nav link
    const navLinks = document.querySelectorAll("nav ul li a")

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (menuToggle && menuToggle.classList.contains("active")) {
          menuToggle.classList.remove("active")
          nav.classList.remove("active")
        }
      })
    })
  } catch (error) {
    console.error("Error loading content:", error)
    showNotification("Error loading content. Please try again later.")
  }
}

/**
 * Show a notification message
 * @param {string} message - The message to show
 */
function showNotification(message = "Thanks for reaching out! We'll get back to you soon.") {
  const notification = document.getElementById("notification")
  if (!notification) return

  // Update notification message if it has a p element
  const notificationP = notification.querySelector("p")
  if (notificationP) {
    notificationP.textContent = message
  }

  // Show notification
  notification.classList.add("show")

  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

// Export functions for use in the main HTML file
window.contentLoader = {
  loadContent,
  showNotification,
}
