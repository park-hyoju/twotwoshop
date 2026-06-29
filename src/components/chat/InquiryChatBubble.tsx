import { formatChatTime } from '../../lib/formatChatTime'
import { CHAT_BUBBLE_CLASSNAME } from './chatMessengerStyles'
import { InquiryImageGallery } from './InquiryImageGallery'

export type InquiryChatPerspective = 'admin' | 'customer'

interface InquiryChatBubbleProps {
  sender: 'customer' | 'admin'
  perspective: InquiryChatPerspective
  message: string
  imageUrls: string[]
  createdAt: string
  onImageClick?: (url: string) => void
}

export function InquiryChatBubble({
  sender,
  perspective,
  message,
  imageUrls,
  createdAt,
  onImageClick,
}: InquiryChatBubbleProps) {
  const isOwn =
    (perspective === 'admin' && sender === 'admin') ||
    (perspective === 'customer' && sender === 'customer')

  return (
    <div className={`flex w-full flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div
        className={`${CHAT_BUBBLE_CLASSNAME} ${
          isOwn
            ? 'self-end rounded-br-md bg-neutral-900 text-white'
            : 'self-start rounded-bl-md bg-white text-neutral-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
      {imageUrls.length > 0 && (
        <div className={`mt-1.5 max-w-[78%] ${isOwn ? 'self-end' : 'self-start'}`}>
          <InquiryImageGallery imageUrls={imageUrls} size="sm" onImageClick={onImageClick} />
        </div>
      )}
      <time
        dateTime={createdAt}
        className={`mt-1 px-1 text-[11px] text-neutral-400 ${isOwn ? 'text-right' : 'text-left'}`}
      >
        {formatChatTime(createdAt)}
      </time>
    </div>
  )
}
