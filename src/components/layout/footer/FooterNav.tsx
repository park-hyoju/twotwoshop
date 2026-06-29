import { Link } from 'react-router-dom'
import { FOOTER_LINKS } from '../../../data/footerLinks'
import type { LinkItem } from '../../../types/navigation'

const linkClassName =
  'inline-flex min-h-10 items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900 sm:text-[15px]'

function FooterLink({ item }: { item: LinkItem }) {
  if (item.href.startsWith('/')) {
    return (
      <Link to={item.href} className={linkClassName}>
        {item.label}
      </Link>
    )
  }

  return (
    <a href={item.href} className={linkClassName}>
      {item.label}
    </a>
  )
}

export function FooterNav() {
  return (
    <nav aria-label="푸터 메뉴">
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start sm:gap-x-8">
        {FOOTER_LINKS.map((item) => (
          <li key={item.label}>
            <FooterLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
