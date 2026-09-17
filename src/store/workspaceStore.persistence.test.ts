import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/workspace'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Tests d'hydratation/persistance du store (Phase 0 — sécurisation
 * pré-bêta). Chaque scénario a besoin d'un store fraîchement importé, car
 * l'hydratation depuis localStorage n'a lieu qu'une fois, à l'import du
 * module — d'où `vi.resetModules()` + import dynamique avant chaque cas.
 * `persistenceStatus.ts` est importé dans le même lot pour être sûr de
 * lire l'instance utilisée par CE workspaceStore fraîchement importé, et
 * non une instance restée en cache d'un test précédent.
 */

const STORAGE_KEY = 'relia-workspace'
const realLocalStorage = window.localStorage

async function importFreshStore() {
  vi.resetModules()
  const [workspaceMod, persistenceMod] = await Promise.all([
    import('@/store/workspaceStore'),
    import('@/store/persistenceStatus'),
  ])
  return { useWorkspaceStore: workspaceMod.useWorkspaceStore, usePersistenceStatus: persistenceMod.usePersistenceStatus }
}

function replaceLocalStorage(overrides: Partial<Storage>) {
  const fake: Partial<Storage> = {
    getItem: vi.fn(realLocalStorage.getItem.bind(realLocalStorage)),
    setItem: vi.fn(realLocalStorage.setItem.bind(realLocalStorage)),
    removeItem: vi.fn(realLocalStorage.removeItem.bind(realLocalStorage)),
    clear: vi.fn(realLocalStorage.clear.bind(realLocalStorage)),
    ...overrides,
  }
  Object.defineProperty(window, 'localStorage', { value: fake, configurable: true })
  return fake
}

function restoreLocalStorage() {
  Object.defineProperty(window, 'localStorage', { value: realLocalStorage, configurable: true })
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  restoreLocalStorage()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('hydratation — workspace valide', () => {
  it('un workspace valide au schéma courant est chargé tel quel, sans message', async () => {
    const workspace = createEmptyWorkspace()
    workspace.userProfile.displayName = 'Test Utilisatrice'
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { workspace }, version: 0 }))

    const { useWorkspaceStore } = await importFreshStore()
    const state = useWorkspaceStore.getState()

    expect(state.hydrationIssue).toBeNull()
    expect(state.corruptedBackupRaw).toBeNull()
    expect(state.workspace.userProfile.displayName).toBe('Test Utilisatrice')
  })

  it('persiste normalement après une actualisation : une écriture réelle est relue telle quelle par un nouveau chargement du store', async () => {
    const { useWorkspaceStore: firstLoad } = await importFreshStore()
    firstLoad.getState().createWedding({
      coupleName: 'Mariage Persistant',
      date: '2026-09-12T00:00:00.000Z',
      venue: 'Domaine Test',
      soldAmount: 8000,
      clientBudget: 8000,
      status: 'signe',
    })

    // Simule une actualisation de page : nouveau module, même localStorage.
    const { useWorkspaceStore: afterReload } = await importFreshStore()
    const state = afterReload.getState()

    expect(state.hydrationIssue).toBeNull()
    expect(state.workspace.weddings).toHaveLength(1)
    expect(state.workspace.weddings[0]?.coupleName).toBe('Mariage Persistant')
  })
})

describe('hydratation — absence totale de données (première visite)', () => {
  it("localStorage vide (aucune clé) démarre sur un espace vide, sans aucun message d'erreur", async () => {
    // beforeEach a déjà vidé localStorage ; on le revérifie explicitement ici
    // car ce scénario est le cas nominal de la toute première visite.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()

    const { useWorkspaceStore, usePersistenceStatus } = await importFreshStore()
    const state = useWorkspaceStore.getState()

    expect(state.hydrationIssue).toBeNull()
    expect(state.corruptedBackupRaw).toBeNull()
    expect(usePersistenceStatus.getState().persistenceIssue).toBeNull()
    expect(state.workspace.weddings).toEqual([])
  })
})

describe('hydratation — migration réussie', () => {
  it("un workspace v1 (ancien format de dépenses) est migré vers le schéma courant sans message d'erreur", async () => {
    const base = createEmptyWorkspace()
    const wedding = {
      id: 'w1',
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 0,
      clientBudget: 0,
      status: 'signe',
      archived: false,
      vendorIds: [],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    const v1: Record<string, unknown> = {
      ...base,
      schemaVersion: 1,
      weddings: [wedding],
      expenses: [{ id: 'e1', weddingId: 'w1', label: 'Ancien poste', plannedAmount: 100, actualAmount: 120, kind: 'depense' }],
      scopeChanges: [],
    }
    delete v1.vendorWeddingLinks

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { workspace: v1 }, version: 0 }))

    const { useWorkspaceStore } = await importFreshStore()
    const state = useWorkspaceStore.getState()

    expect(state.hydrationIssue).toBeNull()
    expect(state.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(state.workspace.expenses[0]?.description).toBe('Ancien poste')
  })
})

describe('hydratation — migration échouée', () => {
  it('un schéma non supporté restaure un espace vide, avec un message clair, sans planter', async () => {
    const corrupted = { schemaVersion: CURRENT_SCHEMA_VERSION + 1 }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { workspace: corrupted }, version: 0 }))

    const { useWorkspaceStore } = await importFreshStore()
    const state = useWorkspaceStore.getState()

    expect(state.hydrationIssue).toMatch(/illisibles/)
    expect(state.workspace.weddings).toEqual([])
  })

  it("aucune donnée n'est jamais remplacée sans laisser de trace récupérable : la copie d'origine reste disponible", async () => {
    const corrupted = { schemaVersion: CURRENT_SCHEMA_VERSION + 1 }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { workspace: corrupted }, version: 0 }))

    const { useWorkspaceStore } = await importFreshStore()
    const state = useWorkspaceStore.getState()

    expect(state.corruptedBackupRaw).not.toBeNull()
    const parsedBackup = JSON.parse(state.corruptedBackupRaw as string)
    expect(parsedBackup.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION + 1)
  })
})

describe('hydratation — JSON corrompu', () => {
  it('une chaîne illisible restaure un espace vide, avec un message explicite et une sauvegarde brute conservée', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{ceci-nest-pas-du-json-valide')

    const { useWorkspaceStore } = await importFreshStore()
    const state = useWorkspaceStore.getState()

    expect(state.hydrationIssue).toMatch(/corrompu/)
    expect(state.corruptedBackupRaw).toBe('{ceci-nest-pas-du-json-valide')
    expect(state.workspace.weddings).toEqual([])

    const recoveryKeys = Object.keys(window.localStorage).filter((key) => key.startsWith('relia-workspace-recovery-'))
    expect(recoveryKeys.length).toBeGreaterThan(0)
  })
})

describe('hydratation — localStorage indisponible', () => {
  it("l'application démarre quand même, avec un espace vide utilisable et un message de persistance clair", async () => {
    replaceLocalStorage({
      getItem: vi.fn(() => {
        throw new DOMException('Accès refusé', 'SecurityError')
      }),
    })

    const { useWorkspaceStore, usePersistenceStatus } = await importFreshStore()

    expect(usePersistenceStatus.getState().persistenceIssue).toMatch(/indisponible/)
    expect(useWorkspaceStore.getState().workspace.weddings).toEqual([])
  })
})

describe('écriture — QuotaExceededError', () => {
  it("une écriture qui échoue affiche un message et n'efface jamais les données déjà en mémoire", async () => {
    const { useWorkspaceStore, usePersistenceStatus } = await importFreshStore()

    replaceLocalStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Quota dépassé', 'QuotaExceededError')
      }),
    })

    useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 1000,
      clientBudget: 1000,
      status: 'signe',
    })

    expect(usePersistenceStatus.getState().persistenceIssue).toBe(
      "Vos modifications n'ont pas pu être sauvegardées (espace de stockage insuffisant).",
    )
    // La donnée créée reste en mémoire malgré l'échec d'écriture.
    const state = useWorkspaceStore.getState()
    expect(state.workspace.weddings).toHaveLength(1)
    expect(state.workspace.weddings[0]?.coupleName).toBe('Mariage Test')
  })

  it("retryPersist redéclenche une tentative d'écriture et efface le message une fois résolu", async () => {
    const { useWorkspaceStore, usePersistenceStatus } = await importFreshStore()

    const fake = replaceLocalStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Quota dépassé', 'QuotaExceededError')
      }),
    })

    useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 1000,
      clientBudget: 1000,
      status: 'signe',
    })
    expect(usePersistenceStatus.getState().persistenceIssue).not.toBeNull()

    // Le stockage redevient disponible : on remplace setItem par la vraie implémentation.
    fake.setItem = vi.fn(realLocalStorage.setItem.bind(realLocalStorage))
    Object.defineProperty(window, 'localStorage', { value: fake, configurable: true })

    useWorkspaceStore.getState().retryPersist()

    expect(usePersistenceStatus.getState().persistenceIssue).toBeNull()
  })
})
