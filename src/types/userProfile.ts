export interface UserProfile {
  id: string
  loginId: string | null
  name: string | null
  phone: string | null
  email: string | null
  optionalEmail: string | null
  createdAt: string
  updatedAt: string
}
