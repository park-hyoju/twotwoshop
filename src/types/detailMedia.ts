export type DetailMediaType = 'image' | 'video'

export interface DetailMediaItem {
  type: DetailMediaType
  url: string
  order: number
  filename: string
  thumbnail?: string | null
  duration?: number | null
  width?: number | null
  height?: number | null
}
