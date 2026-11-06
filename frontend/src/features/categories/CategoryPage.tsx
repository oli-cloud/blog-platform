import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import type { Category } from '../../types'

export function CategoriesPage(){const {data,isLoading,error}=useQuery({queryKey:['categories'],queryFn:async()=> (await api.get<Category[]>('/categories')).data});return <div className="mx-auto max-w-6xl px-4 py-12"><h1 className="mb-8 text-4xl font-bold">Topics</h1>{isLoading&&<p>Loading topics…</p>}{error&&<p className="text-red-600">Unable to load topics.</p>}{data?.length===0&&<p className="text-stone-500">No topics have been created yet.</p>}<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{data?.map(c=><article key={c.id} className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-neutral-900"><h2 className="text-lg font-bold">{c.name}</h2><p className="mt-2 text-sm text-stone-500">{c.description||'Explore articles in this topic.'}</p></article>)}</div></div>}
