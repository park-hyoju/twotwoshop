export { convertEngToKor, isEngKeyboardInput } from './convertEngToKor'
export { ENABLE_POPULAR_SEARCH, POPULAR_SEARCH_KEYWORDS } from './popularSearchTerms'
export {
  keywordsMatch,
  normalizeKeyword,
  normalizeKeywordForMatch,
  normalizeTextForMatch,
} from './normalizeKeyword'
export {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from './recentSearch'
export {
  buildSearchCorrectionMessage,
  filterProductsByKeyword,
  matchesProductKeyword,
  searchProducts,
  type ProductSearchResult,
} from './searchProducts'
