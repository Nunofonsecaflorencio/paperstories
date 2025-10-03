"use client"

import { useState } from "react"
import type { ImageData } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ZoomIn, RotateCw } from "lucide-react"

interface ImageCropModalProps {
  image: ImageData
  onSave: (image: ImageData) => void
  onClose: () => void
}

export function ImageCropModal({ image, onSave, onClose }: ImageCropModalProps) {
  const [crop, setCrop] = useState(image.crop)

  const handleSave = () => {
    onSave({ ...image, crop })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={image.url || "/placeholder.svg"}
              alt="Crop preview"
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${crop.zoom}) rotate(${crop.rotation}deg)`,
                objectPosition: `${crop.x}% ${crop.y}%`,
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Zoom</Label>
              </div>
              <Slider
                value={[crop.zoom]}
                onValueChange={([value]) => setCrop({ ...crop, zoom: value })}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Rotation</Label>
              </div>
              <Slider
                value={[crop.rotation]}
                onValueChange={([value]) => setCrop({ ...crop, rotation: value })}
                min={-180}
                max={180}
                step={1}
              />
            </div>

            {/* Position X */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Horizontal Position</Label>
              <Slider
                value={[crop.x]}
                onValueChange={([value]) => setCrop({ ...crop, x: value })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Position Y */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vertical Position</Label>
              <Slider
                value={[crop.y]}
                onValueChange={([value]) => setCrop({ ...crop, y: value })}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
