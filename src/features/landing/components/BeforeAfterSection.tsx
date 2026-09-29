import { Check, X } from 'lucide-react'
import { AFTER_GROUPS, BEFORE_GROUPS } from '@/features/landing/landingContent'
import { cn } from '@/lib/utils'

function GroupedList({ groups, variant }: { groups: typeof BEFORE_GROUPS; variant: 'avant' | 'apres' }) {
  const isApres = variant === 'apres'
  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-2xl border p-6 sm:p-8',
        isApres ? 'border-transparent bg-[#680808] text-[#DDE6EF]' : 'border-border bg-card',
      )}
    >
      <span
        className={cn(
          'w-fit rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
          isApres ? 'bg-[#DDE6EF]/15 text-[#DDE6EF]' : 'bg-muted text-muted-foreground',
        )}
      >
        {isApres ? 'Avec ZORDI' : 'Avant ZORDI'}
      </span>
      {groups.map((group) => (
        <div key={group.verb} className="flex flex-col gap-2">
          <p className={cn('font-heading text-base font-semibold', isApres ? 'text-[#DDE6EF]' : 'text-foreground')}>{group.verb}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {group.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                    isApres ? 'bg-[#DDE6EF]/15 text-[#DDE6EF]' : 'bg-risk-bg text-risk',
                  )}
                >
                  {isApres ? <Check className="size-2.5" aria-hidden="true" /> : <X className="size-2.5" aria-hidden="true" />}
                </span>
                <span className={isApres ? 'text-[#DDE6EF]/90' : 'text-foreground'}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function BeforeAfterSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <GroupedList groups={BEFORE_GROUPS} variant="avant" />
      <GroupedList groups={AFTER_GROUPS} variant="apres" />
    </div>
  )
}
