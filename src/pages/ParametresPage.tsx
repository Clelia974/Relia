import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload, X } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ProposalTemplateForm } from '@/features/proposals/components/ProposalTemplateForm'
import { readFileAsDataUrl } from '@/lib/readFileAsDataUrl'
import { VAT_STATUS_LABELS, VAT_STATUS_OPTIONS, vatApplies } from '@/lib/vatStatus'
import { exportWorkspaceToFile, parseWorkspaceFile } from '@/lib/workspace/importExport'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { BusinessConfig, ProposalTemplate, VatStatus, Workspace } from '@/types/entities'

const DEFAULT_BRAND_COLOR = '#9C6B3F'
const MAX_LOGO_FILE_SIZE = 1024 * 1024

export function ParametresPage() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const replaceWorkspace = useWorkspaceStore((s) => s.replaceWorkspace)
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace)
  const updateUserProfile = useWorkspaceStore((s) => s.updateUserProfile)
  const updateBusinessConfig = useWorkspaceStore((s) => s.updateBusinessConfig)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)
  const updateProposalTemplate = useWorkspaceStore((s) => s.updateProposalTemplate)

  const [displayName, setDisplayName] = useState(workspace.userProfile.displayName)

  const saveDisplayName = () => {
    const trimmed = displayName.trim()
    if (trimmed === workspace.userProfile.displayName) return
    updateUserProfile({ displayName: trimmed })
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
  const [resetOpen, setResetOpen] = useState(false)
  const [resetMode, setResetMode] = useState<'empty' | 'demo'>('empty')

  const logoInputRef = useRef<HTMLInputElement>(null)
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
    const dataUrl = await readFileAsDataUrl(file)
    saveBusinessField({ logoDataUrl: dataUrl })
  }
  const removeLogo = () => saveBusinessField({ logoDataUrl: undefined })

  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate | null>(null)
  const handleTemplateSubmit = (values: { label: string; tagline: string; lines: ProposalTemplate['lines'] }) => {
    if (!editingTemplate) return
    updateProposalTemplate(editingTemplate.tier, { label: values.label, tagline: values.tagline || undefined, lines: values.lines })
    setEditingTemplate(null)
    toast.success('Formule mise à jour.')
  }

  const handleExport = () => {
    exportWorkspaceToFile(workspace)
    toast.success('Vos données ont été exportées.')
  }

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const result = await parseWorkspaceFile(file)
    if (!result.ok) {
      toast.error('Ce fichier ne semble pas être une sauvegarde Relia valide.', { description: result.reason })
      return
    }
    setPendingImport(result.workspace)
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
          <CardTitle>Profil</CardTitle>
          <CardDescription>Utilisé pour vous saluer sur le tableau de bord « Aujourd'hui ».</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 sm:w-80">
          <Label htmlFor="display-name">Votre prénom</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={saveDisplayName}
            placeholder="Ex. Clélia"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entreprise</CardTitle>
          <CardDescription>Utilisé sur vos propositions et factures indicatives.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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
                <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                  <Upload className="size-4" aria-hidden="true" />
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
                <input
                  id="biz-brand-color"
                  type="color"
                  value={workspace.businessConfig.brandColor ?? DEFAULT_BRAND_COLOR}
                  onChange={(e) => saveBusinessField({ brandColor: e.target.value })}
                  className="h-9 w-14 rounded-md border border-border bg-transparent p-1"
                />
                {workspace.businessConfig.brandColor && (
                  <Button type="button" variant="outline" size="sm" onClick={() => saveBusinessField({ brandColor: undefined })}>
                    Réinitialiser
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Remplace l'accent Relia par défaut sur vos documents.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formules de devis</CardTitle>
          <CardDescription>Ces 3 formules préconfigurent les lignes proposées à la création d'un devis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {proposalTemplates.map((template) => (
            <Card key={template.tier}>
              <CardContent className="flex flex-col gap-2">
                <p className="font-heading text-lg font-semibold text-foreground">{template.label}</p>
                {template.tagline && <p className="text-sm text-muted-foreground">{template.tagline}</p>}
                <p className="text-xs text-muted-foreground">
                  {template.lines.length} ligne{template.lines.length !== 1 ? 's' : ''} préconfigurée{template.lines.length !== 1 ? 's' : ''}
                </p>
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setEditingTemplate(template)}>
                  Modifier les lignes
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vos données</CardTitle>
          <CardDescription>
            Tout reste dans ce navigateur — aucun serveur. Exportez régulièrement une sauvegarde pour ne rien perdre.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button onClick={handleExport}>
            <Download className="size-4" aria-hidden="true" />
            Exporter mes données
          </Button>

          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
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

      {editingTemplate && (
        <ProposalTemplateForm
          key={editingTemplate.tier}
          open={editingTemplate !== null}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
          template={editingTemplate}
          onSubmit={handleTemplateSubmit}
        />
      )}
    </div>
  )
}
