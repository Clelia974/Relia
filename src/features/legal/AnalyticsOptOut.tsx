import { useState } from 'react'
import { hasOptedOut, setOptedOut } from '@/lib/analytics'

/** Case « Ne pas me compter » : mémorisée dans le navigateur, respectée par toute la mesure d'audience. */
export function AnalyticsOptOut() {
  const [optedOut, setOptedOutState] = useState(hasOptedOut)
  return (
    <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={optedOut}
        onChange={(e) => {
          setOptedOut(e.target.checked)
          setOptedOutState(e.target.checked)
        }}
        className="mt-1 size-4 accent-[#520C0C]"
      />
      <span>Ne pas me compter dans la mesure d’audience anonyme (ce choix est enregistré dans ce navigateur).</span>
    </label>
  )
}
