import { Link } from 'react-router-dom'
import type { CategoryShortcut } from '../../types/category'
import { HomeCategoryIcon } from './homeIcons'

interface CategoryCardProps {
  category: CategoryShortcut
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={category.href}
      className="group flex flex-col items-center justify-center gap-3 rounded-[20px] border border-[#eee] bg-white px-4 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] active:scale-[0.98] sm:py-9"
    >
      <span className="flex h-10 w-10 items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <HomeCategoryIcon icon={category.icon} size={36} className="text-[#111]" />
      </span>
      <div className="space-y-1">
        <span className="block text-[15px] font-semibold tracking-tight text-[#111] sm:text-base">
          {category.label}
        </span>
        <span className="block text-[11px] font-medium tracking-[0.14em] text-[#999]">
          {category.labelEn}
        </span>
      </div>
    </Link>
  )
}
