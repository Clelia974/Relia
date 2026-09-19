import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/app/router'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { ThemeSync } from '@/app/ThemeSync'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <BrowserRouter>
      <ThemeSync />
      <TooltipProvider>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
