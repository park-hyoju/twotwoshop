import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { NoticeRow, StorefrontNotice } from '../types/notice'

export class NoticeRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'NoticeRepositoryError'
    this.cause = cause
  }
}

function mapRow(row: NoticeRow): StorefrontNotice {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const NOTICE_SELECT =
  'id, title, content, is_pinned, is_active, sort_order, created_at, updated_at'

export const noticeRepository = {
  async findActiveNotices(): Promise<StorefrontNotice[]> {
    if (!isSupabaseConfigured || !supabase) {
      return []
    }

    const { data, error } = await supabase
      .from('notices')
      .select(NOTICE_SELECT)
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw new NoticeRepositoryError('공지사항을 불러오지 못했습니다.', error)
    }

    return (data as NoticeRow[]).map(mapRow)
  },

  async findActiveNoticeById(noticeId: string): Promise<StorefrontNotice | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null
    }

    const { data, error } = await supabase
      .from('notices')
      .select(NOTICE_SELECT)
      .eq('id', noticeId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw new NoticeRepositoryError('공지사항을 불러오지 못했습니다.', error)
    }

    if (!data) {
      return null
    }

    return mapRow(data as NoticeRow)
  },
}
