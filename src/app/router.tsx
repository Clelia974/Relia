import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { AujourdHuiPage } from '@/pages/AujourdHuiPage'
import { NewWeddingPage } from '@/pages/mariages/NewWeddingPage'
import { WeddingLayout } from '@/pages/mariages/WeddingLayout'
import { WeddingOverviewTab } from '@/pages/mariages/WeddingOverviewTab'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { RootGate } from '@/pages/RootGate'
import { LoginPage } from '@/pages/auth/LoginPage'
import { PasswordResetPage } from '@/pages/auth/PasswordResetPage'
import { PasswordUpdatePage } from '@/pages/auth/PasswordUpdatePage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { CookiesPage } from '@/pages/legal/CookiesPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { RefundPage } from '@/pages/legal/RefundPage'
import { TermsPage } from '@/pages/legal/TermsPage'

// Chargées à la demande : pages lourdes (Gantt, calculs de proposition/facture,
// calendrier) peu visitées au premier chargement — cf. Phase 10.
const CalendrierGlobalPage = lazy(() =>
  import('@/pages/CalendrierGlobalPage').then((m) => ({ default: m.CalendrierGlobalPage })),
)
// Chargées à la demande : pas la route d'atterrissage, jamais importées
// ailleurs que par ce routeur (cf. audit de performance) — sûres à retirer
// du chunk initial sans risque de rendu synchrone dupliqué.
const MariagesListPage = lazy(() =>
  import('@/pages/mariages/MariagesListPage').then((m) => ({ default: m.MariagesListPage })),
)
const WeddingTasksTab = lazy(() =>
  import('@/pages/mariages/WeddingTasksTab').then((m) => ({ default: m.WeddingTasksTab })),
)
const WeddingVendorsTab = lazy(() =>
  import('@/pages/mariages/WeddingVendorsTab').then((m) => ({ default: m.WeddingVendorsTab })),
)
const TachesGlobalPage = lazy(() =>
  import('@/pages/TachesGlobalPage').then((m) => ({ default: m.TachesGlobalPage })),
)
const PrestatairesGlobalPage = lazy(() =>
  import('@/pages/PrestatairesGlobalPage').then((m) => ({ default: m.PrestatairesGlobalPage })),
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
const WeddingClosingTab = lazy(() =>
  import('@/pages/mariages/WeddingClosingTab').then((m) => ({ default: m.WeddingClosingTab })),
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
const PaymentPage = lazy(() => import('@/pages/PaymentPage').then((m) => ({ default: m.PaymentPage })))

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootGate />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireWorkspace={false}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<SignupPage />} />
      <Route path="/mot-de-passe-oublie" element={<PasswordResetPage />} />
      <Route path="/nouveau-mot-de-passe" element={<PasswordUpdatePage />} />
      <Route path="/confidentialite" element={<PrivacyPage />} />
      <Route path="/conditions" element={<TermsPage />} />
      <Route path="/remboursement" element={<RefundPage />} />
      <Route path="/cookies" element={<CookiesPage />} />

      <Route
        element={
          <ProtectedRoute requireWorkspace>
            <AppLayout />
          </ProtectedRoute>
        }
      >
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
            <Route path="cloture" element={<WeddingClosingTab />} />
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
        <Route path="paiement" element={<PaymentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
