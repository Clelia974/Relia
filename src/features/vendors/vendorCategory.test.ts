import { beforeEach, describe, expect, it } from 'vitest'
import { VENDOR_CATEGORIES } from '@/lib/vendorCategory'
import { emptyVendorFormValues, VendorFormSchema } from '@/features/vendors/vendorForm.schema'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Régression : une catégorie sélectionnée dans le formulaire prestataire doit
 * survivre intacte à travers le schéma de formulaire, la création (addVendor)
 * et la mise à jour (updateVendor) — sans substitution par une autre valeur
 * de la liste VENDOR_CATEGORIES.
 */
describe('catégorie de prestataire', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it.each(['Fleuriste', 'Éclairagiste'] as const)('VendorFormSchema conserve la catégorie "%s"', (category) => {
    const values = { ...emptyVendorFormValues(), name: 'Test', category, status: 'a_contacter' }
    const result = VendorFormSchema.safeParse(values)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.category).toBe(category)
  })

  it.each(['Fleuriste', 'Éclairagiste'] as const)('addVendor puis updateVendor conservent la catégorie "%s"', (category) => {
    const id = useWorkspaceStore.getState().addVendor({ name: 'Test', category })
    const created = useWorkspaceStore.getState().workspace.vendors.find((v) => v.id === id)
    expect(created?.category).toBe(category)

    useWorkspaceStore.getState().updateVendor(id, { name: 'Test modifié' })
    const updated = useWorkspaceStore.getState().workspace.vendors.find((v) => v.id === id)
    expect(updated?.category).toBe(category)
  })

  it('la liste des catégories ne contient aucun doublon ni valeur vide', () => {
    expect(new Set(VENDOR_CATEGORIES).size).toBe(VENDOR_CATEGORIES.length)
    expect(VENDOR_CATEGORIES.every((c) => c.trim().length > 0)).toBe(true)
  })
})
