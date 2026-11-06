import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FileText, Plus, Settings, Trash2, Eye, EyeOff, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../services/api'
import type { Post, User } from '../../types'
import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: posts, isLoading } = useQuery({ queryKey: ['my-posts'], queryFn: async () => (await api.get<Post[]>('/users/me/posts')).data })
  const drafts = posts?.filter(post => post.status === 'draft').length || 0
  const published = posts?.filter(post => post.status === 'published').length || 0
  const action = useMutation({
    mutationFn: async ({ post, verb }: { post: Post; verb: 'publish' | 'unpublish' | 'delete' }) => {
      if (verb === 'delete') await api.delete(`/posts/${post.id}`)
      else await api.patch(`/posts/${post.id}/${verb}`)
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['my-posts'] }); toast.success('Post updated') },
    onError: () => toast.error('Unable to update post'),
  })

  return <div>
    <div className="mb-8 flex items-end justify-between"><div><p className="text-sm text-stone-500">Dashboard</p><h1 className="text-3xl font-bold">Welcome, {user?.display_name}</h1></div><Link to="/dashboard/posts/new" className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-stone-100 dark:text-ink"><Plus size={16} />New article</Link></div>
    <div className="grid gap-4 md:grid-cols-3"><Stat label="All posts" value={posts?.length || 0} /><Stat label="Published" value={published} /><Stat label="Drafts" value={drafts} /></div>
    <section className="mt-8 rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-neutral-900"><div className="border-b border-stone-200 px-5 py-4 font-semibold dark:border-stone-800">Your posts</div>
      {isLoading ? <div className="p-5 text-sm">Loading posts…</div> : posts?.length === 0 ? <div className="p-10 text-center text-sm text-stone-500">No posts yet. Start your first article.</div> : posts?.map(post => <div key={post.id} className="flex items-center gap-3 border-b border-stone-100 px-5 py-4 last:border-0 dark:border-stone-800">
        <FileText size={18} className="shrink-0 text-stone-400" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{post.title}</p><p className="text-xs capitalize text-stone-500">{post.status}</p></div>
        <div className="flex items-center gap-1">
          <Link to={`/dashboard/posts/${post.id}/edit`} aria-label={`Edit ${post.title}`} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-accent dark:hover:bg-stone-800"><Pencil size={16} /></Link>
          {post.status === 'published' ? <button aria-label="Unpublish post" onClick={() => action.mutate({ post, verb: 'unpublish' })} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"><EyeOff size={16} /></button> : <button aria-label="Publish post" onClick={() => action.mutate({ post, verb: 'publish' })} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-accent dark:hover:bg-stone-800"><Eye size={16} /></button>}
          <button aria-label="Delete post" onClick={() => { if (window.confirm(`Delete “${post.title}”?`)) action.mutate({ post, verb: 'delete' }) }} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><Trash2 size={16} /></button>
        </div>
      </div>)}
    </section>
  </div>
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-neutral-900"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div> }

export function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  useEffect(() => { if (user) { setDisplayName(user.display_name); setBio(user.bio || ''); setAvatarUrl(user.avatar_url || '') } }, [user])
  const save = useMutation({ mutationFn: async () => (await api.put('/users/me', { display_name: displayName, bio, avatar_url: avatarUrl || null })).data, onSuccess: () => { void queryClient.invalidateQueries(); toast.success('Profile saved'); window.location.reload() }, onError: () => toast.error('Unable to save profile') })
  return <div><h1 className="mb-6 text-3xl font-bold">Profile settings</h1><div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-neutral-900"><div className="mb-6 flex items-center gap-4"><Settings className="text-accent" /><div><p className="font-semibold">{user?.display_name}</p><p className="text-sm text-stone-500">{user?.email}</p></div></div><div className="grid gap-4 max-w-xl"><label className="text-sm font-medium">Display name<input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={100} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-neutral-950" /></label><label className="text-sm font-medium">Bio<textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-neutral-950" /></label><label className="text-sm font-medium">Avatar URL<input value={avatarUrl} onChange={event => setAvatarUrl(event.target.value)} maxLength={2048} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 dark:border-stone-700 dark:bg-neutral-950" /></label><button disabled={save.isPending || !displayName.trim()} onClick={() => save.mutate()} className="w-fit rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-stone-100 dark:text-ink">Save profile</button></div></div></div>
}

export function AdminPage() {
  const queryClient = useQueryClient()
  const dashboard = useQuery({ queryKey: ['admin-dashboard'], queryFn: async () => (await api.get<{ users: number; posts: number; comments: number }>('/admin/dashboard')).data })
  const users = useQuery({ queryKey: ['admin-users'], queryFn: async () => (await api.get<User[]>('/admin/users')).data })
  const updateUser = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'role' | 'status'; value: string }) => api.patch(`/admin/users/${id}/${field}`, { [field]: value }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User updated') },
    onError: () => toast.error('Unable to update user'),
  })
  if (dashboard.error || users.error) return <div className="text-red-600">Unable to load administration data.</div>
  return <div><h1 className="mb-6 text-3xl font-bold">Administration</h1><div className="grid gap-4 md:grid-cols-3">{dashboard.data && <><Stat label="Users" value={dashboard.data.users} /><Stat label="Posts" value={dashboard.data.posts} /><Stat label="Comments" value={dashboard.data.comments} /></>}</div>
    <section className="mt-8 rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-neutral-900"><div className="border-b border-stone-200 px-5 py-4 font-semibold dark:border-stone-800">Users</div>{users.data?.map(person => <div key={person.id} className="flex flex-wrap items-center gap-4 border-b border-stone-100 px-5 py-4 last:border-0 dark:border-stone-800"><div className="min-w-40 flex-1"><p className="font-medium">{person.display_name}</p><p className="text-xs text-stone-500">{person.email}</p></div><select aria-label="Role" value={person.role} onChange={event => updateUser.mutate({ id: person.id, field: 'role', value: event.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-neutral-950"><option value="user">User</option><option value="admin">Admin</option></select><select aria-label="Status" value={person.status} onChange={event => updateUser.mutate({ id: person.id, field: 'status', value: event.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-stone-700 dark:bg-neutral-950"><option value="active">Active</option><option value="suspended">Suspended</option></select></div>)}</section>
  </div>
}
