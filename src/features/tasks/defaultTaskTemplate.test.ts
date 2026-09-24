import { describe, expect, it } from 'vitest'
import { buildDefaultTasksForWedding, createDefaultTaskTemplate } from '@/features/tasks/defaultTaskTemplate'

describe('createDefaultTaskTemplate', () => {
  it('génère des identifiants distincts à chaque appel', () => {
    const a = createDefaultTaskTemplate()
    const b = createDefaultTaskTemplate()
    expect(a.map((i) => i.id)).not.toEqual(b.map((i) => i.id))
    expect(new Set(a.map((i) => i.id)).size).toBe(a.length)
  })
})

describe('buildDefaultTasksForWedding', () => {
  it('génère une tâche par entrée du modèle fourni, toutes rattachées au mariage et marquées automatiques', () => {
    const template = createDefaultTaskTemplate()
    const tasks = buildDefaultTasksForWedding('w1', '2027-06-12T00:00:00.000Z', template)

    expect(tasks).toHaveLength(template.length)
    for (const task of tasks) {
      expect(task.weddingId).toBe('w1')
      expect(task.source).toBe('automatic')
    }
  })

  it('calcule les échéances à partir de la date du mariage, avant et après', () => {
    const template = createDefaultTaskTemplate()
    const tasks = buildDefaultTasksForWedding('w1', '2027-06-12T00:00:00.000Z', template)

    const confirmVendors = tasks.find((t) => t.title === 'Confirmer tous les prestataires')
    expect(confirmVendors?.dueDate.slice(0, 10)).toBe('2027-03-14') // J-90

    const closing = tasks.find((t) => t.title === 'Faire le bilan de clôture du mariage')
    expect(closing?.dueDate.slice(0, 10)).toBe('2027-06-19') // J+7
  })

  it('respecte un modèle personnalisé (titres et échéances propres au compte)', () => {
    const customTemplate = [{ id: 'x1', title: 'Étape maison', dayOffset: -5 }]
    const tasks = buildDefaultTasksForWedding('w1', '2027-06-12T00:00:00.000Z', customTemplate)

    expect(tasks).toEqual([
      expect.objectContaining({ title: 'Étape maison', weddingId: 'w1', source: 'automatic' }),
    ])
    expect(tasks[0].dueDate.slice(0, 10)).toBe('2027-06-07')
  })
})
