import { Moon, Sun } from 'lucide-react'
import { useResolvedTheme } from '@/app/useResolvedTheme'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/store/workspaceStore'

/** Bascule explicite clair/sombre — force uiPreferences.theme, prend le dessus sur "system". */
export function ThemeToggle() {
  const resolvedTheme = useResolvedTheme()
  const setTheme = useWorkspaceStore((s) => s.setTheme)
  const isDark = resolvedTheme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? 'Mode clair' : 'Mode sombre'}</TooltipContent>
    </Tooltip>
  )
}
