"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LightboxProps {
  images: Array<{
    url: string
    name: string
    alt?: string
  }>
  currentIndex: number
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  showNavigation?: boolean
}

export function Lightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  showNavigation = true,
}: LightboxProps) {
  const currentImage = images[currentIndex]

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" && onNext) onNext()
      if (e.key === "ArrowLeft" && onPrevious) onPrevious()
    }

    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [onClose, onNext, onPrevious])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = currentImage.url
    link.download = currentImage.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-16 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation()
          handleDownload()
        }}
      >
        <Download className="h-6 w-6" />
      </Button>

      {/* Navigation Buttons */}
      {showNavigation && images.length > 1 && (
        <>
          {onPrevious && currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                onPrevious()
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {onNext && currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </>
      )}

      {/* Image Container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={currentImage.url}
            alt={currentImage.alt || currentImage.name}
            width={1920}
            height={1080}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Image Info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg">
        <p className="text-sm font-medium">{currentImage.name}</p>
        {showNavigation && images.length > 1 && (
          <p className="text-xs text-white/70 text-center mt-1">
            {currentIndex + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  )
}
