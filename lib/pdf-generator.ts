import { jsPDF } from "jspdf"
import type { ImageData, CollageSettings } from "@/app/page"


const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return null
  try {
    const date = new Date(dateTime)
    return date
      .toLocaleString("us-US", {
        weekday: "long", // full day name
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // 24-hour format
      })
      .toUpperCase();
  } catch {
    return null
  }
}

export async function generatePDF(images: ImageData[], settings: CollageSettings) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [2480, 3508],
    userUnit: 300
  })

  const docWidth = pdf.internal.pageSize.getWidth()
  const docHeight = pdf.internal.pageSize.getHeight()
  const cellWidth = docWidth / settings.columns
  const cellHeight = docHeight / settings.rows

  // Ensure caption padding is respected
  const captionHeight = settings.showCaptions ? 24 : 0
  const captionSpacing = settings.showCaptions ? 24 : 0
  const minPadding = captionHeight + 2 * captionSpacing
  if (settings.showCaptions && settings.padding < minPadding) {
    settings.padding = minPadding
  }

  for (let row = 0; row < settings.rows; row++) {
    for (let col = 0; col < settings.columns; col++) {
      const index = row * settings.columns + col
      const image = images[index]
      if (!image) continue

      const cellX = col * cellWidth
      const cellY = row * cellHeight
      const padding = settings.padding

      // available space inside the "polaroid frame"
      const availableW = cellWidth - 2 * padding
      const availableH = cellHeight - 2 * padding

      try {
        const img = await loadImage(image.url)

        // Compute scaling
        const hRatio = availableW / img.width
        const vRatio = availableH / img.height
        const ratio = Math.min(hRatio, vRatio)

        const scaledW = img.width * ratio
        const scaledH = img.height * ratio

        console.log([[docWidth, docHeight], [cellWidth, cellHeight], [availableW, availableH], [img.width, img.height], [scaledW, scaledH]])
        // Center image inside cell
        const imgX = cellX + (cellWidth - scaledW) / 2
        const imgY = cellY + padding + (availableH - scaledH) / 2

        // Convert to JPEG for PDF
        const canvas = document.createElement("canvas")
        canvas.width = scaledW
        console.log(scaledW)
        canvas.height = scaledH
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, scaledW, scaledH)
        const imageData = canvas.toDataURL("image/jpeg", 0.95)

        // Place image in PDF
        pdf.addImage(imageData, "JPEG", imgX, imgY, scaledW, scaledH)

        // Add caption if enabled
        if (settings.showCaptions) {
          const caption = formatDateTime(image.metadata?.dateTime)
          if (caption) {
            pdf.setFont("Helvetica", "normal");
            pdf.setFontSize(captionHeight)
            pdf.setTextColor(0, 0, 0)
            const captionX = imgX
            const captionY = imgY + scaledH + 2 * captionSpacing
            pdf.text(caption.replaceAll(", ", " "), captionX, captionY, { align: 'left' })
          }
        }
      } catch (err) {
        console.error("Error processing image:", err)
      }
    }
  }

  pdf.save("paperstories-collage.pdf")
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
