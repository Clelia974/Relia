import { describe, expect, it } from 'vitest'
import { applyContractStatus } from '@/lib/contractStatus'

const today = '2026-09-20T00:00:00.000Z'

describe('applyContractStatus', () => {
  it("un contrat envoyé reçoit la date d'aujourd'hui si elle manque", () => {
    expect(applyContractStatus(undefined, 'envoye', today)).toEqual({ status: 'envoye', sentAt: today, notes: undefined })
  })

  it("garde la date d'envoi déjà saisie", () => {
    const previous = { status: 'envoye' as const, sentAt: '2026-09-01T00:00:00.000Z' }
    expect(applyContractStatus(previous, 'signe', today)).toMatchObject({ status: 'signe', sentAt: '2026-09-01T00:00:00.000Z', signedAt: today })
  })

  it('signer directement propose aussi la date d\'envoi', () => {
    expect(applyContractStatus(undefined, 'signe', today)).toMatchObject({ sentAt: today, signedAt: today })
  })

  it('revenir en arrière efface la date de signature, puis les dates à "à rédiger"', () => {
    const signed = { status: 'signe' as const, sentAt: '2026-09-01T00:00:00.000Z', signedAt: '2026-09-10T00:00:00.000Z', notes: 'RAS' }
    expect(applyContractStatus(signed, 'envoye', today)).toEqual({ status: 'envoye', sentAt: '2026-09-01T00:00:00.000Z', notes: 'RAS' })
    expect(applyContractStatus(signed, 'a_rediger', today)).toEqual({ status: 'a_rediger', notes: 'RAS' })
  })

  it('conserve toujours les notes', () => {
    expect(applyContractStatus({ status: 'a_rediger', notes: 'Clause à revoir' }, 'signe', today).notes).toBe('Clause à revoir')
  })
})
