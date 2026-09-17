import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { backupRawWorkspace, createSafeWorkspaceStorage, type SafeStorageCallbacks } from '@/lib/workspace/safeStorage'

function makeCallbacks() {
  const onReadCorrupted = vi.fn()
  const onReadUnavailable = vi.fn()
  const onWriteError = vi.fn()
  const onWriteSuccess = vi.fn()
  const callbacks: SafeStorageCallbacks = { onReadCorrupted, onReadUnavailable, onWriteError, onWriteSuccess }
  return { callbacks, onReadCorrupted, onReadUnavailable, onWriteError, onWriteSuccess }
}

const realLocalStorage = window.localStorage

/**
 * jsdom expose localStorage via un Proxy dédié aux accès de type
 * `localStorage.maClef` : vi.spyOn sur ses méthodes ne l'intercepte pas de
 * façon fiable. On remplace donc temporairement window.localStorage par un
 * objet simple dont les méthodes sont de vrais espions contrôlables.
 */
function installFailingLocalStorage(overrides: Partial<Storage>) {
  const fake: Partial<Storage> = {
    getItem: vi.fn(realLocalStorage.getItem.bind(realLocalStorage)),
    setItem: vi.fn(realLocalStorage.setItem.bind(realLocalStorage)),
    removeItem: vi.fn(realLocalStorage.removeItem.bind(realLocalStorage)),
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

describe('createSafeWorkspaceStorage — localStorage disponible', () => {
  it('lit et écrit normalement quand localStorage fonctionne', () => {
    const { callbacks, onWriteSuccess, onWriteError, onReadCorrupted, onReadUnavailable } = makeCallbacks()
    const storage = createSafeWorkspaceStorage(callbacks)

    storage.setItem('relia-workspace', { state: { workspace: { foo: 'bar' } }, version: 0 })
    expect(onWriteSuccess).toHaveBeenCalledTimes(1)
    expect(onWriteError).not.toHaveBeenCalled()

    const result = storage.getItem('relia-workspace')
    expect(result).toEqual({ state: { workspace: { foo: 'bar' } }, version: 0 })
    expect(onReadCorrupted).not.toHaveBeenCalled()
    expect(onReadUnavailable).not.toHaveBeenCalled()
  })

  it("retourne null sans erreur quand la clé n'existe pas encore (première visite)", () => {
    const { callbacks, onReadCorrupted, onReadUnavailable } = makeCallbacks()
    const storage = createSafeWorkspaceStorage(callbacks)

    expect(storage.getItem('relia-workspace')).toBeNull()
    expect(onReadCorrupted).not.toHaveBeenCalled()
    expect(onReadUnavailable).not.toHaveBeenCalled()
  })
})

describe('createSafeWorkspaceStorage — localStorage indisponible', () => {
  it('getItem : signale l\'indisponibilité et retourne null plutôt que de lever une exception', () => {
    const { callbacks, onReadUnavailable } = makeCallbacks()
    const storage = createSafeWorkspaceStorage(callbacks)

    installFailingLocalStorage({
      getItem: vi.fn(() => {
        throw new DOMException('Accès refusé', 'SecurityError')
      }),
    })

    expect(() => storage.getItem('relia-workspace')).not.toThrow()
    expect(storage.getItem('relia-workspace')).toBeNull()
    expect(onReadUnavailable).toHaveBeenCalled()
  })

  it("setItem : n'écrit rien silencieusement en cas d'indisponibilité et le signale via onWriteError", () => {
    const { callbacks, onWriteError } = makeCallbacks()
    const storage = createSafeWorkspaceStorage(callbacks)

    installFailingLocalStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Accès refusé', 'SecurityError')
      }),
    })

    expect(() => storage.setItem('relia-workspace', { state: {} })).not.toThrow()
    expect(onWriteError).toHaveBeenCalledWith("Vos modifications n'ont pas pu être sauvegardées.")
  })
})

describe('createSafeWorkspaceStorage — QuotaExceededError', () => {
  it("signale un message dédié à l'espace de stockage insuffisant, sans lever d'exception", () => {
    const { callbacks, onWriteError, onWriteSuccess } = makeCallbacks()
    const storage = createSafeWorkspaceStorage(callbacks)

    installFailingLocalStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Quota dépassé', 'QuotaExceededError')
      }),
    })

    expect(() => storage.setItem('relia-workspace', { state: {} })).not.toThrow()
    expect(onWriteError).toHaveBeenCalledWith(
      "Vos modifications n'ont pas pu être sauvegardées (espace de stockage insuffisant).",
    )
    expect(onWriteSuccess).not.toHaveBeenCalled()
  })
})

describe('createSafeWorkspaceStorage — JSON corrompu', () => {
  it('détecte un contenu illisible, le sauvegarde sous une clé de secours, et retourne null (jamais une exception)', () => {
    const { callbacks, onReadCorrupted } = makeCallbacks()
    const storage = createSafeWorkspaceStorage(callbacks)

    window.localStorage.setItem('relia-workspace', '{ceci-nest-pas-du-json-valide')

    const result = storage.getItem('relia-workspace')

    expect(result).toBeNull()
    expect(onReadCorrupted).toHaveBeenCalledWith('{ceci-nest-pas-du-json-valide')

    const recoveryKeys = Object.keys(window.localStorage).filter((key) => key.startsWith('relia-workspace-recovery-'))
    expect(recoveryKeys).toHaveLength(1)
    expect(window.localStorage.getItem(recoveryKeys[0])).toBe('{ceci-nest-pas-du-json-valide')
  })
})

describe('backupRawWorkspace', () => {
  it("n'échoue jamais, même si le stockage de secours est lui-même indisponible", () => {
    installFailingLocalStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Quota dépassé', 'QuotaExceededError')
      }),
    })

    expect(() => backupRawWorkspace('donnée quelconque')).not.toThrow()
  })
})
