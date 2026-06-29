import type { LegalDocumentContent, LegalDocumentSection, LegalDocumentTable } from '../../content/legalDocuments'
import { PageTopActions } from '../common/PageTopActions'

interface LegalDocumentPageProps {
  document: LegalDocumentContent
}

function LegalDocumentTableView({ table }: { table: LegalDocumentTable }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {table.headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:px-5 sm:text-sm sm:normal-case sm:tracking-normal"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-white">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className={`px-4 py-4 align-top sm:px-5 ${
                      cellIndex === 0
                        ? 'font-medium text-neutral-900'
                        : 'text-neutral-600'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LegalDocumentSectionCard({ section, index }: { section: LegalDocumentSection; index: number }) {
  return (
    <section
      aria-labelledby={`legal-section-${index}`}
      className="rounded-2xl border border-neutral-100 bg-[#fafafa] p-6 sm:p-8"
    >
      <h2
        id={`legal-section-${index}`}
        className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl"
      >
        {section.title}
      </h2>

      {section.paragraphs.length > 0 && (
        <div className="mt-4 space-y-3 text-[15px] leading-7 text-neutral-600">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}

      {section.bullets && section.bullets.length > 0 && (
        <ul className="mt-5 space-y-2.5">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-[15px] leading-7 text-neutral-600">
              <span
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400"
                aria-hidden="true"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {section.table && <LegalDocumentTableView table={section.table} />}
    </section>
  )
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <div className="bg-[#f5f5f5] px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[900px]">
        <article className="rounded-[24px] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-12">
          <PageTopActions />

          <header className="border-b border-neutral-100 pb-8 sm:pb-10">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400"
              translate="no"
            >
              TWOTWOSHOP
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[28px]">
              {document.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              투투샵 서비스 이용과 관련된 안내 사항입니다.
            </p>
          </header>

          <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
            {document.sections.map((section, index) => (
              <LegalDocumentSectionCard key={section.title} section={section} index={index} />
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
