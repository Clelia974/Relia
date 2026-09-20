import { Link } from 'react-router-dom'
import { CONTACT_EMAIL } from '@/features/landing/landingContent'
import { LegalLayout } from '@/features/legal/LegalLayout'

export function CookiesPage() {
  return (
    <LegalLayout
      title="Cookies et stockage local"
      intro="Bonne nouvelle : RELIA n'utilise aucun cookie de suivi ni de publicité, donc aucun consentement à te demander. Cette page détaille ce qui est tout de même enregistré dans ton navigateur."
      sections={[
        {
          title: 'Ce qui est enregistré',
          body: (
            <ul>
              <li><strong>Ton espace de travail</strong> (stockage local du navigateur) : tes mariages, tâches, devis, etc. Finalité : que l'application fonctionne et retrouve tes données. Indispensable, conservé jusqu'à ce que tu l'effaces.</li>
              <li><strong>Tes préférences</strong> (thème, choix d'affichage) : pour retrouver l'application comme tu l'as laissée.</li>
              <li><strong>Le bandeau d'information</strong> : un simple repère pour ne plus te l'afficher après « Compris ».</li>
            </ul>
          ),
        },
        {
          title: 'Ce qui ne l’est pas',
          body: <p>Aucun outil d'analyse, aucune publicité, aucun pixel de réseau social, aucun cookie tiers. Ces éléments strictement nécessaires ne demandent pas de consentement selon la réglementation.</p>,
        },
        {
          title: 'Les supprimer ou les désactiver',
          body: (
            <>
              <p>Tu peux tout effacer depuis les réglages de ton navigateur (« Effacer les données de navigation » ou « Données de sites »). Attention : cela supprime aussi ton espace RELIA. Exporte-le avant, depuis les Paramètres de l'application.</p>
              <p>Si tu bloques complètement le stockage local, RELIA ne pourra pas enregistrer ton travail.</p>
            </>
          ),
        },
        {
          title: 'Si cela change',
          body: <p>Si nous ajoutons un jour un outil de mesure d'audience ou un service tiers utilisant des cookies, nous te demanderons ton accord avant, avec un refus aussi simple que l'acceptation, et cette page sera mise à jour.</p>,
        },
        {
          title: 'En savoir plus',
          body: <p>Consulte la <Link to="/confidentialite">politique de confidentialité</Link> complète, ou écris-nous : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>,
        },
      ]}
    />
  )
}
