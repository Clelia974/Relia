import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/app/router'
import { ErrorBoundary } from '@/app/ErrorBoundary'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
