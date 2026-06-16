import { Link } from 'react-router-dom'
import { FOOTER_LINKS } from '../../../data/footerLinks'
import type { LinkItem } from '../../../types/navigation'

function FooterLink({ item }: { item: LinkItem }) {
  const className = 'whitespace-nowrap transition-colors hover:text-neutral-900'

  if (item.href.startsWith('/')) {
    return (
      <Link to={item.href} className={className}>
        {item.label}
      </Link>
    )
  }

  return (
    <a href={item.href} className={className}>
      {item.label}
    </a>
  )
}

export function FooterNav() {
  return (
    <nav aria-label="푸터 메뉴">
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-neutral-600">
        {FOOTER_LINKS.map((item, index) => (
          <li key={item.label} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-neutral-300" aria-hidden="true">
                |
              </span>
            )}
            <FooterLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
