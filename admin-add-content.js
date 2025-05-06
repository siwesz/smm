// This file contains functions to add new content to the website

// Mock declarations for variables that are assumed to be imported or declared elsewhere
const editableContent = {}
const contentSections = []
function loadSectionEditor(section) {
  console.warn("loadSectionEditor function is not implemented. Section:", section)
}

// Function to add a new text element
function addNewTextElement(sectionId, elementType = "p") {
  const sectionContent = editableContent[sectionId]
  if (!sectionContent) return

  // Create a new text element
  const newText = {
    id: `text-${Date.now()}`,
    element: elementType,
    content: "New text content",
    path: `new-${Date.now()}`, // This will be replaced when saving
    isNew: true,
  }

  // Add to the section's texts array
  if (!sectionContent.texts) {
    sectionContent.texts = []
  }
  sectionContent.texts.push(newText)

  // Reload the section editor to show the new element
  const section = contentSections.find((s) => s.id === sectionId)
  if (section) {
    loadSectionEditor(section)
  }
}

// Function to add a new image
function addNewImage(sectionId) {
  const sectionContent = editableContent[sectionId]
  if (!sectionContent) return

  // Create a new image element
  const newImage = {
    id: `image-${Date.now()}`,
    src: "https://via.placeholder.com/300x200?text=New+Image",
    alt: "New image",
    path: `new-${Date.now()}`, // This will be replaced when saving
    isNew: true,
  }

  // Add to the section's images array
  if (!sectionContent.images) {
    sectionContent.images = []
  }
  sectionContent.images.push(newImage)

  // Reload the section editor to show the new element
  const section = contentSections.find((s) => s.id === sectionId)
  if (section) {
    loadSectionEditor(section)
  }
}

// Function to add a new link
function addNewLink(sectionId) {
  const sectionContent = editableContent[sectionId]
  if (!sectionContent) return

  // Create a new link element
  const newLink = {
    id: `link-${Date.now()}`,
    href: "#",
    text: "New Link",
    path: `new-${Date.now()}`, // This will be replaced when saving
    isNew: true,
  }

  // Add to the section's links array
  if (!sectionContent.links) {
    sectionContent.links = []
  }
  sectionContent.links.push(newLink)

  // Reload the section editor to show the new element
  const section = contentSections.find((s) => s.id === sectionId)
  if (section) {
    loadSectionEditor(section)
  }
}

// Function to handle adding new elements to the HTML when saving
function applyNewElementsToHTML(doc) {
  // For each section with new elements
  Object.keys(editableContent).forEach((sectionId) => {
    const section = contentSections.find((s) => s.id === sectionId)
    if (!section) return

    const sectionElement = doc.querySelector(section.selector)
    if (!sectionElement) return

    const sectionContent = editableContent[sectionId]

    // Add new text elements
    if (sectionContent.texts) {
      sectionContent.texts.forEach((text) => {
        if (text.isNew) {
          // Create the new element
          const newElement = doc.createElement(text.element)
          newElement.textContent = text.content
          newElement.className = "admin-added-content"

          // Add a data attribute to mark this as admin-added content
          newElement.setAttribute("data-admin-added", "true")
          newElement.setAttribute("data-admin-added-time", new Date().toISOString())

          // Add it to the section - append to the end to avoid disrupting layout
          // Find a suitable container within the section
          const container = sectionElement.querySelector(".container") || sectionElement
          container.appendChild(newElement)

          // Update the path to the actual DOM path
          text.path = `[data-admin-added="true"][data-admin-added-time="${newElement.getAttribute("data-admin-added-time")}"]`
          text.isNew = false
        }
      })
    }

    // Add new images
    if (sectionContent.images) {
      sectionContent.images.forEach((image) => {
        if (image.isNew) {
          // Create the new element
          const newElement = doc.createElement("img")
          newElement.src = image.src
          newElement.alt = image.alt
          newElement.className = "admin-added-image"

          // Add a data attribute to mark this as admin-added content
          newElement.setAttribute("data-admin-added", "true")
          newElement.setAttribute("data-admin-added-time", new Date().toISOString())

          // Add it to the section - append to the end to avoid disrupting layout
          // Find a suitable container within the section
          const container = sectionElement.querySelector(".container") || sectionElement
          container.appendChild(newElement)

          // Update the path to the actual DOM path
          image.path = `[data-admin-added="true"][data-admin-added-time="${newElement.getAttribute("data-admin-added-time")}"]`
          image.isNew = false
        }
      })
    }

    // Add new links
    if (sectionContent.links) {
      sectionContent.links.forEach((link) => {
        if (link.isNew) {
          // Create the new element
          const newElement = doc.createElement("a")
          newElement.href = link.href
          newElement.textContent = link.text
          newElement.className = "admin-added-link"

          // Add a data attribute to mark this as admin-added content
          newElement.setAttribute("data-admin-added", "true")
          newElement.setAttribute("data-admin-added-time", new Date().toISOString())

          // Add it to the section - append to the end to avoid disrupting layout
          // Find a suitable container within the section
          const container = sectionElement.querySelector(".container") || sectionElement
          container.appendChild(newElement)

          // Update the path to the actual DOM path
          link.path = `[data-admin-added="true"][data-admin-added-time="${newElement.getAttribute("data-admin-added-time")}"]`
          link.isNew = false
        }
      })
    }
  })

  return doc
}
