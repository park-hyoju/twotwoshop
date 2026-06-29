export const MYPAGE_ROUTES = {
  root: '/mypage',
  orders: '/mypage/orders',
  addresses: '/mypage/addresses',
  inquiries: '/mypage/inquiries',
  profile: '/mypage/profile',
  notifications: '/mypage/notifications',
  recent: '/mypage/recent',
} as const

export function mypageInquiryDetailPath(inquiryId: string): string {
  return `${MYPAGE_ROUTES.inquiries}/${inquiryId}`
}
