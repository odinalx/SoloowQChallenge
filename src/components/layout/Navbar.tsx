import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

type NavLink = { to: string; label: string; end?: boolean }

const leftLinks: NavLink[] = [
  { to: '/', label: 'Classement', end: true },
  { to: '/en-direct', label: 'En Direct' },
]

const rightLinks: NavLink[] = [
  { to: '/statistiques', label: 'Statistiques' },
]

const allLinks: NavLink[] = [...leftLinks, ...rightLinks]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium tracking-wide transition-all duration-200',
    isActive
      ? 'text-lol-gold bg-lol-gold/10'
      : 'text-lol-gold-light/50 hover:text-lol-gold-light hover:bg-white/[0.04]'
  )

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-lol-border bg-lol-navy/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-4">

        {/* Left links */}
        <div className="hidden items-center gap-1 md:flex flex-1 justify-end">
          {leftLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Center logo */}
        <NavLink
          to="/"
          className="mx-8 font-black tracking-[0.18em] text-lol-gold uppercase select-none transition-all duration-300 hover:opacity-80 flex-shrink-0 glow-gold text-[1.6rem] leading-none"
        >
          SolowQ
        </NavLink>

        {/* Right links */}
        <div className="hidden items-center gap-1 md:flex flex-1 justify-start">
          {rightLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile burger — animated 3 bars → X */}
        <button
          className="text-lol-gold md:hidden ml-auto p-2 -mr-1"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          <div className="flex h-[18px] w-5 flex-col gap-[6px]">
            <span className={cn(
              'h-0.5 w-full rounded-full bg-current transition-all duration-300 origin-center',
              open && 'translate-y-2 rotate-45'
            )} />
            <span className={cn(
              'h-0.5 w-full rounded-full bg-current transition-all duration-300',
              open && 'opacity-0 scale-x-0'
            )} />
            <span className={cn(
              'h-0.5 w-full rounded-full bg-current transition-all duration-300 origin-center',
              open && '-translate-y-2 -rotate-45'
            )} />
          </div>
        </button>
      </div>

      {/* Mobile menu — height+opacity slide instead of hard mount/unmount */}
      <div className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out md:hidden',
        open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="border-t border-lol-border/60 bg-lol-navy/95 px-6 pb-4 pt-2">
          {allLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center py-2.5 text-sm font-medium tracking-wide transition-colors border-b border-lol-border/30 last:border-none',
                  isActive ? 'text-lol-gold' : 'text-lol-gold-light/55 hover:text-lol-gold-light'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
