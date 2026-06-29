import { FooterBrand } from './FooterBrand'
import { FooterCopyright } from './FooterCopyright'
import { FooterNav } from './FooterNav'
import { FooterSupport } from './FooterSupport'

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:gap-10 sm:text-left">
          <div className="flex w-full flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
            <FooterBrand />
            <FooterSupport />
          </div>

          <FooterNav />

          <div className="w-full border-t border-neutral-100 pt-8">
            <FooterCopyright />
          </div>
        </div>
      </div>
    </footer>
  )
}
