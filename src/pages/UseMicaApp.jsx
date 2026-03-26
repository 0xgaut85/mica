import { lazy, Suspense } from 'react'

const AppDashboard = lazy(() => import('../components/app/AppDashboard'))

export default function UseMicaApp() {
  return (
    <Suspense
      fallback={
        <div className="noise-overlay min-h-screen bg-cream flex items-center justify-center">
          <p className="font-mono text-sm text-gray-500 tracking-[0.2em]">Loading...</p>
        </div>
      }
    >
      <AppDashboard />
    </Suspense>
  )
}
