import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { LEGAL } from '@/features/landing/landingContent'

export interface LegalSection {
  title: string
  body: ReactNode
}

export function LegalLayout({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="RELIA — retour à l'accueil">
            <img src="/brand/relia-monogram.svg" alt="" className="size-9" />
            <span className="font-heading text-2xl font-semibold tracking-tight text-primary">Relia</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Retour à l'accueil</Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 animate-page-in">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {LEGAL.updatedOn}</p>
        <p className="mt-6 text-base leading-relaxed text-foreground/85">{intro}</p>
        <div className="mt-10 flex flex-col gap-9">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="font-heading text-xl font-semibold text-foreground">{section.title}</h2>
              <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-foreground/85 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <LegalLinks />
        </div>
      </footer>
      <CookieNotice />
    </div>
  )
}
