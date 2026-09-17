import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { HydrationNotice } from '@/app/layout/HydrationNotice'
import { PersistenceIssueBanner } from '@/app/layout/PersistenceIssueBanner'
import { TopNav } from '@/app/layout/TopNav'
import { Toaster } from '@/components/ui/sonner'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <HydrationNotice />
      <Toaster position="bottom-right" />
      <PersistenceIssueBanner />
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Suspense fallback={<p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
