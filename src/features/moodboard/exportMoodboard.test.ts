import { describe, expect, it } from 'vitest'
import { exportFileName, wrapText } from '@/features/moodboard/exportMoodboard'

describe('exportMoodboard', () => {
  it('nom de fichier sans accents ni caractères spéciaux', () => {
    expect(exportFileName('Camille & Antoine', 'Cérémonie — version pluie')).toBe('camille-antoine-ceremonie-version-pluie')
    expect(exportFileName('', '!!')).toBe('moodboard')
  })

  it('coupe le texte au mot, en gardant les retours à la ligne', () => {
    const measure = (s: string) => s.length * 10
    expect(wrapText(measure, 'un deux trois quatre', 100)).toEqual(['un deux', 'trois', 'quatre'])
    expect(wrapText(measure, 'a\n\nb', 100)).toEqual(['a', '', 'b'])
  })
})
