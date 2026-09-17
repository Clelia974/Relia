import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { AujourdHuiPage } from '@/pages/AujourdHuiPage'
import { MariagesListPage } from '@/pages/mariages/MariagesListPage'
import { NewWeddingPage } from '@/pages/mariages/NewWeddingPage'
import { WeddingLayout } from '@/pages/mariages/WeddingLayout'
import { WeddingOverviewTab } from '@/pages/mariages/WeddingOverviewTab'
import { WeddingTasksTab } from '@/pages/mariages/WeddingTasksTab'
import { WeddingVendorsTab } from '@/pages/mariages/WeddingVendorsTab'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { PrestatairesGlobalPage } from '@/pages/PrestatairesGlobalPage'
import { RootGate } from '@/pages/RootGate'
import { TachesGlobalPage } from '@/pages/TachesGlobalPage'

// Chargées à la demande : pages lourdes (Gantt, calculs de proposition/facture,
// calendrier) peu visitées au premier chargement — cf. Phase 10.
const CalendrierGlobalPage = lazy(() =>
  import('@/pages/CalendrierGlobalPage').then((m) => ({ default: m.CalendrierGlobalPage })),
)
const WeddingPlanningTab = lazy(() =>
  import('@/pages/mariages/WeddingPlanningTab').then((m) => ({ default: m.WeddingPlanningTab })),
)
const WeddingFinancesTab = lazy(() =>
  import('@/pages/mariages/WeddingFinancesTab').then((m) => ({ default: m.WeddingFinancesTab })),
)
const WeddingDocumentsTab = lazy(() =>
  import('@/pages/mariages/WeddingDocumentsTab').then((m) => ({ default: m.WeddingDocumentsTab })),
)
const WeddingSoldServicesTab = lazy(() =>
  import('@/pages/mariages/WeddingSoldServicesTab').then((m) => ({ default: m.WeddingSoldServicesTab })),
)
const WeddingEquipmentTab = lazy(() =>
  import('@/pages/mariages/WeddingEquipmentTab').then((m) => ({ default: m.WeddingEquipmentTab })),
)
const WeddingDayOfTab = lazy(() =>
  import('@/pages/mariages/WeddingDayOfTab').then((m) => ({ default: m.WeddingDayOfTab })),
)
const WeddingBreakdownTab = lazy(() =>
  import('@/pages/mariages/WeddingBreakdownTab').then((m) => ({ default: m.WeddingBreakdownTab })),
)
const ProposalBuilderPage = lazy(() =>
  import('@/pages/mariages/ProposalBuilderPage').then((m) => ({ default: m.ProposalBuilderPage })),
)
const InvoicePreviewPage = lazy(() =>
  import('@/pages/mariages/InvoicePreviewPage').then((m) => ({ default: m.InvoicePreviewPage })),
)
const FinancesGlobalPage = lazy(() =>
  import('@/pages/FinancesGlobalPage').then((m) => ({ default: m.FinancesGlobalPage })),
)
const PropositionsGlobalPage = lazy(() =>
  import('@/pages/PropositionsGlobalPage').then((m) => ({ default: m.PropositionsGlobalPage })),
)
const ParametresPage = lazy(() =>
  import('@/pages/ParametresPage').then((m) => ({ default: m.ParametresPage })),
)

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootGate />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route element={<AppLayout />}>
        <Route path="aujourdhui" element={<AujourdHuiPage />} />

        <Route path="mariages">
          <Route index element={<MariagesListPage />} />
          <Route path="nouveau" element={<NewWeddingPage />} />
          <Route path=":weddingId" element={<WeddingLayout />}>
            <Route index element={<WeddingOverviewTab />} />
            <Route path="planning" element={<WeddingPlanningTab />} />
            <Route path="taches" element={<WeddingTasksTab />} />
            <Route path="prestataires" element={<WeddingVendorsTab />} />
            <Route path="finances" element={<WeddingFinancesTab />} />
            <Route path="documents" element={<WeddingDocumentsTab />} />
            <Route path="prestations" element={<WeddingSoldServicesTab />} />
            <Route path="materiel" element={<WeddingEquipmentTab />} />
            <Route path="jour-j" element={<WeddingDayOfTab />} />
            <Route path="demontage" element={<WeddingBreakdownTab />} />
            <Route path="documents/propositions/:proposalId" element={<ProposalBuilderPage />} />
            <Route path="documents/factures/:invoiceId" element={<InvoicePreviewPage />} />
          </Route>
        </Route>

        <Route path="calendrier" element={<CalendrierGlobalPage />} />
        <Route path="taches" element={<TachesGlobalPage />} />
        <Route path="prestataires" element={<PrestatairesGlobalPage />} />
        <Route path="propositions" element={<PropositionsGlobalPage />} />
        <Route path="finances" element={<FinancesGlobalPage />} />
        <Route path="parametres" element={<ParametresPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
