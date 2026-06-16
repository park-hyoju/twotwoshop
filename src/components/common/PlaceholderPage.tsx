interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 text-lg text-neutral-600 sm:text-xl">{description}</p>
      <p className="mt-8 rounded-xl bg-neutral-100 px-6 py-5 text-base text-neutral-700 sm:text-lg">
        현재 준비 중입니다.
      </p>
    </div>
  )
}
