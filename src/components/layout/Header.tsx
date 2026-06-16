import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { NAV_ITEMS } from '../../data/navigation'
import { useCart } from '../../hooks/useCart'
import { ROUTES } from '../../lib/routes'
import type { NavItem } from '../../types/navigation'

function SearchIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
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
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
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
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
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
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    )
  }

  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
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
      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
  cartCount: number
}

function HeaderActions({ onSearchClick, cartCount }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
        aria-label="검색"
        onClick={onSearchClick}
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
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </Link>
      <Link
        to={ROUTES.login}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
        aria-label="마이페이지"
      >
        <UserIcon />
      </Link>
    </div>
  )
}

interface NavMenuProps {
  variant: 'desktop' | 'mobile'
  onNavigate?: () => void
}

function NavMenu({ variant, onNavigate }: NavMenuProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const toggleCategory = (label: string) => {
    setOpenCategory((prev) => (prev === label ? null : label))
  }

  const handleNavigate = () => {
    setOpenCategory(null)
    onNavigate?.()
  }

  const linkClass =
    variant === 'desktop'
      ? 'block px-4 py-3 text-base text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
      : 'block rounded-lg px-4 py-3 pl-8 text-base text-neutral-700 hover:bg-neutral-100'

  const renderItem = (item: NavItem) => {
    if (!item.children) {
      return (
        <Link
          to={item.href}
          className={
            variant === 'desktop'
              ? 'whitespace-nowrap text-base font-medium text-neutral-700 transition-colors hover:text-neutral-900'
              : 'block rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-100'
          }
          onClick={handleNavigate}
        >
          {item.label}
        </Link>
      )
    }

    const isOpen = openCategory === item.label

    if (variant === 'desktop') {
      return (
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-1 whitespace-nowrap text-base font-medium text-neutral-700 transition-colors hover:text-neutral-900"
            aria-expanded={isOpen}
            aria-haspopup="true"
            onClick={() => toggleCategory(item.label)}
          >
            {item.label}
            <ChevronIcon isOpen={isOpen} />
          </button>

          {isOpen && (
            <ul className="absolute left-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
              <li>
                <Link
                  to={item.href}
                  className={linkClass}
                  onClick={handleNavigate}
                >
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
          className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-100"
          aria-expanded={isOpen}
          onClick={() => toggleCategory(item.label)}
        >
          {item.label}
          <ChevronIcon isOpen={isOpen} />
        </button>

        {isOpen && (
          <ul className="mt-1 flex flex-col gap-1">
            <li>
              <Link
                to={item.href}
                className={linkClass}
                onClick={handleNavigate}
              >
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

  if (variant === 'desktop') {
    return (
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 xl:gap-x-7">
        {NAV_ITEMS.map((item) => (
          <li key={item.label}>{renderItem(item)}</li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <li key={item.label}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const { getCartCount } = useCart()
  const cartCount = getCartCount()
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)

  const handleSearchClick = () => {
    setIsSearchVisible(true)
    requestAnimationFrame(() => {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      if (isDesktop) {
        desktopSearchRef.current?.focus()
      } else {
        mobileSearchRef.current?.focus()
      }
    })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          <Link
            to={ROUTES.home}
            className="shrink-0 text-xl font-bold tracking-widest text-neutral-900 sm:text-2xl"
            translate="no"
          >
            투투샵
          </Link>

          <div className="hidden flex-1 justify-center px-4 md:flex">
            <input
              ref={desktopSearchRef}
              type="search"
              readOnly
              placeholder="검색 기능 준비 중입니다."
              aria-label="상품 검색"
              className="w-full max-w-md rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-700 outline-none focus:border-neutral-400"
            />
          </div>

          <div className="flex items-center gap-1">
            <HeaderActions onSearchClick={handleSearchClick} cartCount={cartCount} />
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 lg:hidden"
              aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <MenuIcon isOpen={isMenuOpen} />
            </button>
          </div>
        </div>

        {isSearchVisible && (
          <div className="pb-3 md:hidden">
            <input
              ref={mobileSearchRef}
              type="search"
              readOnly
              placeholder="검색 기능 준비 중입니다."
              aria-label="상품 검색"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-700 outline-none focus:border-neutral-400"
            />
          </div>
        )}

        <nav
          className="hidden border-t border-neutral-100 py-3 lg:block"
          aria-label="메인 메뉴"
        >
          <NavMenu variant="desktop" />
        </nav>
      </div>

      {isMenuOpen && (
        <nav
          className="border-t border-neutral-200 bg-white px-4 py-4 lg:hidden"
          aria-label="모바일 메뉴"
        >
          <NavMenu variant="mobile" onNavigate={() => setIsMenuOpen(false)} />
        </nav>
      )}
    </header>
  )
}
