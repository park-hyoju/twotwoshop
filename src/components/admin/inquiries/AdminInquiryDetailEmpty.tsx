export function AdminInquiryDetailEmpty() {
  return (
    <div className="admin-animate-in flex h-full min-h-[420px] flex-col items-center justify-center px-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-neutral-100 text-3xl shadow-inner">
        💬
      </div>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-neutral-900">
        문의를 선택해 주세요
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
        좌측 목록에서 고객 문의를 선택하면 상담 내역, 고객 정보, 답변창이 이곳에 표시됩니다.
      </p>
    </div>
  )
}
