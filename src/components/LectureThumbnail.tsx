"use client"

import { useState, type ComponentProps } from "react"
import { DEFAULT_LECTURE_THUMBNAIL, isYouTubePlaceholder, normalizeThumbnailUrl } from "@/lib/youtube"

type Props = Omit<ComponentProps<"img">, "src" | "onError" | "onLoad"> & {
  src?: string | null
}

export function LectureThumbnail({ src, alt = "", ...props }: Props) {
  const source = normalizeThumbnailUrl(src)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const resolvedSource = failedSource === source ? DEFAULT_LECTURE_THUMBNAIL : source

  return (
    // Keep native images for the existing arbitrary remote thumbnail URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      key={source}
      src={resolvedSource}
      alt={alt}
      onError={() => {
        if (resolvedSource !== DEFAULT_LECTURE_THUMBNAIL) setFailedSource(source)
        else console.error("Could not load the default lecture thumbnail.")
      }}
      onLoad={(event) => {
        const image = event.currentTarget
        if (isYouTubePlaceholder(resolvedSource, image.naturalWidth, image.naturalHeight)) {
          setFailedSource(source)
        }
      }}
    />
  )
}
