import { Link, Outlet } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from './SiteHeader'

const copyrightYear = new Date().getFullYear()

export function SiteLayout() {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-neutral-950 dark:text-stone-100">
      <SiteHeader />
      <main><Outlet /></main>
      <footer className="border-t border-stone-200 bg-white/40 dark:border-stone-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/" className="font-serif text-xl font-semibold">Addis Journal</Link>
            <p className="mt-1 text-sm text-stone-400">Independent stories for curious minds.</p>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-stone-500">
            <Link to="/posts" className="hover:text-accent">Stories</Link>
            <Link to="/categories" className="hover:text-accent">Topics</Link>
            <Link to="/register" className="inline-flex items-center gap-1 text-ink dark:text-white">Subscribe <ArrowUpRight size={14} /></Link>
          </div>
        </div>
        <div className="border-t border-stone-200/70 py-4 text-center text-xs text-stone-400 dark:border-stone-800">© {copyrightYear} Addis Journal</div>
      </footer>
    </div>
  )
}
