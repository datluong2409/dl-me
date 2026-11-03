import { useState } from 'react'
import { profile } from '../content/profile'
import type { PhotoSlot } from '../content/profile'
import { useLang } from '../i18n/LangProvider'

/**
 * Shows the photo set for `slot` in src/content/profile.ts, or a labelled placeholder frame until one is added
 * (or when the image fails to load). `aspect` is a Tailwind aspect-ratio class so the box never shifts layout.
 */
export function Photo({
  slot,
  aspect,
  eager = false,
  className = '',
}: {
  slot: PhotoSlot
  aspect: string
  eager?: boolean
  className?: string
}) {
  const { t, tr } = useLang()
  const asset = profile.photos[slot]
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const box = `w-full rounded-xl ${aspect} ${className}`.trim()

  if (!asset || failedSrc === asset.src) {
    return (
      <div
        role="img"
        aria-label={`${tr('photo.label')}: ${slot}`}
        className={`${box} grid place-items-center border border-dashed border-border bg-surface font-mono text-xs text-fg-muted`}
      >
        {tr('photo.label')} · {slot}
      </div>
    )
  }

  return (
    <img
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={t(asset.alt)}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailedSrc(asset.src)}
      className={`${box} object-cover`}
    />
  )
}
