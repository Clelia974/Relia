/** Teinte de fond par défaut d'une note / d'une matière sans couleur choisie. */
export const DEFAULT_NOTE_COLOR = '#F7F3EA'

/** Texte lisible (sombre ou clair) sur une couleur de fond donnée. */
export function readableTextOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#2C2C2C' : '#FFFFFF'
}
