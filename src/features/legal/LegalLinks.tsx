import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/confidentialite', label: 'Confidentialité' },
  { to: '/conditions', label: "Conditions d'utilisation" },
  { to: '/remboursement', label: 'Remboursement' },
  { to: '/cookies', label: 'Cookies' },
]

export function LegalLinks() {
  return (
    <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
      {LINKS.map((link) => (
        <Link key={link.to} to={link.to} className="transition-colors hover:text-foreground">
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
