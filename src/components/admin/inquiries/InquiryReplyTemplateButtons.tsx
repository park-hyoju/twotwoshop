import { INQUIRY_REPLY_TEMPLATES, type InquiryReplyTemplateKey } from '../../../lib/inquiryReplyTemplates'

interface InquiryReplyTemplateButtonsProps {
  selectedKey: InquiryReplyTemplateKey | null
  onSelect: (templateKey: InquiryReplyTemplateKey) => void
}

const baseButtonClassName =
  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors'

const defaultButtonClassName = `${baseButtonClassName} border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50`

const activeButtonClassName = `${baseButtonClassName} border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800`

export function InquiryReplyTemplateButtons({
  selectedKey,
  onSelect,
}: InquiryReplyTemplateButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {INQUIRY_REPLY_TEMPLATES.map((template) => (
        <button
          key={template.key}
          type="button"
          onClick={() => onSelect(template.key)}
          className={selectedKey === template.key ? activeButtonClassName : defaultButtonClassName}
          aria-label={`${template.label} 템플릿 삽입`}
          aria-pressed={selectedKey === template.key}
        >
          {template.label}
        </button>
      ))}
    </div>
  )
}
