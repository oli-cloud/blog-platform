import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, Save } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../services/api'
import type { Category, Post, Tag } from '../../types'

export function PostEditorPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('# Start writing\n\n')
  const [excerpt, setExcerpt] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tagId, setTagId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    void Promise.all([api.get<Category[]>('/categories'), api.get<Tag[]>('/tags')]).then(([categoryResponse, tagResponse]) => {
      setCategories(categoryResponse.data)
      setTags(tagResponse.data)
    }).catch(() => toast.error('Unable to load categories and tags'))

    if (postId) {
      void api.get<Post[]>('/users/me/posts').then(({ data }) => {
        const post = data.find(item => item.id === postId)
        if (!post) return
        setTitle(post.title); setContent(post.content); setExcerpt(post.excerpt); setFeaturedImage(post.featured_image_url || '')
        setCategoryId(post.categories[0]?.id || ''); setTagId(post.tags[0]?.id || '')
      }).catch(() => toast.error('Unable to load post'))
    }
  }, [postId])

  const uploadImage = async (file?: File) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setFeaturedImage(`${api.defaults.baseURL?.replace('/api/v1', '') || ''}${data.url}`)
      toast.success('Image uploaded')
    } catch { toast.error('Unable to upload image') } finally { setUploading(false) }
  }

  const save = async (status: 'draft' | 'published') => {
    setSaving(true)
    try {
      const payload = { title, excerpt, content, featured_image_url: featuredImage || null, category_ids: categoryId ? [categoryId] : [], tag_ids: tagId ? [tagId] : [], status }
      const { data } = postId ? await api.put<Post>(`/posts/${postId}`, payload) : await api.post<Post>('/posts', payload)
      toast.success(status === 'draft' ? 'Draft saved' : 'Post published')
      navigate(status === 'draft' ? '/dashboard' : `/posts/${data.slug}`)
    } catch { toast.error('Unable to save the post') } finally { setSaving(false) }
  }

  return <div className="mx-auto max-w-6xl px-4 py-8"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-stone-500">Editor</p><h1 className="text-2xl font-bold">{postId ? 'Edit article' : 'Create article'}</h1></div><div className="flex gap-2"><button disabled={saving || !title.trim()} onClick={() => void save('draft')} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><Save size={15} />Save draft</button><button disabled={saving || !title.trim()} onClick={() => void save('published')} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white dark:bg-stone-100 dark:text-ink">Publish</button></div></div>
    <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Article title" aria-label="Article title" className="mb-3 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-xl font-bold outline-none focus:border-accent dark:border-stone-700 dark:bg-neutral-900" />
    <input value={excerpt} onChange={event => setExcerpt(event.target.value)} placeholder="Short description" aria-label="Short description" maxLength={500} className="mb-3 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 outline-none focus:border-accent dark:border-stone-700 dark:bg-neutral-900" />
    <div className="mb-3 grid gap-3 md:grid-cols-3"><select value={categoryId} onChange={event => setCategoryId(event.target.value)} aria-label="Category" className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-neutral-900"><option value="">No category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select value={tagId} onChange={event => setTagId(event.target.value)} aria-label="Tag" className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-neutral-900"><option value="">No tag</option>{tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-500 dark:border-stone-700"><ImagePlus size={16} />{uploading ? 'Uploading…' : 'Upload cover image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={event => void uploadImage(event.target.files?.[0])} /></label></div>
    {featuredImage && <div className="mb-3 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800"><img src={featuredImage} alt="Cover preview" className="max-h-64 w-full object-cover" /></div>}
    <div className="grid min-h-[560px] gap-px overflow-hidden rounded-xl border border-stone-300 bg-stone-300 md:grid-cols-2 dark:border-stone-700 dark:bg-stone-700"><textarea value={content} onChange={event => setContent(event.target.value)} aria-label="Markdown content" className="resize-none bg-white p-5 font-mono text-sm outline-none dark:bg-neutral-950" /><div className="prose-editor overflow-auto bg-white p-6 leading-7 dark:bg-neutral-900"><ReactMarkdown>{content}</ReactMarkdown></div></div>
  </div>
}
