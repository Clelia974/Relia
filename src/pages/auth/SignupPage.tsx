import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { AuthErrorMessage } from '@/features/auth/components/AuthErrorMessage'
import { Field } from '@/features/auth/components/Field'
import { emptySignupFormValues, SignupFormSchema, type SignupFormValues } from '@/features/auth/authForm.schema'
import { supabase } from '@/lib/supabase'

export function SignupPage() {
  const [values, setValues] = useState<SignupFormValues>(emptySignupFormValues())
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)

  const setField = <K extends keyof SignupFormValues>(key: K, value: SignupFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const result = SignupFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SignupFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: { emailRedirectTo: `${window.location.origin}/aujourdhui` },
    })
    setLoading(false)
    if (error) {
      setFormError(error.message)
      return
    }
    setConfirmationSentTo(result.data.email)
  }

  if (confirmationSentTo) {
    return (
      <AuthCard title="Vérifiez votre email">
        <p className="text-sm text-foreground/85">
          Nous avons envoyé un lien de confirmation à <strong>{confirmationSentTo}</strong>. Cliquez dessus pour activer votre compte.
        </p>
        <Button asChild className="mt-5 w-full">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Créer un compte">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <AuthErrorMessage message={formError} />

        <Field label="Email" htmlFor="signup-email" error={errors.email}>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
          />
        </Field>

        <Field label="Mot de passe" htmlFor="signup-password" error={errors.password}>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => setField('password', e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'signup-password-error' : undefined}
          />
        </Field>

        <Field label="Confirmer le mot de passe" htmlFor="signup-confirm" error={errors.confirmPassword}>
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'signup-confirm-error' : undefined}
          />
        </Field>

        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Inscription…' : "S'inscrire"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="font-medium text-foreground hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  )
}
