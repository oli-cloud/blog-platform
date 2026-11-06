import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import api from '../../services/api'
import type { Post, PostPage } from '../../types'

export function HomePage() { return <PostList /> }
export function PostListPage() { return <PostList /> }

function PostList() {
 const {data,isLoading,error}=useQuery({queryKey:['posts'],queryFn:async()=> (await api.get<PostPage>('/posts?page_size=12')).data})
 return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><header className="mb-10 border-b border-stone-200 pb-8 dark:border-stone-800"><p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Stories worth reading</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Ideas, craft, and modern culture.</h1></header>{isLoading&&<PostSkeleton/>}{error&&<ErrorState/>}{data?.items.length===0&&<EmptyState/>}<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{data?.items.map(post=><Link key={post.id} to={`/posts/${post.slug}`} className="group"><article className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-neutral-900">{post.featured_image_url?<img src={post.featured_image_url} alt="" className="h-48 w-full object-cover"/>:<div className="h-48 bg-stone-200 dark:bg-stone-800"/>}<div className="p-5"><p className="mb-2 text-xs font-semibold text-accent">{post.categories[0]?.name||'Article'}</p><h2 className="text-xl font-bold group-hover:text-accent">{post.title}</h2><p className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-400">{post.excerpt||post.content}</p></div></article></Link>)}</div></div>
}

export function PostDetailPage() {
 const {slug}=useParams(); const {data,isLoading,error}=useQuery({queryKey:['post',slug],queryFn:async()=> (await api.get<Post>(`/posts/${slug}`)).data})
 if(isLoading)return <div className="mx-auto max-w-3xl px-4 py-16"><PostSkeleton/></div>
 if(error)return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState/></div>
 if(!data)return <EmptyState/>
 return <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><p className="mb-4 text-sm font-semibold text-accent">{data.categories[0]?.name||'Article'}</p><h1 className="text-4xl font-bold leading-tight sm:text-5xl">{data.title}</h1><p className="mt-5 text-xl text-stone-600 dark:text-stone-400">{data.excerpt}</p>{data.featured_image_url&&<img src={data.featured_image_url} alt="" className="mt-8 w-full rounded-xl object-cover"/>}<div className="prose-editor mt-10 max-w-none space-y-4 leading-8"><ReactMarkdown>{data.content}</ReactMarkdown></div></article>
}

function PostSkeleton(){return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(n=><div key={n} className="h-72 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800"/> )}</div>}
function EmptyState(){return <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-stone-500">No articles found yet.</div>}
function ErrorState(){return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">Unable to load articles. Please try again.</div>}
