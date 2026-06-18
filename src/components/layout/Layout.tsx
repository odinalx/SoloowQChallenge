import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-2 py-4">
        <Outlet />
      </main>
      <footer className="border-t border-lol-border py-4 text-center text-xs text-lol-gold-light/40">
        SolowQ Challenge by{' '}
        <a
          href="https://github.com/odinalx"
          target="_blank"
          rel="noopener noreferrer"
          className="text-lol-gold-light/60 hover:text-lol-gold transition-colors"
        >
          odinalx
        </a>
      </footer>
    </div>
  )
}
