import html2canvas from "html2canvas"

/**
 * Captures an HTML element as an image and downloads it
 * @param elementId The ID of the element to capture
 * @param fileName The name of the downloaded file
 */
export async function downloadChartAsImage(elementId: string, fileName: string): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error(`Element with ID "${elementId}" not found`)
      return
    }

    // Show a temporary message that we're preparing the download
    const downloadingMessage = document.createElement("div")
    downloadingMessage.className = "fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50"
    downloadingMessage.textContent = "Preparing chart for download..."
    document.body.appendChild(downloadingMessage)

    // Use html2canvas to capture the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      backgroundColor: null, // Transparent background
      logging: false,
      useCORS: true, // Enable CORS for images
    })

    // Remove the message
    document.body.removeChild(downloadingMessage)

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to convert canvas to blob")
        return
      }

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${fileName}.png`
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, "image/png")
  } catch (error) {
    console.error("Error downloading chart:", error)
  }
}

/**
 * Creates a unique ID for a chart element
 * @param prefix The prefix for the ID
 * @returns A unique ID string
 */
export function generateChartId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}
