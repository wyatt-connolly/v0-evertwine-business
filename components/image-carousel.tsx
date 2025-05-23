"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageCarouselProps {
  images: string[]
  onRemoveImage?: (index: number) => void
  editable?: boolean
}

export function ImageCarousel({ images, onRemoveImage, editable = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-video w-full bg-gray-200 flex items-center justify-center rounded-t-lg">
        <span className="text-gray-400">No images available</span>
      </div>
    )
  }

  const goToPrevious = () => {
    const isFirstImage = currentIndex === 0
    const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
  }

  const goToNext = () => {
    const isLastImage = currentIndex === images.length - 1
    const newIndex = isLastImage ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative aspect-video w-full">
      <div className="absolute inset-0">
        <img
          src={images[currentIndex] || "/placeholder.svg"}
          alt={`Promotion image ${currentIndex + 1}`}
          className="w-full h-full object-cover rounded-t-lg"
        />
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-between p-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, index) => (
              <button
                type="button"
                key={index}
                className={`h-2 w-2 rounded-full ${index === currentIndex ? "bg-white" : "bg-white/50"} transition-all`}
                onClick={() => goToImage(index)}
              />
            ))}
          </div>
        </>
      )}

      {editable && onRemoveImage && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 rounded-full"
          onClick={() => onRemoveImage(currentIndex)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
