"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ImageCarouselProps {
  images: string[]
  onRemoveImage?: (index: number) => void
  editable?: boolean
}

export function ImageCarousel({ images, onRemoveImage, editable = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (images.length === 0) {
    return (
      <Card className="aspect-video w-full bg-muted/50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No images available</p>
        </div>
      </Card>
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
    <Card className="relative aspect-video w-full overflow-hidden group">
      <div className="absolute inset-0">
        <img
          src={images[currentIndex] || "/placeholder.svg"}
          alt={`Promotion image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background/90 transition-all duration-200"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background/90 transition-all duration-200"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                type="button"
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? "bg-white shadow-lg scale-125" : "bg-white/60 hover:bg-white/80"
                }`}
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
          className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={() => onRemoveImage(currentIndex)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {images.length > 1 && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md text-xs font-medium border shadow-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </Card>
  )
}
