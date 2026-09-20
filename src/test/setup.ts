import '@testing-library/jest-dom/vitest'

/**
 * jsdom ne fournit pas ResizeObserver — nécessaire aux composants Radix
 * (Select notamment) dès qu'ils sont montés, même sans interaction.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

/**
 * jsdom ne fournit pas non plus Element.scrollIntoView — nécessaire à Radix
 * Select dès qu'on ouvre le menu (recherche l'item actif pour le centrer).
 */
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = () => {}
}

/**
 * jsdom ne fournit pas window.matchMedia — utilisé par useResolvedTheme (bouton clair/sombre).
 * Le stub répond « thème clair » et ne notifie jamais de changement.
 */
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
