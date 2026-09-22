import { z } from 'zod'

const email = z.string().trim().min(1, "L'email est obligatoire.").email('Adresse email invalide.')
/** Aligné sur la contrainte imposée côté Supabase Auth (8 caractères minimum). */
const password = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.')

export const LoginFormSchema = z.object({
  email,
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
})
export type LoginFormValues = z.infer<typeof LoginFormSchema>
export function emptyLoginFormValues(): LoginFormValues {
  return { email: '', password: '' }
}

export const SignupFormSchema = z
  .object({ email, password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })
export type SignupFormValues = z.infer<typeof SignupFormSchema>
export function emptySignupFormValues(): SignupFormValues {
  return { email: '', password: '', confirmPassword: '' }
}

export const PasswordResetRequestSchema = z.object({ email })
export type PasswordResetRequestValues = z.infer<typeof PasswordResetRequestSchema>
export function emptyPasswordResetRequestValues(): PasswordResetRequestValues {
  return { email: '' }
}

export const PasswordUpdateFormSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })
export type PasswordUpdateFormValues = z.infer<typeof PasswordUpdateFormSchema>
export function emptyPasswordUpdateFormValues(): PasswordUpdateFormValues {
  return { password: '', confirmPassword: '' }
}
