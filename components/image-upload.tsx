"use client"

import type React from "react"

import { useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ImageData } from "@/app/page"
import { Upload, X, ImageIcon } from "lucide-react"
import exifr from "exifr"

interface ImageUploadProps {
  images: ImageData[]
  onImagesChange: (images: ImageData[]) => void
}

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const newImages: ImageData[] = await Promise.all(
      files.map(async (file) => {
        const url = URL.createObjectURL(file)

        // Extract EXIF metadata
        const metadata: ImageData["metadata"] = {}
        try {
          const exif = await exifr.parse(file)
          if (exif) {
            metadata.dateTime = exif.DateTimeOriginal || exif.DateTime || exif.CreateDate
          }
        } catch (error) {
          console.log("[v0] Could not extract EXIF data:", error)
        }

        // Get image dimensions to calculate original aspect ratio
        const img = await loadImageDimensions(url)
        metadata.width = img.width
        metadata.height = img.height

        // Calculate original aspect ratio
        const aspectRatio = img.width / img.height
        let aspectRatioString = "1:1"

        if (Math.abs(aspectRatio - 1) < 0.1) aspectRatioString = "1:1"
        else if (Math.abs(aspectRatio - 4 / 3) < 0.1) aspectRatioString = "4:3"
        else if (Math.abs(aspectRatio - 3 / 2) < 0.1) aspectRatioString = "3:2"
        else if (Math.abs(aspectRatio - 16 / 9) < 0.1) aspectRatioString = "16:9"
        else if (Math.abs(aspectRatio - 3 / 4) < 0.1) aspectRatioString = "3:4"
        else if (Math.abs(aspectRatio - 2 / 3) < 0.1) aspectRatioString = "2:3"
        else if (Math.abs(aspectRatio - 9 / 16) < 0.1) aspectRatioString = "9:16"
        else if (aspectRatio > 1)
          aspectRatioString = "3:2" // Default landscape
        else aspectRatioString = "2:3" // Default portrait

        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          url,
          metadata,
          aspectRatio: aspectRatioString,
          crop: {
            x: 0,
            y: 0,
            zoom: 1,
            rotation: 0,
          },
        }
      }),
    )

    onImagesChange([...images, ...newImages])
  }

  const removeImage = (id: string) => {
    const image = images.find((img) => img.id === id)
    if (image) {
      URL.revokeObjectURL(image.url)
    }
    onImagesChange(images.filter((img) => img.id !== id))
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-card-foreground">Images</h2>
      </div>

      {/* Upload Button */}
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full gap-2">
        <Upload className="h-4 w-4" />
        Upload Images
      </Button>
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

      {/* Image List */}
      {images.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? "s" : ""} uploaded
          </p>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {images.map((image) => (
              <div key={image.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <img src={image.url || "/placeholder.svg"} alt="Uploaded" className="h-12 w-12 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground truncate">{image.file.name}</p>
                  {image.metadata?.dateTime && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.metadata.dateTime).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImage(image.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="mt-4 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No images uploaded yet</p>
        </div>
      )}
    </Card>
  )
}

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = url
  })
}
