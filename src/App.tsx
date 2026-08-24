import { Suspense, lazy, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import AuthModal from './components/auth/AuthModal'
import AppLayout from './components/layout/AppLayout'
import NotFoundPage from './pages/NotFoundPage'
import AuthPage from './pages/AuthPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NewAssessmentPage = lazy(() => import('./pages/NewAssessmentPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const ReportViewPage = lazy(() => import('./pages/ReportViewPage'))
const EnvironmentPage = lazy(() => import('./pages/EnvironmentPage'))
const GuidelinesPage = lazy(() => import('./pages/GuidelinesPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <Loader2 className="size-8 animate-spin text-primary-600" aria-hidden="true" />
      <span className="sr-only">Loading page…</span>
    </div>
  )
}

function Lazy({ component: Component }: { component: ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="signin" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Lazy component={DashboardPage} />} />
            <Route path="/new-assessment" element={<Lazy component={NewAssessmentPage} />} />
            <Route path="/reports" element={<Lazy component={ReportsPage} />} />
            <Route path="/reports/:id" element={<Lazy component={ReportViewPage} />} />
            <Route path="/environment" element={<Lazy component={EnvironmentPage} />} />
            <Route path="/guidelines" element={<Lazy component={GuidelinesPage} />} />
            <Route path="/settings" element={<Lazy component={SettingsPage} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <AuthModal />
      </BrowserRouter>
    </AuthProvider>
  )
}
