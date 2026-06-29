interface InquiryImageGalleryProps {
  imageUrls: string[]
  onImageClick?: (url: string) => void
  size?: 'sm' | 'md'
}

export function InquiryImageGallery({
  imageUrls,
  onImageClick,
  size = 'md',
}: InquiryImageGalleryProps) {
  if (imageUrls.length === 0) {
    return null
  }

  const sizeClassName = size === 'sm' ? 'h-16 w-16' : 'h-20 w-20'

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {imageUrls.map((url) => (
        <button
          key={url}
          type="button"
          onClick={() => onImageClick?.(url)}
          className={`${sizeClassName} overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100`}
        >
          <img src={url} alt="첨부 이미지" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  )
}
