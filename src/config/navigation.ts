import {
  BookOpen,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Leaf,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'New Assessment', to: '/new-assessment', icon: FilePlus2 },
  { label: 'Reports', to: '/reports', icon: FileText },
  { label: 'Environment', to: '/environment', icon: Leaf },
  { label: 'Guidelines', to: '/guidelines', icon: BookOpen },
  { label: 'Settings', to: '/settings', icon: Settings },
]
