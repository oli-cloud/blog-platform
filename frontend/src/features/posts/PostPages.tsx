import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpRight, Clock, Heart, MessageCircle, Send, Tag } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import api from '../../services/api'
import type { Post, PostPage } from '../../types'

export function HomePage() { return <PostList /> }
export function PostListPage() { return <PostList /> }

function formatDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function readingTime(post: Post) {
  const words = `${post.title} ${post.excerpt} ${post.content}`.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 220))
}

function PostList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => (await api.get<PostPage>('/posts?page_size=12')).data,
  })
  const [featured, ...posts] = data?.items ?? []

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="mb-10 border-b border-stone-200 pb-9 dark:border-stone-800">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-accent">Independent ideas & stories</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] tracking-tight text-ink dark:text-white sm:text-7xl">Addis Journal</h1>
          </div>
          <p className="hidden max-w-sm text-right text-base leading-7 text-stone-500 md:block">Thoughtful writing on creativity, culture, technology, and the way we live now.</p>
        </div>
      </header>

      {isLoading && <PostSkeleton />}
      {error && <ErrorState />}
      {data?.items.length === 0 && <EmptyState />}

      {featured && (
        <section className="mb-14 grid overflow-hidden rounded-[2rem] bg-[#241718] lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative min-h-[360px] overflow-hidden bg-stone-800 lg:min-h-[520px]">
            {featured.featured_image_url ? (
              <img src={featured.featured_image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.02]" />
            ) : (
              <div className="editorial-placeholder absolute inset-0" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
          <div className="flex flex-col justify-between p-7 text-white sm:p-10 lg:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f6a5a5]">{featured.categories[0]?.name || 'Featured story'}</p>
              <Link to={`/posts/${featured.slug}`} className="group mt-6 block">
                <h2 className="max-w-xl font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-[3.5rem]">{featured.title}</h2>
              </Link>
              <p className="mt-6 max-w-lg text-base leading-7 text-stone-300">{featured.excerpt || featured.content.slice(0, 180)}</p>
            </div>
            <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-6">
              <div className="flex items-center gap-4 text-xs text-stone-300">
                {featured.published_at && <span>{formatDate(featured.published_at)}</span>}
                <span className="h-1 w-1 rounded-full bg-[#f6a5a5]" />
                <span>{readingTime(featured)} min read</span>
              </div>
              <Link to={`/posts/${featured.slug}`} aria-label={`Read ${featured.title}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#241718] transition hover:rotate-45">
                <ArrowUpRight size={19} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <div className="mb-7 flex items-center justify-between border-b border-stone-200 pb-4 dark:border-stone-800">
            <h2 className="font-serif text-3xl font-semibold">Latest stories</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{posts.length} articles</span>
          </div>
          <div className="grid gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Link key={post.id} to={`/posts/${post.slug}`} className="group">
                <article>
                  <div className={`mb-5 aspect-[4/3] overflow-hidden rounded-2xl ${post.featured_image_url ? 'bg-stone-100' : 'editorial-placeholder'}`}>
                    {post.featured_image_url && <img src={post.featured_image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-accent">
                    <span>{post.categories[0]?.name || 'Article'}</span>
                    <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
                    <span className="text-stone-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-3 font-serif text-[1.7rem] leading-[1.12] transition-colors group-hover:text-accent">{post.title}</h3>
                  <p className="mt-3 line-clamp-2 text-base leading-7 text-stone-500 dark:text-stone-400">{post.excerpt || post.content}</p>
                  <div className="mt-5 flex items-center gap-2 text-xs text-stone-400">
                    <Clock size={13} />
                    <span>{readingTime(post)} min read</span>
                    {post.published_at && <><span>·</span><span>{formatDate(post.published_at)}</span></>}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function PostDetailPage() {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(false)
  const [comment, setComment] = useState('')
  const { data, isLoading, error } = useQuery({ queryKey: ['post', slug], queryFn: async () => (await api.get<Post>(`/posts/${slug}`)).data })
  const comments = useQuery({
    queryKey: ['comments', data?.id],
    enabled: Boolean(data?.id),
    queryFn: async () => (await api.get<Comment[]>(`/posts/${data!.id}/comments`)).data,
  })
  const addComment = useMutation({
    mutationFn: async () => (await api.post(`/posts/${data!.id}/comments`, { body: comment })).data,
    onSuccess: () => {
      setComment('')
      void queryClient.invalidateQueries({ queryKey: ['comments', data?.id] })
      toast.success('Comment posted')
    },
    onError: () => toast.error('Sign in to join the conversation'),
  })

  if (isLoading) return <div className="mx-auto max-w-4xl px-5 py-16"><PostSkeleton /></div>
  if (error) return <div className="mx-auto max-w-3xl px-5 py-16"><ErrorState /></div>
  if (!data) return <EmptyState />

  const toggleLike = async () => {
    try {
      if (liked) await api.delete(`/posts/${data.id}/like`)
      else await api.post(`/posts/${data.id}/like`)
      setLiked(value => !value)
    } catch {
      toast.error('Sign in to like this story')
    }
  }

  return (
    <article>
      <header className="mx-auto max-w-4xl px-5 pb-8 pt-12 text-center sm:px-8 sm:pt-16">
        <Link to="/posts" className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 transition hover:text-accent">
          <ArrowLeft size={14} /> Back to stories
        </Link>
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-accent">{data.categories[0]?.name || 'Article'}</p>
        <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-ink dark:text-white sm:text-6xl lg:text-7xl">{data.title}</h1>
        {data.excerpt && <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-stone-500 dark:text-stone-400 sm:text-xl">{data.excerpt}</p>}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-400">
          {data.published_at && <span>{formatDate(data.published_at)}</span>}
          <span className="h-1 w-1 rounded-full bg-accent" />
          <span>{readingTime(data)} min read</span>
          {data.tags.length > 0 && <><span className="h-1 w-1 rounded-full bg-accent" /><span className="inline-flex items-center gap-1.5"><Tag size={12} />{data.tags[0].name}</span></>}
        </div>
      </header>

      {data.featured_image_url && (
        <div className="mx-auto mb-12 max-w-6xl px-5 sm:px-8">
          <img src={data.featured_image_url} alt="" className="max-h-[620px] w-full rounded-[1.75rem] object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        <div className="prose-editor border-t border-stone-200 pt-10 dark:border-stone-800"><ReactMarkdown>{data.content}</ReactMarkdown></div>
        <div className="mt-12 flex items-center gap-3 border-y border-stone-200 py-5 dark:border-stone-800">
          <button onClick={() => void toggleLike()} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${liked ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950' : 'border-stone-200 hover:border-accent hover:text-accent dark:border-stone-700'}`}>
            <Heart size={17} fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Liked' : 'Like'}
          </button>
          <a href="#comments" className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold dark:border-stone-700"><MessageCircle size={17} /> {comments.data?.length || 0}</a>
        </div>

        <section id="comments" className="mt-12">
          <h2 className="font-serif text-3xl">Conversation</h2>
          <div className="mt-5 flex gap-3">
            <textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Share your thoughts…" maxLength={5000} rows={3} className="min-h-[96px] flex-1 resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-accent dark:border-stone-700 dark:bg-neutral-900" />
            <button disabled={!comment.trim() || addComment.isPending} onClick={() => addComment.mutate()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-40 dark:bg-stone-100 dark:text-ink" aria-label="Post comment"><Send size={17} /></button>
          </div>
          <div className="mt-7 space-y-4">
            {comments.data?.map(item => <div key={item.id} className="rounded-xl border border-stone-200 p-5 dark:border-stone-800"><p className="text-sm leading-7 text-stone-700 dark:text-stone-300">{item.body}</p></div>)}
            {!comments.isLoading && comments.data?.length === 0 && <p className="py-6 text-sm text-stone-400">Be the first to join the conversation.</p>}
          </div>
        </section>
      </div>
    </article>
  )
}

interface Comment {
  id: string
  body: string
  author_id: string
}

function PostSkeleton() { return <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(n => <div key={n} className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />)}</div> }
function EmptyState() { return <div className="mx-auto max-w-7xl px-5 py-16"><div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-500">No stories found yet.</div></div> }
function ErrorState() { return <div className="mx-auto max-w-7xl px-5 py-16"><div className="rounded-2xl border border-red-200 bg-red-50 py-12 text-center text-red-700">Unable to load stories. Please try again.</div></div> }
