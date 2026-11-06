export interface User { id: string; email: string; username: string; display_name: string; bio?: string; avatar_url?: string; role: 'user' | 'admin'; status: 'active' | 'suspended' }
export interface Category { id: string; name: string; slug: string; description?: string }
export interface Tag { id: string; name: string; slug: string }
export interface Post { id: string; title: string; slug: string; excerpt: string; content: string; featured_image_url?: string; status: 'draft' | 'published' | 'archived'; published_at?: string; author_id: string; categories: Category[]; tags: Tag[] }
export interface PostPage { items: Post[]; total: number; page: number; page_size: number }
