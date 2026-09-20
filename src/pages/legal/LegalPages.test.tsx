import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CookiesPage } from '@/pages/legal/CookiesPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { RefundPage } from '@/pages/legal/RefundPage'
import { TermsPage } from '@/pages/legal/TermsPage'

const PAGES = [
  ['confidentialité', PrivacyPage, /Politique de confidentialité/],
  ['conditions', TermsPage, /Conditions d'utilisation/],
  ['remboursement', RefundPage, /Politique de remboursement/],
  ['cookies', CookiesPage, /Cookies et stockage local/],
] as const

describe('pages légales', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(cleanup)

  it.each(PAGES)('%s : affiche son titre, la date de mise à jour et les liens légaux', (_name, Page, title) => {
    render(<MemoryRouter><Page /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy()
    expect(screen.getAllByText(/Dernière mise à jour/).length).toBeGreaterThan(0)
    expect(screen.getByRole('navigation', { name: 'Informations légales' })).toBeTruthy()
  })

  it("le bandeau d'information disparaît après « Compris » et ne revient pas", () => {
    const { unmount } = render(<MemoryRouter><CookiesPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Compris' }))
    expect(screen.queryByRole('region', { name: /cookies/i })).toBeNull()
    unmount()
    render(<MemoryRouter><CookiesPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Compris' })).toBeNull()
  })
})
