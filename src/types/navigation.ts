export interface LinkItem {
  label: string
  href: string
}

export interface NavItem {
  label: string
  href: string
  children?: LinkItem[]
}
