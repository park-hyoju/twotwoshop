import { FooterBrand } from './FooterBrand'
import { FooterCopyright } from './FooterCopyright'
import { FooterNav } from './FooterNav'
import { FooterSupport } from './FooterSupport'

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <FooterBrand />
            <FooterSupport />
          </div>

          <FooterNav />

          <div className="border-t border-neutral-100 pt-4">
            <FooterCopyright />
          </div>
        </div>
      </div>
    </footer>
  )
}
