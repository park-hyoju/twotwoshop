import { PlaceholderPage } from '../components/common'

export function LivePage() {
  return (
    <PlaceholderPage
      title="라이브방송"
      description="실시간 방송에서 다양한 상품을 만나보세요."
    />
  )
}

export { CartPage } from './cart/CartPage'

export function LoginPage() {
  return (
    <PlaceholderPage title="로그인" description="회원 로그인 및 마이페이지입니다." />
  )
}

export function NoticesPage() {
  return (
    <PlaceholderPage title="공지사항" description="투투샵의 새로운 소식을 확인하세요." />
  )
}
