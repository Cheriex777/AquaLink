import React, { Suspense, lazy, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
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
const SchemeChatbotPage = lazy(() => import('./pages/SchemeChatbotPage'))

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

/** Redirects unauthenticated users to /login. Shows a spinner while auth loads. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Loader2 className="size-8 animate-spin text-primary-600" aria-hidden="true" />
        <span className="sr-only">Checking session…</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Redirects already-authenticated users away from login/signup. */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Loader2 className="size-8 animate-spin text-primary-600" aria-hidden="true" />
        <span className="sr-only">Checking session…</span>
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Guest-only routes — logged-in users are sent to dashboard */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <AuthPage mode="signin" />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <AuthPage mode="signup" />
              </GuestRoute>
            }
          />
          <Route
  path="/scheme-assistant"
  element={<Lazy component={SchemeChatbotPage} />}
/>

          {/* Protected routes — guests are sent to /login */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
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
      </BrowserRouter>
    </AuthProvider>
  )
}
