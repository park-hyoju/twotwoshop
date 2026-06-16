import { Link } from 'react-router-dom'
import type { CategoryShortcut } from '../../types/category'

interface CategoryCardProps {
  category: CategoryShortcut
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={category.href}
      className="group flex flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-8 text-center transition-all hover:border-neutral-400 hover:bg-neutral-50 hover:shadow-md active:scale-[0.98] active:bg-neutral-100 sm:px-5 sm:py-10"
    >
      <span
        className="text-4xl transition-transform group-hover:scale-110 sm:text-5xl"
        aria-hidden="true"
      >
        {category.icon}
      </span>
      <div className="space-y-1.5">
        <span className="block text-base font-semibold text-neutral-900 sm:text-lg">
          {category.label}
        </span>
        <span className="block text-sm leading-snug text-neutral-500">
          {category.description}
        </span>
      </div>
    </Link>
  )
}
