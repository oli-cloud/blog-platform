import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(12) })
const registerSchema = loginSchema.extend({ username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/), display_name: z.string().min(1).max(100) })

export function LoginPage() {
 const { user, login }=useAuth(); const navigate=useNavigate(); const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<z.infer<typeof loginSchema>>({resolver:zodResolver(loginSchema)});
 if(user) return <Navigate to="/dashboard" replace />
 return <AuthCard title="Welcome back"><form onSubmit={handleSubmit(async v=>{try{await login(v.email,v.password);navigate('/dashboard')}catch{toast.error('Unable to sign in')}})}><Field label="Email" type="email" registration={register('email')} error={errors.email?.message}/><Field label="Password" type="password" registration={register('password')} error={errors.password?.message}/><Submit busy={isSubmitting}>Sign in</Submit></form><p className="mt-4 text-sm">New here? <Link className="font-semibold text-accent" to="/register">Create an account</Link></p></AuthCard>
}

export function RegisterPage() {
 const {user,register:registerAccount}=useAuth(); const navigate=useNavigate(); const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<z.infer<typeof registerSchema>>({resolver:zodResolver(registerSchema)});
 if(user) return <Navigate to="/dashboard" replace />
 return <AuthCard title="Create your account"><form onSubmit={handleSubmit(async v=>{try{await registerAccount(v);navigate('/dashboard')}catch{toast.error('Unable to create account')}})}><Field label="Display name" registration={register('display_name')} error={errors.display_name?.message}/><Field label="Username" registration={register('username')} error={errors.username?.message}/><Field label="Email" type="email" registration={register('email')} error={errors.email?.message}/><Field label="Password" type="password" registration={register('password')} error={errors.password?.message}/><Submit busy={isSubmitting}>Create account</Submit></form></AuthCard>
}

function AuthCard({title,children}:{title:string;children:ReactNode}) { return <div className="mx-auto max-w-md px-4 py-16"><div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-neutral-900"><h1 className="mb-6 text-2xl font-bold">{title}</h1>{children}</div></div> }
function Field({label,type='text',registration,error}:{label:string;type?:string;registration:any;error?:string}) { return <label className="mb-4 block text-sm font-medium">{label}<input {...registration} type={type} className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-accent dark:border-stone-700 dark:bg-neutral-950"/><span className="mt-1 block text-xs text-red-600">{error}</span></label> }
function Submit({busy,children}:{busy:boolean;children:ReactNode}) { return <button disabled={busy} className="mt-2 w-full rounded-lg bg-ink py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-stone-100 dark:text-ink">{children}</button> }
