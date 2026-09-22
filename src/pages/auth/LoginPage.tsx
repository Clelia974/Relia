import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/features/auth/components/AuthCard'
import { emptyLoginFormValues, LoginFormSchema, type LoginFormValues } from '@/features/auth/authForm.schema'
import { AuthErrorMessage } from '@/features/auth/components/AuthErrorMessage'
import { Field } from '@/features/auth/components/Field'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginFormValues>(emptyLoginFormValues())
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const setField = <K extends keyof LoginFormValues>(key: K, value: LoginFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const result = LoginFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoginFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(result.data)
    setLoading(false)
    if (error) {
      setFormError(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message)
      return
    }
    // ProtectedRoute (une fois branché) redirigera vers /onboarding ou l'app selon l'espace de travail.
    navigate('/aujourdhui')
  }

  return (
    <AuthCard title="Se connecter">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <AuthErrorMessage message={formError} />

        <Field label="Email" htmlFor="login-email" error={errors.email}>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
        </Field>

        <Field label="Mot de passe" htmlFor="login-password" error={errors.password}>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => setField('password', e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
        </Field>

        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 text-sm">
        <Link to="/mot-de-passe-oublie" className="text-muted-foreground hover:text-foreground hover:underline">
          Mot de passe oublié ?
        </Link>
        <p className="text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-medium text-foreground hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
