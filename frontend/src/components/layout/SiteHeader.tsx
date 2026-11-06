import { Link, NavLink } from 'react-router-dom'
import { Moon, Sun, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'

export function SiteHeader() {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light') }, [dark])
  return <header className="sticky top-0 z-40 border-b border-stone-200 bg-paper/95 backdrop-blur dark:border-stone-800 dark:bg-neutral-900">
    <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
      <Link to="/" className="text-xl font-bold tracking-tight text-ink dark:text-white">The Journal</Link>
      <nav className="ml-8 hidden items-center gap-6 text-sm font-medium sm:flex">
        <NavLink to="/posts" className={({isActive}) => isActive ? 'text-accent' : 'hover:text-accent'}>Articles</NavLink>
        <NavLink to="/categories" className={({isActive}) => isActive ? 'text-accent' : 'hover:text-accent'}>Topics</NavLink>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <button aria-label="Toggle color theme" onClick={() => setDark(v => !v)} className="rounded-full p-2 hover:bg-stone-100 dark:hover:bg-stone-800">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
        {user ? <><Link to="/dashboard/posts/new" className="hidden items-center gap-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-stone-100 dark:text-ink sm:flex"><PenLine size={16}/> Write</Link><button onClick={() => void logout()} className="px-2 text-sm">Sign out</button></> : <><Link to="/login" className="px-3 text-sm font-medium">Sign in</Link><Link to="/register" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-stone-100 dark:text-ink">Join</Link></>}
      </div>
    </div>
  </header>
}