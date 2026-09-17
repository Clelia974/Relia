import { z } from 'zod'

/** Champ montant issu d'un input texte : vide autorisé, sinon nombre positif. Message paramétrable par formulaire. */
export function optionalPositiveAmount(message: string) {
  return z
    .string()
    .trim()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), { message })
}

/** Champ montant obligatoire et strictement positif — jamais vide, jamais zéro ou négatif. */
export function requiredPositiveAmount(message: string) {
  return z
    .string()
    .trim()
    .refine((v) => v !== '' && !Number.isNaN(Number(v)) && Number(v) > 0, { message })
}
