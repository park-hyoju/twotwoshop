export interface AdminMemberRow {
  /** Profile id — for React keys / internal use only; never display on UI. */
  id: string
  loginId: string | null
  name: string | null
  phone: string | null
  optionalEmail: string | null
  createdAt: string
  hasOrder: boolean
}
