import { describe, expect, it } from 'vitest'
import {
  getInquiryReplyTemplate,
  shouldConfirmReplyTemplateOverwrite,
} from './inquiryReplyTemplates'

describe('inquiryReplyTemplates', () => {
  it('returns template content by key', () => {
    const template = getInquiryReplyTemplate('shipping')
    expect(template.label).toBe('배송안내')
    expect(template.content).toContain('📦 안녕하세요, 고객님')
  })

  it('requires overwrite confirmation when reply has content', () => {
    expect(shouldConfirmReplyTemplateOverwrite('')).toBe(false)
    expect(shouldConfirmReplyTemplateOverwrite('   ')).toBe(false)
    expect(shouldConfirmReplyTemplateOverwrite('작성 중')).toBe(true)
  })
})
