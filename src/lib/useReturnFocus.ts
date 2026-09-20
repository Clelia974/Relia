import { useRef } from 'react'

/**
 * Radix ne restaure le focus qu'à un <DialogTrigger> ; nos dialogues sont ouverts
 * par état (aucun trigger Radix) : on mémorise l'élément focalisé à l'ouverture
 * et on le refocalise à la fermeture s'il est toujours dans le DOM.
 */
export function useReturnFocus() {
  const triggerRef = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: () => {
      if (!triggerRef.current?.isConnected) {
        triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      }
    },
    onCloseAutoFocus: (event: Event) => {
      const trigger = triggerRef.current
      triggerRef.current = null
      if (trigger?.isConnected) {
        event.preventDefault()
        trigger.focus()
      }
    },
  }
}
