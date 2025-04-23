/**
 * GitHub API module for interacting with the repository
 */
const GitHubAPI = (() => {
  // Import necessary libraries or declare variables
  const Auth = window.Auth // Assuming Auth is available globally or adjust import accordingly
  const jsyaml = window.jsyaml // Assuming jsyaml is available globally or adjust import accordingly

  // Repository information
  const REPO_OWNER = "siwesz" // GitHub username
  const REPO_NAME = "smm" // Repository name
  const BRANCH = "main" // Default branch name

  // Content file path
  const CONTENT_PATH = "content/content.md"

  /**
   * Get the content file from the repository
   */
  async function getContentFile() {
    const token = Auth.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}?ref=${BRANCH}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`)
      }

      const data = await response.json()
      const content = atob(data.content) // Decode base64 content
      const sha = data.sha // We need this for updating the file later

      return { content, sha }
    } catch (error) {
      console.error("Error fetching content file:", error)
      throw error
    }
  }

  /**
   * Update the content file in the repository
   */
  async function updateContentFile(content, sha) {
    const token = Auth.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Update content via admin panel",
          content: btoa(content), // Encode content to base64
          sha: sha,
          branch: BRANCH,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update content: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating content file:", error)
      throw error
    }
  }

  /**
   * Parse YAML front matter from markdown content
   */
  function parseFrontMatter(markdown) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
    const match = markdown.match(frontMatterRegex)

    if (!match) {
      throw new Error("No front matter found in markdown file")
    }

    const frontMatter = match[1]
    const contentAfterFrontMatter = markdown.replace(frontMatterRegex, "")

    try {
      // Parse YAML using js-yaml library
      const data = jsyaml.load(frontMatter)
      return { data, content: contentAfterFrontMatter }
    } catch (error) {
      console.error("Error parsing YAML:", error)
      throw new Error("Failed to parse YAML front matter")
    }
  }

  /**
   * Generate markdown with YAML front matter
   */
  function generateMarkdown(data, content = "") {
    try {
      // Convert data to YAML using js-yaml library
      const yaml = jsyaml.dump(data)
      return `---\n${yaml}---\n\n${content}`
    } catch (error) {
      console.error("Error generating YAML:", error)
      throw new Error("Failed to generate YAML front matter")
    }
  }

  // Public API
  return {
    getContentFile,
    updateContentFile,
    parseFrontMatter,
    generateMarkdown,
  }
})()
