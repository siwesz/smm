// This file handles the content management functionality
// It's separated from admin.js for better organization

class ContentManager {
  constructor(config) {
    this.config = config
    this.accessToken = localStorage.getItem("github_access_token")
    this.websiteContent = null
    this.originalContent = null
    this.editableContent = {}
  }

  // Load website content from GitHub
  async loadContent() {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.contentFile}?ref=${this.config.mainBranch}`,
        {
          headers: {
            Authorization: `token ${this.accessToken}`,
            Accept: "application/vnd.github.v3.raw",
          },
        },
      )

      if (!response.ok) {
        throw new Error("Failed to fetch website content")
      }

      const content = await response.text()
      this.websiteContent = content
      this.originalContent = content

      return content
    } catch (error) {
      console.error("Error loading content:", error)
      throw error
    }
  }

  // Parse HTML content to extract editable elements
  parseContent(contentSections) {
    // Create a temporary DOM parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(this.websiteContent, "text/html")

    // Extract editable content for each section
    contentSections.forEach((section) => {
      const sectionElement = doc.querySelector(section.selector)
      if (sectionElement) {
        this.editableContent[section.id] = {
          texts: this.extractTextContent(sectionElement),
          images: this.extractImageContent(sectionElement),
          links: this.extractLinkContent(sectionElement),
        }
      }
    })

    return this.editableContent
  }

  // Extract text content from a section
  extractTextContent(element) {
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
        path: this.getElementPath(el),
      })
    })

    return texts
  }

  // Extract image content from a section
  extractImageContent(element) {
    const images = []

    // Get all images
    const imageElements = element.querySelectorAll("img")

    imageElements.forEach((el, index) => {
      images.push({
        id: `image-${index}`,
        src: el.getAttribute("src"),
        alt: el.getAttribute("alt") || "",
        path: this.getElementPath(el),
      })
    })

    return images
  }

  // Extract link content from a section
  extractLinkContent(element) {
    const links = []

    // Get all links
    const linkElements = element.querySelectorAll("a")

    linkElements.forEach((el, index) => {
      links.push({
        id: `link-${index}`,
        href: el.getAttribute("href"),
        text: el.textContent.trim(),
        path: this.getElementPath(el),
      })
    })

    return links
  }

  // Get a unique path to an element for later identification
  getElementPath(el) {
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

  // Apply changes to HTML content
  applyChanges() {
    // Create a temporary DOM parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(this.websiteContent, "text/html")

    // Apply changes for each section
    Object.keys(this.editableContent).forEach((sectionId) => {
      const sectionSelector = this.config.contentSections.find((s) => s.id === sectionId)?.selector
      if (!sectionSelector) return

      const sectionElement = doc.querySelector(sectionSelector)
      if (!sectionElement) return

      const sectionContent = this.editableContent[sectionId]

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
  async saveChanges() {
    const updatedContent = this.applyChanges()

    try {
      // First, get the current file to get its SHA
      const fileResponse = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.contentFile}`,
        {
          headers: {
            Authorization: `token ${this.accessToken}`,
          },
        },
      )

      const fileData = await fileResponse.json()

      // Now update the file with the new content
      const updateResponse = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.contentFile}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Update website content via admin panel",
            content: btoa(unescape(encodeURIComponent(updatedContent))),
            sha: fileData.sha,
            branch: this.config.mainBranch,
          }),
        },
      )

      if (!updateResponse.ok) {
        throw new Error("Failed to save changes")
      }

      this.websiteContent = updatedContent
      return true
    } catch (error) {
      console.error("Error saving changes:", error)
      throw error
    }
  }
}
