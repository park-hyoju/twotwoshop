interface AdminPlaceholderSectionProps {
  title: string
  description: string
}

export function AdminPlaceholderSection({
  title,
  description,
}: AdminPlaceholderSectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-base text-neutral-600 sm:text-lg">{description}</p>
      <p className="mt-8 rounded-xl border border-neutral-200 bg-white px-6 py-5 text-base text-neutral-700 sm:text-lg">
        준비 중입니다.
      </p>
    </div>
  )
}
