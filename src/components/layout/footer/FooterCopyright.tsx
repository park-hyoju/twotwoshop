export function FooterCopyright() {
  const currentYear = new Date().getFullYear()

  return (
    <p className="text-xs text-neutral-400" translate="no">
      © {currentYear} 투투샵
    </p>
  )
}
