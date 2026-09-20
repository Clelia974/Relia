import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { HydrationNotice } from '@/app/layout/HydrationNotice'
import { PersistenceIssueBanner } from '@/app/layout/PersistenceIssueBanner'
import { Sidebar } from '@/app/layout/Sidebar'
import { TopNav } from '@/app/layout/TopNav'
import { useResolvedTheme } from '@/app/useResolvedTheme'
import { Spinner } from '@/components/ui/spinner'
import { Toaster } from '@/components/ui/sonner'

export function AppLayout() {
  const location = useLocation()
  const resolvedTheme = useResolvedTheme()

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-3 focus:ring-ring/50"
      >
        Aller au contenu
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <HydrationNotice />
        <Toaster position="bottom-right" theme={resolvedTheme} />
        <PersistenceIssueBanner />
        <TopNav />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <Suspense
            fallback={
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Spinner />
                Chargement…
              </div>
            }
          >
            <div key={location.pathname} className="animate-page-in">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
