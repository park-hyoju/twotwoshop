import { useEffect, useRef, useState } from 'react'
import {
  addRecentSearch,
  clearRecentSearches,
  ENABLE_POPULAR_SEARCH,
  getRecentSearches,
  POPULAR_SEARCH_KEYWORDS,
  removeRecentSearch,
} from '../../lib/search'

interface SearchSuggestionsProps {
  visible: boolean
  onSelect: (keyword: string) => void
}

export function SearchSuggestions({ visible, onSelect }: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const wasVisibleRef = useRef(false)

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setRecentSearches(getRecentSearches())
    }

    wasVisibleRef.current = visible
  }, [visible])

  if (!visible) {
    return null
  }

  function handleRemoveRecent(keyword: string) {
    setRecentSearches(removeRecentSearch(keyword))
  }

  function handleClearRecent() {
    setRecentSearches(clearRecentSearches())
  }

  const showPopularSearch = ENABLE_POPULAR_SEARCH && POPULAR_SEARCH_KEYWORDS.length > 0

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
      <div className="max-h-[min(16rem,calc(100vh-10rem))] overflow-y-auto px-3 py-2.5 sm:px-3.5 sm:py-3">
        {showPopularSearch && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              인기 검색어
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {POPULAR_SEARCH_KEYWORDS.map((keyword, index) => (
                <li key={keyword}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onSelect(keyword)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-white"
                  >
                    <span className="text-[11px] font-semibold text-neutral-400">{index + 1}</span>
                    <span>{keyword}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recentSearches.length > 0 ? (
          <section className={showPopularSearch ? 'mt-4' : undefined}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                최근 검색어
              </h3>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleClearRecent}
                className="text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-800"
              >
                전체 삭제
              </button>
            </div>
            <ul className="mt-1.5 flex flex-col">
              {recentSearches.map((keyword) => (
                <li key={keyword}>
                  <div className="flex items-center gap-1 rounded-lg px-0.5 transition-colors hover:bg-neutral-50">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onSelect(keyword)}
                      className="min-w-0 flex-1 truncate py-1.5 text-left text-sm text-neutral-800"
                    >
                      {keyword}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleRemoveRecent(keyword)}
                      className="inline-flex min-h-7 min-w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label={`${keyword} 최근 검색어 삭제`}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          !showPopularSearch && (
            <div className="px-1 py-2 text-center">
              <p className="text-sm font-medium text-neutral-800">최근 검색어가 없습니다.</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                상품명을 검색해 원하는 상품을 찾아보세요.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export function saveRecentSearch(keyword: string): void {
  addRecentSearch(keyword)
}
