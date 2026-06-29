export interface InquiryChatTimelineItem {
  id: string
  sender: 'customer' | 'admin'
  message: string
  image_urls: string[]
  created_at: string
}

interface BuildInquiryChatTimelineInput {
  inquiryId: string
  initialMessage: string
  initialImageUrls: string[]
  initialCreatedAt: string
  adminReply: string | null
  updatedAt: string
  messages: InquiryChatTimelineItem[]
}

export function buildInquiryChatTimeline(
  input: BuildInquiryChatTimelineInput,
): InquiryChatTimelineItem[] {
  const items = input.messages.map((message) => ({ ...message }))

  if (
    input.adminReply &&
    !items.some((item) => item.sender === 'admin' && item.message === input.adminReply)
  ) {
    items.push({
      id: `admin-reply-${input.inquiryId}`,
      sender: 'admin',
      message: input.adminReply,
      image_urls: [],
      created_at: input.updatedAt,
    })
  }

  if (
    input.initialMessage &&
    !items.some(
      (item) => item.sender === 'customer' && item.message === input.initialMessage,
    )
  ) {
    items.unshift({
      id: `initial-${input.inquiryId}`,
      sender: 'customer',
      message: input.initialMessage,
      image_urls: input.initialImageUrls,
      created_at: input.initialCreatedAt,
    })
  }

  return items.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}
