import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { cn } from '@/lib/utils'
import type { ClosingSession } from '@/types/entities'

interface ClosingFeedbackFormProps {
  weddingId: string
  closing: ClosingSession
}

/** Note et retour client — tous deux facultatifs (cf. ClosingSessionSchema), jamais imposés pour clôturer un mariage. */
export function ClosingFeedbackForm({ weddingId, closing }: ClosingFeedbackFormProps) {
  const updateClientFeedback = useWorkspaceStore((s) => s.updateClientFeedback)
  const [feedback, setFeedback] = useState(closing.clientFeedback ?? '')
  const [rating, setRating] = useState(closing.clientRating ?? 0)

  const dirty = feedback !== (closing.clientFeedback ?? '') || rating !== (closing.clientRating ?? 0)

  const handleSave = () => {
    updateClientFeedback(weddingId, {
      clientFeedback: feedback.trim() || undefined,
      clientRating: rating > 0 ? rating : undefined,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Note du client</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(rating === value ? 0 : value)}
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
              aria-pressed={rating >= value}
              className="text-muted-foreground transition-colors hover:text-thread"
            >
              <Star className={cn('size-6', rating >= value && 'fill-thread text-thread')} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="client-feedback" className="text-sm font-medium text-foreground">
          Retour du client
        </label>
        <Textarea
          id="client-feedback"
          placeholder="Ce que le client a dit sur la prestation…"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />
      </div>

      <Button type="button" onClick={handleSave} disabled={!dirty} className="w-fit">
        Enregistrer le feedback
      </Button>
    </div>
  )
}
