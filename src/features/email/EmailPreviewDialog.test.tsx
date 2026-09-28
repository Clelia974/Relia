import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EmailPreviewDialog } from '@/features/email/EmailPreviewDialog'

afterEach(cleanup)

describe('EmailPreviewDialog', () => {
  it("affiche l'objet et un aperçu du corps avec le nom de la cliente et de l'expéditrice", () => {
    render(
      <EmailPreviewDialog
        open
        onOpenChange={() => {}}
        clientName="Sophie Martin"
        senderName="Atelier Fleur de Lien"
        subject="Votre devis de la part de Atelier Fleur de Lien"
        introText="vous a préparé un devis — vous pouvez le consulter directement en ligne :"
        isSending={false}
        onConfirm={() => {}}
      />,
    )

    expect(screen.getByText(/Objet : Votre devis de la part de Atelier Fleur de Lien/)).toBeInTheDocument()
    expect(screen.getByText(/Bonjour Sophie Martin/)).toBeInTheDocument()
    expect(screen.getByText(/Atelier Fleur de Lien vous a préparé un devis/)).toBeInTheDocument()
  })

  it("insère le message personnalisé dans l'aperçu et le transmet à la confirmation", () => {
    const onConfirm = vi.fn()
    render(
      <EmailPreviewDialog
        open
        onOpenChange={() => {}}
        clientName="Sophie Martin"
        senderName="Atelier Fleur de Lien"
        subject="Votre devis"
        introText="vous a préparé un devis :"
        isSending={false}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Message personnalisé/), { target: { value: 'Merci pour votre patience !' } })
    expect(screen.getByText('Merci pour votre patience !')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
    expect(onConfirm).toHaveBeenCalledWith('Merci pour votre patience !')
  })

  it('utilise le libellé de confirmation personnalisé quand fourni (ex. "Relancer")', () => {
    render(
      <EmailPreviewDialog
        open
        onOpenChange={() => {}}
        clientName="Sophie Martin"
        senderName="Atelier Fleur de Lien"
        subject="Rappel"
        introText="vous envoie un rappel :"
        isSending={false}
        onConfirm={() => {}}
        confirmLabel="Relancer"
      />,
    )

    expect(screen.getByRole('button', { name: 'Relancer' })).toBeInTheDocument()
  })

  it('"Annuler" ferme la boîte de dialogue sans confirmer', () => {
    const onOpenChange = vi.fn()
    const onConfirm = vi.fn()
    render(
      <EmailPreviewDialog
        open
        onOpenChange={onOpenChange}
        clientName="Sophie Martin"
        senderName="Atelier Fleur de Lien"
        subject="Votre devis"
        introText="vous a préparé un devis :"
        isSending={false}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
