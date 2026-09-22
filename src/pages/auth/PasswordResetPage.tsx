import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { AuthErrorMessage } from '@/features/auth/components/AuthErrorMessage'
import { Field } from '@/features/auth/components/Field'
import {
  emptyPasswordResetRequestValues,
  PasswordResetRequestSchema,
  type PasswordResetRequestValues,
} from '@/features/auth/authForm.schema'
import { supabase } from '@/lib/supabase'

export function PasswordResetPage() {
  const [values, setValues] = useState<PasswordResetRequestValues>(emptyPasswordResetRequestValues())
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const result = PasswordResetRequestSchema.safeParse(values)
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message)
      return
    }
    setFieldError(undefined)
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(result.data.email, {
      redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthCard title="Email envoyé">
        <p className="text-sm text-foreground/85">Vérifiez votre boîte mail pour le lien de réinitialisation.</p>
        <Button asChild className="mt-5 w-full">
          <Link to="/connexion">Retour à la connexion</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Mot de passe oublié" description="Recevez un lien pour choisir un nouveau mot de passe.">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <AuthErrorMessage message={error} />

        <Field label="Email" htmlFor="reset-email" error={fieldError}>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues({ email: e.target.value })}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'reset-email-error' : undefined}
          />
        </Field>

        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link to="/connexion" className="text-muted-foreground hover:text-foreground hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  )
}
