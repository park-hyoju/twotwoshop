import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { normalizeKeyword } from '../../lib/search'
import { SearchSuggestions } from './SearchSuggestions'

interface ProductSearchFieldProps {
  inputRef?: RefObject<HTMLInputElement | null>
  value: string
  onChange: (value: string) => void
  onSubmit: (query: string) => void
  onDebouncedSearch?: (query: string) => void
  className?: string
  showSubmitButton?: boolean
  debounceMs?: number
}

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
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

export function ProductSearchField({
  inputRef,
  value,
  onChange,
  onSubmit,
  onDebouncedSearch,
  className = '',
  showSubmitButton = true,
  debounceMs = 300,
}: ProductSearchFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebouncedCallback((query: string) => {
    onDebouncedSearch?.(query)
  }, debounceMs)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function handleChange(nextValue: string) {
    onChange(nextValue)
    debouncedSearch(nextValue)
  }

  function submitQuery(query: string) {
    debouncedSearch.cancel()
    onSubmit(query)
    setIsFocused(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitQuery(value)
  }

  function handleSelectSuggestion(keyword: string) {
    onChange(keyword)
    submitQuery(keyword)
  }

  const showSuggestions = isFocused && normalizeKeyword(value).length === 0

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="상품을 검색하세요"
          aria-label="상품 검색"
          enterKeyHint="search"
          autoComplete="off"
          className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-5 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white sm:text-base"
        />
        {showSubmitButton && (
          <button
            type="submit"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-100"
            aria-label="검색"
          >
            <SearchIcon />
          </button>
        )}
      </form>

      <SearchSuggestions visible={showSuggestions} onSelect={handleSelectSuggestion} />
    </div>
  )
}
