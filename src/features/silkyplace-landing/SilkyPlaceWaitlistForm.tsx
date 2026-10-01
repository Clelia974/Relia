import { type FormEvent, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SP_BUTTON } from '@/features/landing/brandColors'
import { cn } from '@/lib/utils'
import { useJoinSilkyPlaceWaitlist } from '@/features/silkyplace-landing/useJoinSilkyPlaceWaitlist'

interface SilkyPlaceWaitlistFormProps {
  id?: string
  className?: string
  inverted?: boolean
  submitLabel?: string
}

/** Formulaire d'inscription réutilisé partout sur la landing (hero, appel final) — un seul point d'envoi vers api/waitlist.ts. */
export function SilkyPlaceWaitlistForm({ id, className, inverted, submitLabel = 'Je veux rejoindre SilkyPlace' }: SilkyPlaceWaitlistFormProps) {
  const { join, isLoading, error } = useJoinSilkyPlaceWaitlist()
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
      <div id={id} className={cn('flex items-center gap-2.5 text-sm font-medium', inverted ? 'text-[#DDE6EF]' : 'text-success', className)}>
        <Check className="size-5 shrink-0" aria-hidden="true" />
        Merci ! Tu seras informée dès que SilkyPlace avance.
      </div>
    )
  }

  return (
    <form id={id} onSubmit={handleSubmit} className={cn('flex w-full flex-col gap-2 sm:flex-row', className)} noValidate>
      <label htmlFor={`${id ?? 'silkyplace'}-email`} className="sr-only">
        Adresse email
      </label>
      <Input
        id={`${id ?? 'silkyplace'}-email`}
        type="email"
        required
        placeholder="ton@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={Boolean(error)}
        className={cn('h-12 text-base', inverted && 'bg-card text-foreground')}
      />
      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className={cn('h-12 shrink-0 px-6', inverted ? 'bg-card text-[#520C0C] hover:bg-card' : SP_BUTTON)}
      >
        {isLoading ? 'Inscription…' : submitLabel}
      </Button>
      {error && <p className="text-sm text-risk sm:basis-full">{error}</p>}
    </form>
  )
}
