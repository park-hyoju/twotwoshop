interface SectionTitleProps {
  title: string
  description?: string
}

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="mb-10 text-center sm:mb-12">
      <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{title}</h2>
      {description && (
        <p className="mt-3 text-base text-neutral-600 sm:text-lg">{description}</p>
      )}
    </div>
  )
}
