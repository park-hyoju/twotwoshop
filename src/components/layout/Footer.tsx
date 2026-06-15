const FOOTER_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'New', href: '#' },
  { label: 'Best', href: '#' },
  { label: 'Live', href: '#' },
  { label: 'Contact', href: '#' },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold tracking-widest text-neutral-900">
              TWOTWOSHOP
            </p>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              트렌디한 의류를 만나보세요.
            </p>
          </div>

          <nav aria-label="푸터 메뉴">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {FOOTER_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <p className="text-center text-xs text-neutral-400 sm:text-left">
            © {currentYear} TWOTWOSHOP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
