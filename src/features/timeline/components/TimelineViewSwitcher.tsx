import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type TimelineView = 'frise' | 'calendrier' | 'gantt'

interface TimelineViewSwitcherProps {
  value: TimelineView
  onChange: (value: TimelineView) => void
}

export function TimelineViewSwitcher({ value, onChange }: TimelineViewSwitcherProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimelineView)}>
      <TabsList>
        <TabsTrigger value="frise">Frise chronologique</TabsTrigger>
        <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
        <TabsTrigger value="gantt">Diagramme de Gantt</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
