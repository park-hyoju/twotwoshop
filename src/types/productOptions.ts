export interface ProductOptionGroup {
  name: string
  values: string[]
}

export interface ProductVariantOptions {
  [optionName: string]: string
}

let idSeq = 0

export function createVariantId(): string {
  idSeq += 1
  return `variant-${Date.now()}-${idSeq}-${Math.random().toString(36).slice(2, 8)}`
}

export function createOptionGroupId(): string {
  idSeq += 1
  return `opt-group-${Date.now()}-${idSeq}-${Math.random().toString(36).slice(2, 8)}`
}

/** Ensures every option group has a distinct id so value edits cannot cross-write. */
export function ensureUniqueOptionGroupIds<T extends { id: string }>(groups: T[]): T[] {
  const seen = new Set<string>()
  let changed = false

  const next = groups.map((group) => {
    const currentId = group.id?.trim() ?? ''
    if (currentId && !seen.has(currentId)) {
      seen.add(currentId)
      return group
    }

    changed = true
    const id = createOptionGroupId()
    seen.add(id)
    return { ...group, id }
  })

  return changed ? next : groups
}
