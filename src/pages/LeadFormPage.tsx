import { type FormEvent, type ReactNode, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  emptyLeadFormValues,
  LeadFormSchema,
  type LeadFormValues,
} from '@/features/leads/leadForm.schema'
import { LEAD_EVENT_TYPE_LABELS, LEAD_SOURCE_LABELS, LeadEventTypeSchema, LeadSourceSchema } from '@/schemas/lead'
import { useSubmitLead } from '@/features/leads/useSubmitLead'

/**
 * Formulaire public (jamais authentifié) : une prospect n'a pas de compte
 * Relia — lien propre à chaque décoratrice (/lead/new/:userId), à
 * partager elle-même (bio Instagram, réponse WhatsApp…) ou à intégrer
 * directement sur son propre site (lien classique ou iframe).
 *
 * `?embed=1` : sans en-tête Relia ni fond de page — pensé pour un
 * <iframe> encastré dans une autre page, qui a déjà son propre habillage.
 */
export function LeadFormPage() {
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const embed = searchParams.get('embed') === '1'
  const { submitLead, isLoading, error } = useSubmitLead()
  const [values, setValues] = useState<LeadFormValues>(emptyLeadFormValues())
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({})
  const [sent, setSent] = useState(false)

  const setField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  if (!userId) {
    return <BrokenLink />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const result = LeadFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeadFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LeadFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    const ok = await submitLead(userId, result.data)
    if (ok) setSent(true)
  }

  return (
    <div className={cn('flex min-h-dvh flex-col text-foreground', embed ? 'bg-transparent' : 'bg-background')}>
      {!embed && (
        <header className="border-b border-border/60">
          <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-5 sm:px-8">
            <Link to="/" className="flex items-center gap-2" aria-label="Relia — retour à l'accueil">
              <img src="/brand/relia-monogram.svg" alt="" className="size-9" />
              <span className="font-heading text-2xl font-semibold tracking-tight text-primary">Relia</span>
            </Link>
          </div>
        </header>
      )}

      <main className={cn('flex flex-1 items-center justify-center', embed ? 'p-4' : 'px-4 py-10 sm:px-6')}>
        <Card className={cn('w-full max-w-lg', embed && 'border-none shadow-none')}>
          {sent ? (
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <CardTitle className="font-heading text-xl">Merci pour votre demande !</CardTitle>
              <p className="text-sm text-muted-foreground">On revient vers vous très vite.</p>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Faire une demande</CardTitle>
                <p className="text-sm text-muted-foreground">Quelques informations pour vous répondre au mieux.</p>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                  <Field label="Votre nom" htmlFor="clientName" error={errors.clientName}>
                    <Input
                      id="clientName"
                      value={values.clientName}
                      onChange={(e) => setField('clientName', e.target.value)}
                      aria-invalid={Boolean(errors.clientName)}
                    />
                  </Field>

                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                    <Field label="Téléphone" htmlFor="clientPhone" optional>
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={values.clientPhone}
                        onChange={(e) => setField('clientPhone', e.target.value)}
                      />
                    </Field>
                    <Field label="Email" htmlFor="clientEmail" error={errors.clientEmail} optional>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={values.clientEmail}
                        onChange={(e) => setField('clientEmail', e.target.value)}
                        aria-invalid={Boolean(errors.clientEmail)}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                    <Field label="Type d’événement" htmlFor="eventType">
                      <Select
                        value={values.eventType}
                        onValueChange={(v) => setField('eventType', v as LeadFormValues['eventType'])}
                      >
                        <SelectTrigger id="eventType" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LeadEventTypeSchema.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {LEAD_EVENT_TYPE_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Date de l’événement" htmlFor="eventDate" error={errors.eventDate}>
                      <Input
                        id="eventDate"
                        type="date"
                        value={values.eventDate}
                        onChange={(e) => setField('eventDate', e.target.value)}
                        aria-invalid={Boolean(errors.eventDate)}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                    <Field label="Lieu envisagé" htmlFor="venue" optional>
                      <Input id="venue" value={values.venue} onChange={(e) => setField('venue', e.target.value)} />
                    </Field>
                    <Field label="Nombre d’invités" htmlFor="guestCount" error={errors.guestCount} optional>
                      <Input
                        id="guestCount"
                        inputMode="numeric"
                        value={values.guestCount}
                        onChange={(e) => setField('guestCount', e.target.value)}
                        aria-invalid={Boolean(errors.guestCount)}
                      />
                    </Field>
                  </div>

                  <Field label="Budget estimé" htmlFor="budgetEstimate" error={errors.budgetEstimate} optional>
                    <Input
                      id="budgetEstimate"
                      inputMode="decimal"
                      value={values.budgetEstimate}
                      onChange={(e) => setField('budgetEstimate', e.target.value)}
                      aria-invalid={Boolean(errors.budgetEstimate)}
                    />
                  </Field>

                  <Field label="Votre message" htmlFor="message" optional>
                    <Textarea
                      id="message"
                      rows={3}
                      value={values.message}
                      onChange={(e) => setField('message', e.target.value)}
                    />
                  </Field>

                  <Field label="Comment nous avez-vous trouvé ?" htmlFor="source">
                    <Select value={values.source} onValueChange={(v) => setField('source', v as LeadFormValues['source'])}>
                      <SelectTrigger id="source" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LeadSourceSchema.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {LEAD_SOURCE_LABELS[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {error && <p className="text-sm text-risk">{error}</p>}

                  <Button type="submit" disabled={isLoading} className="mt-1">
                    {isLoading ? 'Envoi…' : 'Envoyer ma demande'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </div>
  )
}

function BrokenLink() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="font-heading text-xl font-semibold text-foreground">Lien invalide</h1>
      <p className="text-sm text-muted-foreground">Ce lien de contact est incomplet ou incorrect.</p>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(facultatif)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-risk">
          {error}
        </p>
      )}
    </div>
  )
}
