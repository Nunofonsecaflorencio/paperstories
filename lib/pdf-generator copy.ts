import { jsPDF } from "jspdf"
import type { ImageData, CollageSettings } from "@/app/page"

const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 215.9, height: 279.4 },
}

const getAspectRatio = (ratio: string) => {
  switch (ratio) {
    case "1:1":
      return 1
    case "4:3":
      return 4 / 3
    case "3:2":
      return 3 / 2
    case "16:9":
      return 16 / 9
    case "2:3":
      return 2 / 3
    case "3:4":
      return 3 / 4
    case "9:16":
      return 9 / 16
    default:
      return 1
  }
}

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

function drawImageScaled(img: HTMLImageElement, ctx: CanvasRenderingContext2D): number[] {
  const canvas = ctx.canvas;
  const hRatio = canvas.width / img.width;
  const vRatio = canvas.height / img.height;
  const ratio = Math.min(hRatio, vRatio);
  const centerShift_x = (canvas.width - img.width * ratio) / 2;
  const centerShift_y = (canvas.height - img.height * ratio) / 2;
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, img.width, img.height,
    centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
  return [centerShift_x, centerShift_y]
}

// Convert mm to px based on PDF internal scale (72 dpi is default in jsPDF)
function mmToPx(mm: number, dpi = 96): number {
  return Math.round((mm / 25.4) * dpi);
}

export async function generatePDF(images: ImageData[], settings: CollageSettings) {
  // Get paper dimensions
  let paperWidth: number
  let paperHeight: number

  if (settings.paperSize === "Custom") {
    paperWidth = settings.customWidth || 210
    paperHeight = settings.customHeight || 297
  } else {
    const size = PAPER_SIZES[settings.paperSize as keyof typeof PAPER_SIZES]
    paperWidth = size.width
    paperHeight = size.height
  }

  // Create PDF
  const pdf = new jsPDF({
    orientation: paperWidth > paperHeight ? "landscape" : "portrait",
    unit: "mm",
    format: [paperWidth, paperHeight],
  })

  const availableWidth = paperWidth
  const availableHeight = paperHeight
  const cellWidth = availableWidth / settings.columns
  const cellHeight = availableHeight / settings.rows

  const captionHeight = settings.showCaptions ? 4 : 0
  const captionSpacing = settings.showCaptions ? 4 : 0

  // Place images
  for (let row = 0; row < settings.rows; row++) {
    for (let col = 0; col < settings.columns; col++) {
      const index = row * settings.columns + col
      const image = images[index]

      if (!image) continue

      const cellX = col * cellWidth
      const cellY = row * cellHeight
      const padding = settings.padding
      const x = cellX + padding
      const y = cellY + padding
      const availableCellWidth = cellWidth - 2 * padding
      const availableCellHeight = cellHeight - 2 * padding - (captionHeight + captionSpacing)

      try {
        // Load image
        const img = await loadImage(image.url)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        // Set canvas size based on aspect ratio
        const aspectRatio = getAspectRatio(image.aspectRatio)
        const targetWidth = mmToPx(availableCellWidth)
        const targetHeight = targetWidth / aspectRatio

        canvas.width = targetWidth
        canvas.height = targetHeight

        // Apply transformations
        ctx.fillStyle = "blue"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // ctx.save()
        // ctx.translate(canvas.width / 2, canvas.height / 2)
        // ctx.rotate((image.crop.rotation * Math.PI) / 180)
        // ctx.scale(image.crop.zoom, image.crop.zoom)

        // const drawWidth = img.width
        // const drawHeight = img.height
        // const offsetX = -(drawWidth / 2) - (image.crop.x / 100) * drawWidth * 0.5
        // const offsetY = -(drawHeight / 2) - (image.crop.y / 100) * drawHeight * 0.5

        // ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        // ctx.restore()
        const [centerShift_x, centerShift_y] = drawImageScaled(img, ctx)

        // Add to PDF
        const imageData = canvas.toDataURL("image/jpeg", 0.95)

        let imgWidth: number
        let imgHeight: number

        if (aspectRatio < 1) {
          // Vertical image - fit to height priority
          imgHeight = availableCellHeight
          imgWidth = imgHeight * aspectRatio

          // If width exceeds available space, scale down
          if (imgWidth > availableCellWidth) {
            imgWidth = availableCellWidth
            imgHeight = imgWidth / aspectRatio
          }
        } else {
          // Horizontal or square image - fit to width priority
          imgWidth = availableCellWidth
          imgHeight = imgWidth / aspectRatio

          // If height exceeds available space, scale down
          if (imgHeight > availableCellHeight) {
            imgHeight = availableCellHeight
            imgWidth = imgHeight * aspectRatio
          }
        }

        // Center in cell
        const imgX = x + (availableCellWidth - imgWidth) / 2
        const imgY = y + (availableCellHeight - imgHeight) / 2


        pdf.addImage(imageData, "JPEG", x, y, imgWidth, imgHeight)

        if (settings.showCaptions) {
          const caption = formatDateTime(image.metadata?.dateTime)
          if (caption) {
            pdf.setFontSize(8)
            pdf.setTextColor(0, 0, 0)
            const captionY = imgY + imgHeight + captionSpacing
            const captionX = imgX + centerShift_x
            pdf.text(caption, captionX, captionY, { align: "center" })
          }
        }
      } catch (error) {
        console.error("[v0] Error processing image:", error)
      }
    }
  }

  // Save PDF
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
