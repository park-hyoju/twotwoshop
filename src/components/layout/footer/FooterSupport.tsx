import { Headset } from 'lucide-react'

export function FooterSupport() {
  return (
    <div className="text-center sm:text-left">
      <p className="text-sm font-semibold text-neutral-800">고객센터</p>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-[#777] sm:justify-start">
        <Headset size={15} strokeWidth={1.8} className="text-neutral-500" aria-hidden="true" />
        24시간 상담 접수
      </p>
      <p className="mt-1 text-xs text-[#888] sm:text-sm">문의는 순차적으로 답변드립니다.</p>
    </div>
  )
}
