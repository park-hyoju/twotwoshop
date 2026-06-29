export interface NoticeRow {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StorefrontNotice {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminNoticeFormInput {
  title: string
  content: string
  is_pinned: boolean
  is_active: boolean
}
