import { Link, NavLink } from 'react-router-dom'
import { Moon, Sun, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'

export function SiteHeader() {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-paper/90 backdrop-blur-xl dark:border-stone-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3 font-serif text-2xl font-semibold tracking-tight text-ink dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-sans text-sm text-white">A</span>
          Addis Journal
        </Link>
        <nav className="ml-10 hidden items-center gap-7 text-sm font-semibold sm:flex">
          <NavLink to="/posts" className={({ isActive }) => isActive ? 'text-accent' : 'text-stone-500 transition hover:text-accent dark:text-stone-400'}>Stories</NavLink>
          <NavLink to="/categories" className={({ isActive }) => isActive ? 'text-accent' : 'text-stone-500 transition hover:text-accent dark:text-stone-400'}>Topics</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button aria-label="Toggle color theme" onClick={() => setDark(value => !value)} className="rounded-full p-2.5 text-stone-500 transition hover:bg-stone-100 hover:text-ink dark:hover:bg-stone-800 dark:hover:text-white">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user ? (
            <>
              <Link to="/dashboard/posts/new" className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent dark:bg-stone-100 dark:text-ink sm:flex">
                <PenLine size={15} /> Write
              </Link>
              <button onClick={() => void logout()} className="px-2 text-sm font-medium text-stone-500 hover:text-ink dark:hover:text-white">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden px-3 text-sm font-semibold text-stone-600 sm:block dark:text-stone-300">Sign in</Link>
              <Link to="/register" className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent dark:bg-stone-100 dark:text-ink">Join</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}