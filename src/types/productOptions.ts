export interface ProductOptionGroup {
  name: string
  values: string[]
}

export interface ProductVariantOptions {
  [optionName: string]: string
}

export function createVariantId(): string {
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createOptionGroupId(): string {
  return `opt-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
