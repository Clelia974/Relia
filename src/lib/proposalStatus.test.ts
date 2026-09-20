import { describe, expect, it } from 'vitest'
import {
  EDITABLE_PROPOSAL_STATUSES,
  FINAL_PROPOSAL_STATUSES,
  isProposalEditable,
  isProposalStatusLocked,
  PROPOSAL_STATUS_OPTIONS,
} from '@/lib/proposalStatus'

describe('isProposalEditable', () => {
  it('brouillon et à envoyer restent modifiables', () => {
    expect(isProposalEditable('brouillon')).toBe(true)
    expect(isProposalEditable('a_envoyer')).toBe(true)
  })

  it('envoyée, en attente, approuvée, rejetée, expirée sont en lecture seule', () => {
    expect(isProposalEditable('envoyee')).toBe(false)
    expect(isProposalEditable('en_attente_approbation')).toBe(false)
    expect(isProposalEditable('approuvee')).toBe(false)
    expect(isProposalEditable('rejetee')).toBe(false)
    expect(isProposalEditable('expiree')).toBe(false)
  })

  it('EDITABLE_PROPOSAL_STATUSES ne contient que des valeurs de PROPOSAL_STATUS_OPTIONS', () => {
    for (const status of EDITABLE_PROPOSAL_STATUSES) {
      expect(PROPOSAL_STATUS_OPTIONS).toContain(status)
    }
  })
})

describe('isProposalStatusLocked (Phase 2b — verrou définitif)', () => {
  it('approuvée, rejetée et expirée sont verrouillées : plus aucun changement de statut', () => {
    expect(isProposalStatusLocked('approuvee')).toBe(true)
    expect(isProposalStatusLocked('rejetee')).toBe(true)
    expect(isProposalStatusLocked('expiree')).toBe(true)
  })

  it("envoyée et en attente d'approbation peuvent encore changer de statut librement", () => {
    expect(isProposalStatusLocked('envoyee')).toBe(false)
    expect(isProposalStatusLocked('en_attente_approbation')).toBe(false)
  })

  it('brouillon et à envoyer ne sont jamais verrouillés', () => {
    expect(isProposalStatusLocked('brouillon')).toBe(false)
    expect(isProposalStatusLocked('a_envoyer')).toBe(false)
  })

  it('FINAL_PROPOSAL_STATUSES ne contient que des valeurs de PROPOSAL_STATUS_OPTIONS', () => {
    for (const status of FINAL_PROPOSAL_STATUSES) {
      expect(PROPOSAL_STATUS_OPTIONS).toContain(status)
    }
  })
})
