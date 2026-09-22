import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { AuthErrorMessage } from '@/features/auth/components/AuthErrorMessage'
import { Field } from '@/features/auth/components/Field'
import {
  emptyPasswordUpdateFormValues,
  PasswordUpdateFormSchema,
  type PasswordUpdateFormValues,
} from '@/features/auth/authForm.schema'
import { supabase } from '@/lib/supabase'

/**
 * Le lien de réinitialisation Supabase pose une session de récupération
 * côté client avant l'arrivée sur cette page (fragment d'URL consommé par
 * le SDK) — on vérifie juste qu'une session existe au montage, sans
 * chercher à parser le fragment nous-mêmes.
 */
export function PasswordUpdatePage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<PasswordUpdateFormValues>(emptyPasswordUpdateFormValues())
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordUpdateFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(session !== null))
  }, [])

  const setField = <K extends keyof PasswordUpdateFormValues>(key: K, value: PasswordUpdateFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const result = PasswordUpdateFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PasswordUpdateFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PasswordUpdateFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: result.data.password })
    setLoading(false)
    if (error) {
      setFormError(error.message)
      return
    }
    navigate('/connexion', { replace: true })
  }

  if (hasSession === false) {
    return (
      <AuthCard title="Lien invalide ou expiré">
        <Button asChild className="w-full">
          <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Nouveau mot de passe">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <AuthErrorMessage message={formError} />

        <Field label="Nouveau mot de passe" htmlFor="update-password" error={errors.password}>
          <Input
            id="update-password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => setField('password', e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'update-password-error' : undefined}
          />
        </Field>

        <Field label="Confirmer" htmlFor="update-confirm" error={errors.confirmPassword}>
          <Input
            id="update-confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'update-confirm-error' : undefined}
          />
        </Field>

        <Button type="submit" disabled={loading || hasSession !== true} className="mt-1 w-full">
          {loading ? 'Mise à jour…' : 'Mettre à jour'}
        </Button>
      </form>
    </AuthCard>
  )
}
