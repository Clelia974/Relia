import { Component, type ErrorInfo, type ReactNode } from 'react'
import { generateId } from '@/lib/id'
import { ErrorFallback } from '@/app/ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorId: string
}

/**
 * Filet de sécurité global (Phase 0). Intercepte toute erreur de rendu
 * survenant sous ce composant pour éviter un écran blanc total — sans
 * jamais afficher de stack trace ni de donnée applicative, et sans aucun
 * service externe de monitoring : l'erreur reste uniquement journalisée en
 * console locale, pour le diagnostic pendant le développement.
 *
 * Ne réinitialise ni ne touche à workspaceStore : les données déjà
 * sauvegardées (localStorage) restent intactes quel que soit le rendu.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorId: '' }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, errorId: generateId() }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Erreur de rendu interceptée :', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorId: '' })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback errorId={this.state.errorId} onRetry={this.handleRetry} />
    }
    return this.props.children
  }
}
