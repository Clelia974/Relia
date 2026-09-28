import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ContractPanel } from '@/features/contracts/components/ContractPanel'
import type { BusinessConfig, Contract } from '@/types/entities'

afterEach(cleanup)

const useAuthMock = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))

const uploadContractMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/contracts/useUploadContract', () => ({
  useUploadContract: () => ({ uploadContract: uploadContractMock, isLoading: false, error: null }),
}))

const shareContratMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/contracts/useShareContrat', () => ({
  useShareContrat: () => ({ shareContrat: shareContratMock, isLoading: false, error: null }),
}))

const businessConfig: BusinessConfig = {
  id: 'b1',
  companyName: 'Atelier Fleur de Lien',
  vatStatus: 'franchise_en_base',
  currency: 'EUR',
}

beforeEach(() => {
  useAuthMock.mockReturnValue({ user: { id: 'u1', email: 'u1@example.com' } })
  uploadContractMock.mockReset().mockResolvedValue({ storagePath: 'u1/uuid-contrat.pdf', fileName: 'contrat.pdf' })
  shareContratMock.mockReset().mockResolvedValue('share-abc')
})

function setup(contract?: Contract, clientEmail?: string) {
  const onChange = vi.fn()
  render(<ContractPanel contract={contract} onChange={onChange} businessConfig={businessConfig} clientName="Sophie Martin" clientEmail={clientEmail} />)
  return onChange
}

describe('ContractPanel', () => {
  it('sans contrat enregistré, le statut affiché est "À rédiger" et aucune date n\'est demandée', () => {
    setup()
    expect(screen.getByRole('radio', { name: 'À rédiger' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByLabelText("Date d'envoi")).toBeNull()
    expect(screen.queryByLabelText('Date de signature')).toBeNull()
  })

  it('passer à "Envoyé au client" enregistre le statut avec une date d\'envoi', () => {
    const onChange = setup()
    fireEvent.click(screen.getByRole('radio', { name: 'Envoyé au client' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'envoye', sentAt: expect.any(String) }))
  })

  it('passer à "Signé" enregistre une date de signature', () => {
    const onChange = setup({ status: 'envoye', sentAt: '2026-09-01T00:00:00.000Z' })
    fireEvent.click(screen.getByRole('radio', { name: 'Signé' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'signe', sentAt: '2026-09-01T00:00:00.000Z', signedAt: expect.any(String) }))
  })

  it('un contrat signé affiche les deux dates et permet de corriger la date de signature', () => {
    const onChange = setup({ status: 'signe', sentAt: '2026-09-01T00:00:00.000Z', signedAt: '2026-09-10T00:00:00.000Z' })
    expect((screen.getByLabelText("Date d'envoi") as HTMLInputElement).value).toBe('2026-09-01')
    expect((screen.getByLabelText('Date de signature') as HTMLInputElement).value).toBe('2026-09-10')
    fireEvent.change(screen.getByLabelText('Date de signature'), { target: { value: '2026-09-12' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'signe', signedAt: new Date('2026-09-12').toISOString() }))
  })

  it("enregistre les notes à la sortie du champ, et seulement si elles ont changé", () => {
    const onChange = setup({ status: 'a_rediger' })
    const notes = screen.getByLabelText(/Notes/)
    fireEvent.blur(notes)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(notes, { target: { value: 'Clause acompte à revoir' } })
    fireEvent.blur(notes)
    expect(onChange).toHaveBeenCalledWith({ status: 'a_rediger', notes: 'Clause acompte à revoir' })
  })

  it("propose d'uploader un PDF, jamais généré par Relia elle-même", () => {
    setup()
    expect(screen.getByRole('button', { name: /Uploader un PDF/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Marquer comme envoyé/ })).not.toBeInTheDocument()
  })

  it('uploader un fichier enregistre son chemin et son nom, sans encore générer de lien', async () => {
    const onChange = setup()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['%PDF-1.4'], 'contrat.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(uploadContractMock).toHaveBeenCalledWith('u1', file))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ storagePath: 'u1/uuid-contrat.pdf', fileName: 'contrat.pdf', shareId: undefined }),
      ),
    )
  })

  it('une fois un fichier présent, "Marquer comme envoyé" génère le lien même sans email client', async () => {
    const onChange = setup({ status: 'a_rediger', storagePath: 'u1/uuid-contrat.pdf', fileName: 'contrat.pdf' })

    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme envoyé' }))

    await waitFor(() => expect(shareContratMock).toHaveBeenCalledWith(expect.objectContaining({ clientEmail: undefined })))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ shareId: 'share-abc' })))
    await waitFor(() => expect(screen.getByText(/\/contrat\/share-abc$/)).toBeInTheDocument())
  })

  it('transmet l’email client au partage quand il est renseigné', async () => {
    setup({ status: 'a_rediger', storagePath: 'u1/uuid-contrat.pdf', fileName: 'contrat.pdf' }, 'sophie@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme envoyé' }))

    // Une adresse client existe : un aperçu de l'email s'ouvre d'abord, jamais un envoi direct au clic.
    const confirmButton = await screen.findByRole('button', { name: 'Envoyer' })
    expect(shareContratMock).not.toHaveBeenCalled()
    fireEvent.click(confirmButton)

    await waitFor(() =>
      expect(shareContratMock).toHaveBeenCalledWith(expect.objectContaining({ clientEmail: 'sophie@example.com' })),
    )
  })
})
