import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
export function ProtectedRoute({admin=false}:{admin?:boolean}) { const {user,loading}=useAuth(); if(loading)return <div className="mx-auto max-w-6xl p-8"><div className="h-40 animate-pulse rounded-xl bg-stone-200"/></div>; if(!user)return <Navigate to="/login" replace/>; if(admin&&user.role!=='admin')return <Navigate to="/dashboard" replace/>; return <Outlet/> }
