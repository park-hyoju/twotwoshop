import { Link } from 'react-router-dom'

interface HomeSectionHeaderProps {
  eyebrow: string
  title: string
  description: string
  moreHref: string
}

const moreButtonClassName =
  'inline-flex min-h-10 shrink-0 items-center justify-center self-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-900 sm:self-auto sm:text-[15px]'

export function HomeSectionHeader({
  eyebrow,
  title,
  description,
  moreHref,
}: HomeSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="text-center sm:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280] sm:text-[15px]">
          {description}
        </p>
      </div>

      <Link to={moreHref} className={moreButtonClassName}>
        더보기
      </Link>
    </div>
  )
}
