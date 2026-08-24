import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import AccountMenu from './AccountMenu'
import { navItems } from '../../config/navigation'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const current = navItems.find((item) => item.to === pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 print:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <h1 className="truncate text-lg font-semibold text-slate-900">
        {current?.label ?? 'JalSetu'}
      </h1>
      <AccountMenu />
    </header>
  )
}
