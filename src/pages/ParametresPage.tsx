import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CloudDownload, CloudUpload, Download, Palette, RotateCcw, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ProposalTemplateForm } from '@/features/proposals/components/ProposalTemplateForm'
import { useRestoreFromCloud } from '@/features/sync/useRestoreFromCloud'
import { useSyncToCloud } from '@/features/sync/useSyncToCloud'
import { TaskTemplateForm } from '@/features/tasks/components/TaskTemplateForm'
import { ImportWeddingsFromExcel } from '@/features/weddings/components/ImportWeddingsFromExcel'
import { readFileAsDataUrl } from '@/lib/readFileAsDataUrl'
import { VAT_STATUS_LABELS, VAT_STATUS_OPTIONS, vatApplies } from '@/lib/vatStatus'
import { exportWorkspaceToFile, parseWorkspaceFile } from '@/lib/workspace/importExport'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { BusinessConfig, ProposalTemplate, ProposalTier, VatStatus, Workspace } from '@/types/entities'

const DEFAULT_BRAND_COLOR = '#9C6B3F'
const MAX_LOGO_FILE_SIZE = 1024 * 1024

export function ParametresPage() {
  const { syncNow, isSyncing, error: syncError, lastSyncedAt } = useSyncToCloud()
  const { restoreNow, isRestoring, error: restoreError } = useRestoreFromCloud()

  const workspace = useWorkspaceStore((s) => s.workspace)
  const replaceWorkspace = useWorkspaceStore((s) => s.replaceWorkspace)
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace)
  const updateUserProfile = useWorkspaceStore((s) => s.updateUserProfile)
  const updateBusinessConfig = useWorkspaceStore((s) => s.updateBusinessConfig)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)
  const updateProposalTemplate = useWorkspaceStore((s) => s.updateProposalTemplate)
  const taskTemplate = useWorkspaceStore((s) => s.workspace.taskTemplate)
  const setTaskTemplate = useWorkspaceStore((s) => s.setTaskTemplate)

  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const [displayName, setDisplayName] = useState(workspace.userProfile.displayName)
  const [lastName, setLastName] = useState(workspace.userProfile.lastName ?? '')

  const saveDisplayName = () => {
    const trimmed = displayName.trim()
    if (trimmed === workspace.userProfile.displayName) return
    updateUserProfile({ displayName: trimmed })
    toast.success('Votre profil a été mis à jour.')
  }

  const saveLastName = () => {
    const trimmed = lastName.trim()
    if (trimmed === (workspace.userProfile.lastName ?? '')) return
    updateUserProfile({ lastName: trimmed || undefined })
    toast.success('Votre profil a été mis à jour.')
  }

  const [business, setBusiness] = useState(() => ({
    companyName: workspace.businessConfig.companyName,
    address: workspace.businessConfig.address ?? '',
    siret: workspace.businessConfig.siret ?? '',
    phone: workspace.businessConfig.phone ?? '',
    email: workspace.businessConfig.email ?? '',
    vatRate: workspace.businessConfig.vatRate !== undefined ? String(workspace.businessConfig.vatRate) : '',
    legalMentions: workspace.businessConfig.legalMentions ?? '',
  }))
  const setBusinessField = <K extends keyof typeof business>(key: K, value: (typeof business)[K]) => {
    setBusiness((b) => ({ ...b, [key]: value }))
  }

  const saveBusinessField = (patch: Partial<Omit<BusinessConfig, 'id'>>) => {
    updateBusinessConfig(patch)
    toast.success("Les informations de l'entreprise ont été mises à jour.")
  }

  const handleVatStatusChange = (value: string) => {
    updateBusinessConfig({ vatStatus: value as VatStatus })
    toast.success("Les informations de l'entreprise ont été mises à jour.")
  }

  const saveVatRate = () => {
    const trimmed = business.vatRate.trim()
    const parsed = trimmed === '' ? undefined : Number(trimmed)
    if (parsed !== undefined && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) {
      toast.error('Veuillez saisir un taux de TVA valide (entre 0 et 100).')
      setBusinessField('vatRate', workspace.businessConfig.vatRate !== undefined ? String(workspace.businessConfig.vatRate) : '')
      return
    }
    saveBusinessField({ vatRate: parsed })
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<Workspace | null>(null)
  const [pendingCloudRestore, setPendingCloudRestore] = useState<Workspace | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetMode, setResetMode] = useState<'empty' | 'demo'>('empty')

  const handleRestoreClick = async () => {
    const workspace = await restoreNow()
    if (workspace) setPendingCloudRestore(workspace)
  }
  const confirmCloudRestore = () => {
    if (!pendingCloudRestore) return
    replaceWorkspace(pendingCloudRestore)
    setPendingCloudRestore(null)
    toast.success('Votre sauvegarde en ligne a été restaurée.')
  }

  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const handleLogoChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez choisir un fichier image.')
      return
    }
    if (file.size > MAX_LOGO_FILE_SIZE) {
      toast.error('Le logo doit faire moins de 1 Mo.')
      return
    }
    setIsLogoUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      saveBusinessField({ logoDataUrl: dataUrl })
    } finally {
      setIsLogoUploading(false)
    }
  }
  const removeLogo = () => saveBusinessField({ logoDataUrl: undefined })

  const brandColorInputRef = useRef<HTMLInputElement>(null)

  const [expandedTier, setExpandedTier] = useState<ProposalTier | null>(null)
  const handleTemplateSubmit = (values: { label: string; tagline: string; showOnDocuments: boolean; lines: ProposalTemplate['lines'] }) => {
    if (!expandedTier) return
    updateProposalTemplate(expandedTier, { label: values.label, tagline: values.tagline || undefined, showOnDocuments: values.showOnDocuments, lines: values.lines })
    setExpandedTier(null)
    toast.success('Formule mise à jour.')
  }

  const [isEditingTaskTemplate, setIsEditingTaskTemplate] = useState(false)
  const handleTaskTemplateSubmit = (items: Workspace['taskTemplate']) => {
    setTaskTemplate(items)
    setIsEditingTaskTemplate(false)
    toast.success('Checklist de démarrage mise à jour.')
  }

  const handleExport = () => {
    exportWorkspaceToFile(workspace)
    toast.success('Vos données ont été exportées.')
  }

  const [isImporting, setIsImporting] = useState(false)
  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsImporting(true)
    try {
      const result = await parseWorkspaceFile(file)
      if (!result.ok) {
        toast.error('Ce fichier ne semble pas être une sauvegarde Relia valide.', { description: result.reason })
        return
      }
      setPendingImport(result.workspace)
    } finally {
      setIsImporting(false)
    }
  }

  const confirmImport = () => {
    if (!pendingImport) return
    replaceWorkspace(pendingImport)
    setPendingImport(null)
    toast.success('Votre sauvegarde a été importée.')
  }

  const confirmReset = () => {
    resetWorkspace(resetMode)
    setResetOpen(false)
    toast.success(resetMode === 'demo' ? 'Données de démonstration rechargées.' : 'Vos données ont été réinitialisées.')
  }

  const summary = `${workspace.weddings.length} mariage${workspace.weddings.length !== 1 ? 's' : ''} · ${workspace.tasks.length} tâche${workspace.tasks.length !== 1 ? 's' : ''} enregistrées localement`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil & entreprise</CardTitle>
          <CardDescription>
            Votre identité (tableau de bord « Aujourd'hui ») et les informations utilisées sur vos propositions et
            factures indicatives.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {workspace.businessConfig.logoDataUrl ? (
              <img
                src={workspace.businessConfig.logoDataUrl}
                alt="Logo de l'entreprise"
                className="size-10 shrink-0 rounded-md border border-border object-contain"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                Logo
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {[workspace.userProfile.displayName, workspace.userProfile.lastName].filter(Boolean).join(' ') || 'Profil non renseigné'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {workspace.businessConfig.companyName || 'Entreprise non renseignée'}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setIsEditingProfile(true)}>
            Modifier
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le profil et l'entreprise</DialogTitle>
            <DialogDescription>
              Votre identité (tableau de bord) et les informations utilisées sur vos propositions et factures
              indicatives.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display-name">Votre prénom</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={saveDisplayName}
                placeholder="Ex. Clélia"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="last-name">
                Votre nom <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={saveLastName}
                placeholder="Ex. Dupont"
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-name">Nom de l'entreprise</Label>
              <Input
                id="biz-name"
                value={business.companyName}
                onChange={(e) => setBusinessField('companyName', e.target.value)}
                onBlur={() => saveBusinessField({ companyName: business.companyName.trim() })}
                placeholder="Ex. Atelier Fleur de Lien"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-siret">
                SIRET <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="biz-siret"
                value={business.siret}
                onChange={(e) => setBusinessField('siret', e.target.value)}
                onBlur={() => saveBusinessField({ siret: business.siret.trim() || undefined })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-address">
              Adresse <span className="font-normal text-muted-foreground">(facultatif)</span>
            </Label>
            <Input
              id="biz-address"
              value={business.address}
              onChange={(e) => setBusinessField('address', e.target.value)}
              onBlur={() => saveBusinessField({ address: business.address.trim() || undefined })}
            />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-phone">
                Téléphone <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="biz-phone"
                type="tel"
                value={business.phone}
                onChange={(e) => setBusinessField('phone', e.target.value)}
                onBlur={() => saveBusinessField({ phone: business.phone.trim() || undefined })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-email">
                Email <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="biz-email"
                type="email"
                value={business.email}
                onChange={(e) => setBusinessField('email', e.target.value)}
                onBlur={() => saveBusinessField({ email: business.email.trim() || undefined })}
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-vat-status">Statut de TVA</Label>
              <Select value={workspace.businessConfig.vatStatus} onValueChange={handleVatStatusChange}>
                <SelectTrigger id="biz-vat-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {VAT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vatApplies(workspace.businessConfig.vatStatus) && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="biz-vat-rate">Taux de TVA (%)</Label>
                <Input
                  id="biz-vat-rate"
                  inputMode="decimal"
                  value={business.vatRate}
                  onChange={(e) => setBusinessField('vatRate', e.target.value)}
                  onBlur={saveVatRate}
                  placeholder="Ex. 20"
                />
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Ces informations sont indicatives et doivent être vérifiées avant émission — Relia ne garantit pas leur conformité juridique ou fiscale.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-mentions">
              Mentions légales <span className="font-normal text-muted-foreground">(facultatif)</span>
            </Label>
            <Textarea
              id="biz-mentions"
              rows={2}
              value={business.legalMentions}
              onChange={(e) => setBusinessField('legalMentions', e.target.value)}
              onBlur={() => saveBusinessField({ legalMentions: business.legalMentions.trim() || undefined })}
              placeholder="Ex. TVA non applicable, art. 293 B du CGI"
            />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-logo">
                Logo <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <div className="flex items-center gap-3">
                {workspace.businessConfig.logoDataUrl ? (
                  <img
                    src={workspace.businessConfig.logoDataUrl}
                    alt="Logo de l'entreprise"
                    className="size-12 rounded-md border border-border object-contain"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    Aucun
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isLogoUploading}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {!isLogoUploading && <Upload className="size-4" aria-hidden="true" />}
                  {workspace.businessConfig.logoDataUrl ? 'Changer' : 'Ajouter un logo'}
                </Button>
                {workspace.businessConfig.logoDataUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={removeLogo}>
                    <X className="size-4" aria-hidden="true" />
                    Retirer
                  </Button>
                )}
              </div>
              <input
                ref={logoInputRef}
                id="biz-logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChosen}
              />
              <p className="text-xs text-muted-foreground">Apparaît sur vos propositions et factures indicatives. Format image, 1 Mo maximum.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-brand-color">
                Couleur de marque <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-9 shrink-0 rounded-md border border-border"
                  style={{ backgroundColor: workspace.businessConfig.brandColor ?? DEFAULT_BRAND_COLOR }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => brandColorInputRef.current?.click()}>
                  <Palette className="size-4" aria-hidden="true" />
                  {workspace.businessConfig.brandColor ? 'Changer la couleur' : 'Choisir une couleur'}
                </Button>
                {workspace.businessConfig.brandColor && (
                  <Button type="button" variant="outline" size="sm" onClick={() => saveBusinessField({ brandColor: undefined })}>
                    Réinitialiser
                  </Button>
                )}
                <input
                  ref={brandColorInputRef}
                  id="biz-brand-color"
                  type="color"
                  value={workspace.businessConfig.brandColor ?? DEFAULT_BRAND_COLOR}
                  onChange={(e) => saveBusinessField({ brandColor: e.target.value })}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">Remplace l'accent Relia par défaut sur vos documents.</p>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Formules de devis</CardTitle>
          <CardDescription>Ces 3 formules préconfigurent les lignes proposées à la création d'un devis. Vous pouvez les renommer, ou choisir que leur nom n'apparaisse pas sur les devis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {proposalTemplates.map((template) =>
            expandedTier === template.tier ? (
              <Card key={template.tier} className="sm:col-span-3">
                <CardContent>
                  <ProposalTemplateForm
                    key={template.tier}
                    template={template}
                    onSubmit={handleTemplateSubmit}
                    onCancel={() => setExpandedTier(null)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card key={template.tier}>
                <CardContent className="flex flex-col gap-2">
                  <p className="font-heading text-lg font-semibold text-foreground">{template.label}</p>
                  {template.tagline && <p className="text-sm text-muted-foreground">{template.tagline}</p>}
                  {template.showOnDocuments === false && <p className="text-xs text-muted-foreground">Nom masqué sur les devis</p>}
                  <p className="text-xs text-muted-foreground">
                    {template.lines.length} ligne{template.lines.length !== 1 ? 's' : ''} préconfigurée{template.lines.length !== 1 ? 's' : ''}
                  </p>
                  <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setExpandedTier(template.tier)}>
                    Modifier les formulaires
                  </Button>
                </CardContent>
              </Card>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de démarrage</CardTitle>
          <CardDescription>
            Ces étapes sont ajoutées automatiquement (si vous le souhaitez, case à cocher) à la création d'un nouveau
            mariage, à la date indiquée par rapport à celle du mariage.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {taskTemplate.length} étape{taskTemplate.length !== 1 ? 's' : ''} configurée{taskTemplate.length !== 1 ? 's' : ''}
          </p>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setIsEditingTaskTemplate(true)}>
            Modifier la checklist
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sauvegarde en ligne</CardTitle>
          <CardDescription>
            Vos mariages, tâches, prestataires et finances restent dans ce navigateur. "Sauvegarder maintenant" envoie
            une copie en ligne, à votre demande — restaurée automatiquement dès votre première connexion sur un
            nouvel appareil encore vide. Sur un appareil qui contient déjà des données, utilisez "Restaurer depuis le
            cloud" pour la retirer explicitement (elle remplace tout ce qui est enregistré ici). Ce n'est pas une
            synchronisation en continu : si vous travaillez sur plusieurs appareils, sauvegardez depuis celui où vous
            venez de travailler avant de basculer sur l'autre. Jamais utilisée pendant la Vue Jour J, qui reste
            100&nbsp;% locale.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <Button loading={isSyncing} onClick={syncNow} className="w-fit">
              {!isSyncing && <CloudUpload className="size-4" aria-hidden="true" />}
              Sauvegarder maintenant
            </Button>
            <Button variant="outline" loading={isRestoring} onClick={handleRestoreClick} className="w-fit">
              {!isRestoring && <CloudDownload className="size-4" aria-hidden="true" />}
              Restaurer depuis le cloud
            </Button>
          </div>
          {syncError && <p className="text-sm text-risk">{syncError}</p>}
          {restoreError && <p className="text-sm text-risk">{restoreError}</p>}
          {lastSyncedAt && !syncError && (
            <p className="text-xs text-muted-foreground">
              Dernière sauvegarde : {format(new Date(lastSyncedAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vos données</CardTitle>
          <CardDescription>
            Export/import JSON manuel, en plus de la sauvegarde en ligne ci-dessus.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button onClick={handleExport}>
            <Download className="size-4" aria-hidden="true" />
            Exporter mes données
          </Button>

          <Button variant="outline" loading={isImporting} onClick={() => fileInputRef.current?.click()}>
            {!isImporting && <Upload className="size-4" aria-hidden="true" />}
            Importer une sauvegarde
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChosen}
          />

          <Button variant="outline" className="text-risk hover:text-risk" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Réinitialiser mes données
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importer tes mariages depuis Excel</CardTitle>
          <CardDescription>
            Tu as déjà tes mariages (et tes prestataires) dans un tableur ? Télécharge le modèle, remplis-le (ou copie
            tes données dedans), puis importe-le. Tâches et matériel s'ajoutent ensuite mariage par mariage dans RELIA.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ImportWeddingsFromExcel />
        </CardContent>
      </Card>

      <AlertDialog open={pendingImport !== null} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remplacer vos données actuelles ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce fichier contient {pendingImport?.weddings.length ?? 0} mariage(s) et {pendingImport?.tasks.length ?? 0}{' '}
              tâche(s). L'import remplacera entièrement les données actuellement enregistrées dans ce navigateur —
              cette action est irréversible sans une sauvegarde de vos données actuelles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Importer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingCloudRestore !== null} onOpenChange={(open) => !open && setPendingCloudRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remplacer vos données actuelles ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre dernière sauvegarde en ligne contient {pendingCloudRestore?.weddings.length ?? 0} mariage(s) et{' '}
              {pendingCloudRestore?.tasks.length ?? 0} tâche(s). La restaurer remplacera entièrement les données
              actuellement enregistrées dans ce navigateur — cette action est irréversible sans une sauvegarde de vos
              données actuelles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloudRestore}>Restaurer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser vos données ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les données enregistrées localement dans ce navigateur (mariages, tâches, prestataires, finances)
              seront définitivement supprimées. Exportez une sauvegarde avant de continuer si vous n'êtes pas sûre.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <RadioGroup value={resetMode} onValueChange={(v) => setResetMode(v as 'empty' | 'demo')} className="gap-3">
            <div className="flex items-start gap-2.5">
              <RadioGroupItem value="empty" id="reset-empty" className="mt-0.5" />
              <Label htmlFor="reset-empty" className="flex flex-col gap-0.5 font-normal">
                <span className="text-foreground">Espace vide</span>
                <span className="text-xs font-normal text-muted-foreground">Repartir de zéro, sans aucune donnée.</span>
              </Label>
            </div>
            <div className="flex items-start gap-2.5">
              <RadioGroupItem value="demo" id="reset-demo" className="mt-0.5" />
              <Label htmlFor="reset-demo" className="flex flex-col gap-0.5 font-normal">
                <span className="text-foreground">Données de démonstration</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Recharger des mariages fictifs pour explorer l'application.
                </span>
              </Label>
            </div>
          </RadioGroup>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>Réinitialiser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditingTaskTemplate && (
        <TaskTemplateForm
          open={isEditingTaskTemplate}
          onOpenChange={setIsEditingTaskTemplate}
          template={taskTemplate}
          onSubmit={handleTaskTemplateSubmit}
        />
      )}
    </div>
  )
}
