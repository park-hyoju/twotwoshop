import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3 } from 'lucide-react'
import { MyPageEmptyState } from '../../components/mypage/MyPageEmptyState'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import { formatPrice } from '../../lib/formatPrice'
import { getRecentProducts, removeRecentProduct } from '../../lib/recentProducts'
import { ROUTES } from '../../lib/routes'
import type { RecentProductEntry } from '../../types/mypage'

export function MyRecentProductsPage() {
  const [items, setItems] = useState<RecentProductEntry[]>([])

  useEffect(() => {
    setItems(getRecentProducts())
  }, [])

  function handleRemove(slug: string) {
    removeRecentProduct(slug)
    setItems(getRecentProducts())
  }

  return (
    <MyPageShell title="최근 본 상품" description="최근에 확인한 상품을 다시 볼 수 있습니다.">
      {items.length === 0 ? (
        <MyPageEmptyState
          title="최근 본 상품이 없습니다"
          description="상품을 둘러보면 이곳에 최근 본 상품이 저장됩니다."
          actionLabel="쇼핑 계속하기"
          actionHref={ROUTES.products}
          icon={<Clock3 className="h-6 w-6" aria-hidden />}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.slug} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <Link to={`/products/${item.slug}`} className="block">
                <div className="aspect-square overflow-hidden bg-neutral-100">
                  <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="mt-2 text-base font-bold text-neutral-900">{formatPrice(item.price)}</p>
                </div>
              </Link>
              <div className="border-t border-neutral-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleRemove(item.slug)}
                  className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  목록에서 삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MyPageShell>
  )
}
