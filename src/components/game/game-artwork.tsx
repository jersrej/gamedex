import Image from "next/image";

import { cn } from "@/lib/utils";

type GameArtworkProps = {
  src: string | null;
  /** Empty when the image is decorative (the title is printed next to it). */
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
  imageClassName?: string;
};

/**
 * Artwork in a box whose aspect ratio is set by the caller, so the layout is
 * reserved before any pixel arrives. A game with no image gets a dithered
 * "no data" bay instead.
 */
export function GameArtwork({
  src,
  alt,
  sizes,
  preload = false,
  className,
  imageClassName,
}: GameArtworkProps) {
  return (
    <div className={cn("relative overflow-hidden bg-background", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          className="dither absolute inset-0 grid place-items-center"
        >
          <span className="pixel bg-background px-2 py-1 text-muted-foreground">
            No image data
          </span>
        </div>
      )}
    </div>
  );
}
