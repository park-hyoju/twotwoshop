import { Section } from '../common/Section'
import { CategoryCard } from './CategoryCard'
import type { CategoryShortcut } from '../../types/category'

interface CategoryShortcutSectionProps {
  categories: CategoryShortcut[]
}

export function CategoryShortcutSection({ categories }: CategoryShortcutSectionProps) {
  return (
    <Section ariaLabel="카테고리">
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryCard category={category} />
          </li>
        ))}
      </ul>
    </Section>
  )
}
