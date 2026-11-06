import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/layout/SiteLayout'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LoginPage, RegisterPage } from './features/auth/AuthPages'
import { HomePage, PostDetailPage, PostListPage } from './features/posts/PostPages'
import { PostEditorPage } from './features/posts/PostEditor'
import { DashboardPage, ProfilePage, AdminPage } from './features/dashboard/DashboardPages'
import { CategoriesPage } from './features/categories/CategoryPage'

export default function App() {
  return <Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path="posts" element={<PostListPage />} />
      <Route path="posts/:slug" element={<PostDetailPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="posts/new" element={<PostEditorPage />} />
          <Route path="posts/:postId/edit" element={<PostEditorPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute admin />}>
        <Route path="admin" element={<DashboardLayout />}>
          <Route index element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
}
