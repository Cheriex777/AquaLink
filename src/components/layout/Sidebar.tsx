import { NavLink } from 'react-router-dom'
import { Droplets } from 'lucide-react'
import { navItems } from '../../config/navigation'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-50 text-primary-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex print:hidden">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 px-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Droplets className="size-5" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span className="block text-base font-semibold text-slate-900">
            JalSetu
          </span>
          <span className="block text-xs text-slate-500">RWH Assessment</span>
        </span>
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-4"
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <item.icon className="size-5 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="shrink-0 border-t border-slate-200 p-4">
        <p className="text-xs text-slate-400">JalSetu v0.1.0 · Foundation</p>
      </div>
    </aside>
  )
}
