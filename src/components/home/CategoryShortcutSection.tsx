import { Section } from '../common/Section'
import { CategoryCard } from './CategoryCard'
import type { CategoryShortcut } from '../../types/category'

interface CategoryShortcutSectionProps {
  categories: CategoryShortcut[]
}

export function CategoryShortcutSection({ categories }: CategoryShortcutSectionProps) {
  return (
    <Section ariaLabel="카테고리">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-xl font-semibold tracking-tight text-[#111] sm:text-2xl">
          카테고리
        </h2>
        <p className="mt-2 text-sm text-[#888] sm:text-base">원하는 스타일을 빠르게 찾아보세요</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard category={category} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
