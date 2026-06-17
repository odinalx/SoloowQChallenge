import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Swords, Radio, BarChart2, Menu, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const leftLinks: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Classement', icon: Swords, end: true },
  { to: '/en-direct', label: 'En Direct', icon: Radio },
]

const rightLinks: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/statistiques', label: 'Statistiques', icon: BarChart2 },
]

const allLinks = [...leftLinks, ...rightLinks]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors',
    isActive
      ? 'text-lol-gold border-b-2 border-lol-gold font-semibold'
      : 'text-lol-gold-light/70 hover:text-lol-gold'
  )

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-lol-border bg-lol-navy/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-5">

        {/* Left links */}
        <div className="hidden items-center gap-1 md:flex flex-1 justify-end">
          {leftLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Center logo */}
        <NavLink
          to="/"
          className="mx-8 text-4xl font-bold tracking-widest text-lol-gold uppercase select-none hover:text-lol-gold/80 transition-colors flex-shrink-0"
        >
          SolowQ
        </NavLink>

        {/* Right links */}
        <div className="hidden items-center gap-1 md:flex flex-1 justify-start">
          {rightLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile burger */}
        <button
          className="text-lol-gold md:hidden ml-auto"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-lol-border bg-lol-navy px-4 pb-3 md:hidden">
          {allLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 py-3 text-sm',
                  isActive ? 'text-lol-gold font-semibold' : 'text-lol-gold-light/70'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
