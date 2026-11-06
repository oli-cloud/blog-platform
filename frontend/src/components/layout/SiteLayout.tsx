import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'
export function SiteLayout() { return <div className="min-h-screen bg-paper text-ink dark:bg-neutral-950 dark:text-stone-100"><SiteHeader/><main><Outlet/></main><footer className="mt-20 border-t border-stone-200 py-8 text-center text-sm text-stone-500 dark:border-stone-800">© {new Date().getFullYear()} The Journal</footer></div> }
