import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { MENU_ITEMS } from '../../data/navigation'
import { useCart } from '../../hooks/useCart'
import { useCustomerAuth } from '../../contexts/CustomerAuthProvider'
import { buildProductSearchUrl, normalizeProductSearchQuery } from '../../lib/productSearch'
import { ROUTES } from '../../lib/routes'
import type { NavItem } from '../../types/navigation'
import { ProductSearchField, saveRecentSearch } from '../search'

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  )
}

function MenuIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    )
  }

  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  )
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

interface HeaderActionsProps {
  onSearchClick: () => void
  onDesktopSearchFocus?: () => void
  cartCount: number
  accountHref: string
  accountLabel: string
}

function HeaderActions({
  onSearchClick,
  onDesktopSearchFocus,
  cartCount,
  accountHref,
  accountLabel,
}: HeaderActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
        aria-label="검색"
        onClick={onSearchClick}
      >
        <SearchIcon />
      </button>
      <button
        type="button"
        className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 md:inline-flex"
        aria-label="검색"
        onClick={onDesktopSearchFocus}
      >
        <SearchIcon />
      </button>
      <Link
        to={ROUTES.cart}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
        aria-label={`장바구니${cartCount > 0 ? `, ${cartCount}개 상품` : ''}`}
      >
        <CartIcon />
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Link>
      <Link
        to={accountHref}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
        aria-label={accountLabel}
      >
        <UserIcon />
      </Link>
    </div>
  )
}

interface NavMenuProps {
  variant: 'desktop' | 'mobile' | 'panel'
  items?: NavItem[]
  onNavigate?: () => void
}

function NavMenu({ variant, items = MENU_ITEMS, onNavigate }: NavMenuProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  if (items.length === 0) {
    return null
  }

  const toggleCategory = (label: string) => {
    setOpenCategory((prev) => (prev === label ? null : label))
  }

  const handleNavigate = () => {
    setOpenCategory(null)
    onNavigate?.()
  }

  const linkClass =
    variant === 'desktop'
      ? 'block px-4 py-3 text-[15px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900'
      : variant === 'panel'
        ? 'block rounded-xl px-5 py-3.5 text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-100'
        : 'block rounded-lg px-4 py-3 pl-8 text-base text-neutral-700 hover:bg-neutral-100'

  const topLevelLinkClass =
    variant === 'panel'
      ? 'flex min-h-[52px] items-center rounded-xl px-5 py-3.5 text-[17px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 sm:text-lg'
      : variant === 'desktop'
        ? 'inline-flex h-14 items-center whitespace-nowrap px-1 text-[15px] font-medium text-neutral-800 transition-colors hover:text-neutral-900 sm:text-base'
        : 'block rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-100'

  const categoryToggleClass =
    variant === 'panel'
      ? 'flex min-h-[52px] w-full items-center justify-between rounded-xl px-5 py-3.5 text-left text-[17px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 sm:text-lg'
      : 'flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-100'

  const renderItem = (item: NavItem) => {
    if (!item.children) {
      return (
        <Link to={item.href} className={topLevelLinkClass} onClick={handleNavigate}>
          {item.label}
        </Link>
      )
    }

    const isOpen = openCategory === item.label

    if (variant === 'desktop') {
      return (
        <div className="relative h-14">
          <button
            type="button"
            className="inline-flex h-14 items-center gap-1 whitespace-nowrap px-1 text-[15px] font-medium text-neutral-800 transition-colors hover:text-neutral-900 sm:text-base"
            aria-expanded={isOpen}
            aria-haspopup="true"
            onClick={() => toggleCategory(item.label)}
          >
            {item.label}
            <ChevronIcon isOpen={isOpen} />
          </button>

          {isOpen && (
            <ul className="absolute left-0 top-full z-50 min-w-[168px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg">
              <li>
                <Link to={item.href} className={linkClass} onClick={handleNavigate}>
                  전체
                </Link>
              </li>
              {item.children.map((child) => (
                <li key={child.label}>
                  <Link to={child.href} className={linkClass} onClick={handleNavigate}>
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    }

    return (
      <div>
        <button
          type="button"
          className={categoryToggleClass}
          aria-expanded={isOpen}
          onClick={() => toggleCategory(item.label)}
        >
          {item.label}
          <ChevronIcon isOpen={isOpen} />
        </button>

        {isOpen && (
          <ul
            className={`flex flex-col ${variant === 'panel' ? 'mt-1 gap-1 border-l-2 border-neutral-200 pl-3' : 'mt-1 gap-1'}`}
          >
            <li>
              <Link to={item.href} className={linkClass} onClick={handleNavigate}>
                전체
              </Link>
            </li>
            {item.children.map((child) => (
              <li key={child.label}>
                <Link to={child.href} className={linkClass} onClick={handleNavigate}>
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (variant === 'panel') {
    return (
      <ul className="flex flex-col gap-1.5 sm:gap-2">
        {items.map((item) => (
          <li key={item.label}>{renderItem(item)}</li>
        ))}
      </ul>
    )
  }

  if (variant === 'desktop') {
    return (
      <ul className="flex h-14 items-stretch gap-x-6 lg:gap-x-8">
        {items.map((item) => (
          <li key={item.label} className="flex shrink-0 items-stretch">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.label}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

function AllCategoriesButton({
  isOpen,
  onClick,
  layout,
}: {
  isOpen: boolean
  onClick: () => void
  layout: 'mobile' | 'desktop'
}) {
  if (layout === 'desktop') {
    const stateClass = isOpen
      ? 'border-neutral-800 bg-neutral-900 text-white'
      : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-neutral-300 hover:bg-neutral-100'

    return (
      <button
        type="button"
        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-[15px] font-medium transition-colors ${stateClass}`}
        aria-label={isOpen ? '전체카테고리 메뉴 닫기' : '전체카테고리 메뉴 열기'}
        aria-expanded={isOpen}
        onClick={onClick}
      >
        <MenuIcon isOpen={isOpen} />
        <span className="whitespace-nowrap">전체카테고리</span>
      </button>
    )
  }

  const stateClass = isOpen
    ? 'border-neutral-800 bg-neutral-900 text-white'
    : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50'

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-[15px] font-semibold transition-colors md:hidden ${stateClass}`}
      aria-label={isOpen ? '카테고리 메뉴 닫기' : '카테고리 메뉴 열기'}
      aria-expanded={isOpen}
      onClick={onClick}
    >
      <MenuIcon isOpen={isOpen} />
      <span className="whitespace-nowrap">카테고리</span>
    </button>
  )
}

interface CategoryMenuPanelProps {
  layout: 'mobile' | 'desktop'
  onClose: () => void
}

function CategoryMenuPanel({ layout, onClose }: CategoryMenuPanelProps) {
  if (layout === 'desktop') {
    return (
      <>
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="전체카테고리 닫기"
          onClick={onClose}
        />
        <aside
          className="admin-animate-in fixed inset-y-0 left-0 z-50 flex w-full max-w-[360px] flex-col border-r border-neutral-200 bg-white shadow-2xl"
          aria-label="전체카테고리"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <p className="text-xl font-bold text-neutral-900">전체카테고리</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-xl border border-neutral-200 bg-white px-4 text-[15px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              닫기
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <NavMenu variant="panel" items={MENU_ITEMS} onNavigate={onClose} />
          </div>
        </aside>
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30 md:hidden"
        aria-label="카테고리 닫기"
        onClick={onClose}
      />
      <nav
        className="admin-animate-in relative z-50 border-t border-neutral-200 bg-white shadow-lg md:hidden"
        aria-label="카테고리"
      >
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
            <p className="text-lg font-bold text-neutral-900 sm:text-xl">전체카테고리</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-full bg-neutral-100 px-4 text-[15px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-200"
            >
              닫기
            </button>
          </div>
          <NavMenu variant="panel" items={MENU_ITEMS} onNavigate={onClose} />
        </div>
      </nav>
    </>
  )
}

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isMember, isLoading: isAuthLoading, displayName } = useCustomerAuth()
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const urlSearchQuery = normalizeProductSearchQuery(searchParams.get('search') ?? '')
  const isProductsPage = location.pathname === ROUTES.products

  useEffect(() => {
    setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  useEffect(() => {
    if (!isCategoryMenuOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCategoryMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isCategoryMenuOpen])

  const [categoryMenuLayout, setCategoryMenuLayout] = useState<'mobile' | 'desktop'>('mobile')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')

    function syncLayout() {
      setCategoryMenuLayout(mediaQuery.matches ? 'desktop' : 'mobile')
    }

    function handleViewportChange() {
      syncLayout()
      setIsCategoryMenuOpen(false)
    }

    syncLayout()
    mediaQuery.addEventListener('change', handleViewportChange)
    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  function toggleCategoryMenu() {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    setCategoryMenuLayout(isDesktop ? 'desktop' : 'mobile')
    setIsCategoryMenuOpen((prev) => !prev)
  }

  function closeCategoryMenu() {
    setIsCategoryMenuOpen(false)
  }

  function navigateToSearch(query: string) {
    const normalized = normalizeProductSearchQuery(query)

    if (!normalized) {
      navigate(ROUTES.products)
      return
    }

    navigate(buildProductSearchUrl(normalized))
  }

  function handleSearchSubmit(query: string) {
    const normalized = normalizeProductSearchQuery(query)

    if (normalized) {
      saveRecentSearch(normalized)
    }

    navigateToSearch(query)
    setIsSearchVisible(false)
    closeCategoryMenu()
  }

  function handleDebouncedSearch(query: string) {
    if (!isProductsPage) {
      return
    }

    navigateToSearch(query)
  }

  const handleSearchClick = () => {
    setIsSearchVisible(true)
    requestAnimationFrame(() => {
      mobileSearchRef.current?.focus()
    })
  }

  const handleDesktopSearchFocus = () => {
    desktopSearchRef.current?.focus()
  }

  const accountHref = isMember ? ROUTES.mypage : ROUTES.signin
  const accountLabel = isAuthLoading
    ? '회원 메뉴'
    : isMember
      ? `${displayName ?? '회원'} 마이페이지`
      : '로그인'

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <AllCategoriesButton
              layout="mobile"
              isOpen={isCategoryMenuOpen && categoryMenuLayout === 'mobile'}
              onClick={toggleCategoryMenu}
            />
            <Link
              to={ROUTES.home}
              className="shrink-0 text-xl font-bold tracking-wide text-neutral-900 sm:text-2xl"
              translate="no"
            >
              투투샵
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center px-6 md:flex lg:px-10">
            <ProductSearchField
              inputRef={desktopSearchRef}
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
              onDebouncedSearch={handleDebouncedSearch}
              className="w-full max-w-xl"
              showSubmitButton={false}
            />
          </div>

          <HeaderActions
            onSearchClick={handleSearchClick}
            onDesktopSearchFocus={handleDesktopSearchFocus}
            cartCount={cartCount}
            accountHref={accountHref}
            accountLabel={accountLabel}
          />
        </div>

        {isSearchVisible && (
          <div className="border-t border-neutral-100 px-4 pb-3 pt-3 md:hidden">
            <ProductSearchField
              inputRef={mobileSearchRef}
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
              onDebouncedSearch={handleDebouncedSearch}
            />
          </div>
        )}
      </div>

      <nav
        className="hidden h-14 border-b border-neutral-200 bg-white md:block"
        aria-label="메인 메뉴"
      >
        <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 lg:gap-8 lg:px-8">
          <AllCategoriesButton
            layout="desktop"
            isOpen={isCategoryMenuOpen && categoryMenuLayout === 'desktop'}
            onClick={toggleCategoryMenu}
          />
          <NavMenu variant="desktop" items={MENU_ITEMS} />
        </div>
      </nav>

      {isCategoryMenuOpen && (
        <CategoryMenuPanel layout={categoryMenuLayout} onClose={closeCategoryMenu} />
      )}
    </header>
  )
}
