import { NavLink } from 'react-router-dom'
import { Swords, Radio, BarChart2, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Accueil', icon: Swords, end: true },
  { to: '/en-direct', label: 'En Direct', icon: Radio },
  { to: '/statistiques', label: 'Statistiques', icon: BarChart2 },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-lol-border bg-lol-navy/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <span className="text-lg font-bold tracking-widest text-lol-gold uppercase select-none">
          SolowQ
        </span>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'text-lol-gold border-b-2 border-lol-gold font-semibold'
                    : 'text-lol-gold-light/70 hover:text-lol-gold'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile burger */}
        <button
          className="text-lol-gold md:hidden"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-lol-border bg-lol-navy px-4 pb-3 md:hidden">
          {links.map(({ to, label, icon: Icon, end }) => (
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
