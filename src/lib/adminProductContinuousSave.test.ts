import { describe, expect, it } from 'vitest'
import {
  isActiveSaveGeneration,
  resolveDetailProductIdAfterEditorClose,
} from './adminProductContinuousSave'

describe('adminProductContinuousSave', () => {
  it('keeps the next product open when a previous save-after-close completes late', () => {
    expect(resolveDetailProductIdAfterEditorClose('product-b', 'product-a')).toBe('product-b')
  })

  it('closes only when the closing id matches the open editor', () => {
    expect(resolveDetailProductIdAfterEditorClose('product-a', 'product-a')).toBeNull()
    expect(resolveDetailProductIdAfterEditorClose(null, 'product-a')).toBeNull()
  })

  it('invalidates in-flight save completion after product switch / unmount', () => {
    const startedGeneration = 1
    const afterSwitchGeneration = 2
    expect(isActiveSaveGeneration(startedGeneration, afterSwitchGeneration)).toBe(false)
    expect(isActiveSaveGeneration(afterSwitchGeneration, afterSwitchGeneration)).toBe(true)
  })

  it('allows retry after a failed save on the same generation', () => {
    const generation = 3
    expect(isActiveSaveGeneration(generation, generation)).toBe(true)
  })
})
