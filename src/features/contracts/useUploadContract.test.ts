import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useUploadContract } from '@/features/contracts/useUploadContract'

const uploadMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { storage: { from: () => ({ upload: uploadMock }) } } }))

beforeEach(() => {
  uploadMock.mockReset().mockResolvedValue({ error: null })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useUploadContract', () => {
  it("uploade sous le dossier de l'utilisatrice, avec un nom de fichier assaini et un préfixe imprévisible", async () => {
    const { result } = renderHook(() => useUploadContract())
    const file = new File(['%PDF-1.4'], 'contrat final (v2).pdf', { type: 'application/pdf' })

    let outcome: { storagePath: string; fileName: string } | null = null
    await act(async () => {
      outcome = await result.current.uploadContract('u1', file)
    })

    expect(outcome).not.toBeNull()
    expect(outcome!.fileName).toBe('contrat final (v2).pdf')
    expect(outcome!.storagePath).toMatch(/^u1\/[0-9a-f-]+-contrat_final__v2_\.pdf$/)
    expect(uploadMock).toHaveBeenCalledWith(outcome!.storagePath, file, { contentType: 'application/pdf' })
  })

  it("expose une erreur lisible si l'upload échoue", async () => {
    uploadMock.mockResolvedValue({ error: new Error('Bucket indisponible') })
    const { result } = renderHook(() => useUploadContract())
    const file = new File(['%PDF-1.4'], 'contrat.pdf', { type: 'application/pdf' })

    let outcome: { storagePath: string; fileName: string } | null = { storagePath: 'x', fileName: 'x' }
    await act(async () => {
      outcome = await result.current.uploadContract('u1', file)
    })

    expect(outcome).toBeNull()
    expect(result.current.error).toBe('Bucket indisponible')
  })
})
