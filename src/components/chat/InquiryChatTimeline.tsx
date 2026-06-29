import { useEffect, useRef } from 'react'
import type { InquiryChatTimelineItem } from '../../lib/inquiryChatTimeline'
import { InquiryChatBubble, type InquiryChatPerspective } from './InquiryChatBubble'

interface InquiryChatTimelineProps {
  items: InquiryChatTimelineItem[]
  perspective: InquiryChatPerspective
  onImageClick?: (url: string) => void
  className?: string
}

export function InquiryChatTimeline({
  items,
  perspective,
  onImageClick,
  className = '',
}: InquiryChatTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isFirstRender.current ? 'auto' : 'smooth',
    })
    isFirstRender.current = false
  }, [items.length, items[items.length - 1]?.id])

  if (items.length === 0) {
    return (
      <div className={`flex flex-1 items-center justify-center py-8 ${className}`}>
        <p className="text-sm text-neutral-500">아직 대화가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2.5 overflow-x-hidden ${className}`}>
      {items.map((item) => (
        <InquiryChatBubble
          key={item.id}
          sender={item.sender}
          perspective={perspective}
          message={item.message}
          imageUrls={item.image_urls}
          createdAt={item.created_at}
          onImageClick={onImageClick}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
