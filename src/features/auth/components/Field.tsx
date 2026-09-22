import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

/** Même contrat que Field dans VendorForm — dupliqué plutôt qu'importé depuis la feature vendors pour éviter un couplage entre features sans rapport. */
export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-risk">
          {error}
        </p>
      )}
    </div>
  )
}
