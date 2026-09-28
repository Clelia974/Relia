import { type FormEvent, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useJoinOuiWaitlist } from '@/features/oui-landing/useJoinOuiWaitlist'

interface OuiWaitlistFormProps {
  id?: string
  className?: string
  inverted?: boolean
  submitLabel?: string
}

/** Formulaire d'inscription réutilisé partout sur la landing (hero, appel final) — un seul point d'envoi vers api/waitlist.ts. */
export function OuiWaitlistForm({ id, className, inverted, submitLabel = "Je m'inscris" }: OuiWaitlistFormProps) {
  const { join, isLoading, error } = useJoinOuiWaitlist()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    const ok = await join(email.trim())
    if (ok) setSent(true)
  }

  if (sent) {
    return (
      <div id={id} className={cn('flex items-center gap-2.5 text-sm font-medium', inverted ? 'text-primary-foreground' : 'text-success', className)}>
        <Check className="size-5 shrink-0" aria-hidden="true" />
        Merci ! Tu seras informée dès que OUI avance.
      </div>
    )
  }

  return (
    <form id={id} onSubmit={handleSubmit} className={cn('flex w-full flex-col gap-2 sm:flex-row', className)} noValidate>
      <label htmlFor={`${id ?? 'oui'}-email`} className="sr-only">
        Adresse email
      </label>
      <Input
        id={`${id ?? 'oui'}-email`}
        type="email"
        required
        placeholder="ton@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={Boolean(error)}
        className={cn('h-12 text-base', inverted && 'bg-card text-foreground')}
      />
      <Button type="submit" size="lg" disabled={isLoading} className={cn('h-12 shrink-0 px-6', inverted && 'bg-card text-primary hover:bg-card')}>
        {isLoading ? 'Inscription…' : submitLabel}
      </Button>
      {error && <p className="text-sm text-risk sm:basis-full">{error}</p>}
    </form>
  )
}
