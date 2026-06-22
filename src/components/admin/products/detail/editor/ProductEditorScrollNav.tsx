import { useEffect, useState } from 'react'
import {
  isSectionComplete,
  PRODUCT_EDITOR_SECTIONS,
  type ProductEditorSectionId,
} from './productEditorSections'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'

interface ProductEditorScrollNavProps {
  form: AdminProductDetailForm
  activeSection: ProductEditorSectionId
  onSectionClick: (sectionId: ProductEditorSectionId) => void
}

export function ProductEditorScrollNav({
  form,
  activeSection,
  onSectionClick,
}: ProductEditorScrollNavProps) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-white lg:block xl:w-64">
      <nav aria-label="상품 등록 단계" className="sticky top-0 px-4 py-6">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          상품 등록
        </p>
        <ul className="space-y-1">
          {PRODUCT_EDITOR_SECTIONS.map((section) => {
            const isActive = activeSection === section.id
            const isComplete = isSectionComplete(section.id, form)

            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSectionClick(section.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-neutral-900 font-bold text-white'
                      : 'font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {section.step}
                  </span>
                  <span className="flex-1">{section.label}</span>
                  {isComplete && (
                    <span
                      className={`text-xs ${isActive ? 'text-emerald-300' : 'text-emerald-600'}`}
                      aria-label="완료"
                    >
                      ✔
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export function useActiveEditorSection(enabled = true, rootSelector = '[data-editor-section]') {
  const [activeSection, setActiveSection] = useState<ProductEditorSectionId>('photos')

  useEffect(() => {
    if (!enabled) {
      return
    }

    const sections = document.querySelectorAll<HTMLElement>(rootSelector)
    if (sections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const topEntry = visible[0]
        if (!topEntry) {
          return
        }

        const sectionId = topEntry.target.getAttribute('data-section-id') as ProductEditorSectionId
        if (sectionId) {
          setActiveSection(sectionId)
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.3, 0.6] },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [enabled, rootSelector])

  function scrollToSection(sectionId: ProductEditorSectionId) {
    const element = document.querySelector(`[data-section-id="${sectionId}"]`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return { activeSection, scrollToSection }
}
