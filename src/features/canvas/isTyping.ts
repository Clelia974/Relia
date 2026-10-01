/** Vrai si la touche part d'un champ de saisie — les raccourcis de l'éditeur (Suppr, ⌘Z, flèches…) ne doivent alors rien faire. */
export const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
