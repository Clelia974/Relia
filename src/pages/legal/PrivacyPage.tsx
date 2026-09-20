import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, LEGAL } from '@/features/landing/landingContent'
import { LegalLayout } from '@/features/legal/LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      intro="Voici, simplement, ce que RELIA fait de tes informations. Cette politique décrit la situation d'aujourd'hui ; elle sera mise à jour, et tu en seras informée, avant tout changement (par exemple l'arrivée des comptes en ligne)."
      sections={[
        {
          title: 'Qui est responsable ?',
          body: (
            <p>
              RELIA est édité par {LEGAL.name}, {LEGAL.address} ({LEGAL.country}). Le site est disponible à l'adresse {LEGAL.siteUrl}. Pour toute question sur tes données : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          ),
        },
        {
          title: 'Ce que RELIA collecte',
          body: (
            <>
              <p>Aujourd'hui, RELIA ne dispose d'aucun serveur de stockage : tout ce que tu saisis reste dans ton navigateur, sur ton appareil. Nous n'y avons pas accès. Il s'agit de :</p>
              <ul>
                <li>tes mariages, tâches, budgets, prestataires, devis, factures, contrats et notes ;</li>
                <li>les coordonnées de tes clients et de tes prestataires que tu choisis d'y inscrire ;</li>
                <li>tes préférences (thème clair ou sombre, logo, informations de ton entreprise).</li>
              </ul>
              <p>Ces données restent sous ta responsabilité : si tu y saisis des informations sur tes clients, c'est toi qui décides de leur usage. Effacer les données de ton navigateur supprime ton espace : pense à l'export JSON dans les Paramètres.</p>
            </>
          ),
        },
        {
          title: 'Cookies et mesure d’audience',
          body: <p>RELIA n'utilise aucun cookie de suivi, aucune publicité et aucun outil de mesure d'audience. Le détail est sur la page <Link to="/cookies">Cookies</Link>.</p>,
        },
        {
          title: 'Ce que nous ne faisons pas',
          body: (
            <ul>
              <li>Nous ne vendons pas tes données, ni celles de tes clients, et nous ne les partageons pas à des fins publicitaires (au sens du CCPA, nous ne « vendons » ni ne « partageons » d'informations personnelles).</li>
              <li>Nous ne te profilons pas et nous ne prenons aucune décision automatisée te concernant.</li>
            </ul>
          ),
        },
        {
          title: 'Quand les comptes en ligne arriveront',
          body: (
            <>
              <p>Nous prévoyons une sauvegarde en ligne avec un compte (e-mail et mot de passe) et un abonnement payant. Ce jour-là, nous collecterons ton e-mail, l'état de ton abonnement et une copie chiffrée en transit de ton espace, hébergés dans l'Union européenne. Le paiement sera traité par un prestataire spécialisé (Stripe) : nous ne verrons jamais ton numéro de carte.</p>
              <p>Cette section sera alors précisée (finalités, durées de conservation, sous-traitants) avant l'ouverture, et une nouvelle date de mise à jour sera affichée.</p>
            </>
          ),
        },
        {
          title: 'Tes droits',
          body: (
            <>
              <p>Selon le RGPD (Europe) et le CCPA/CPRA (Californie), tu peux :</p>
              <ul>
                <li>savoir quelles données te concernant sont traitées et en obtenir une copie ;</li>
                <li>les corriger, les supprimer, ou en limiter l'usage ;</li>
                <li>récupérer tes données dans un format réutilisable (l'export JSON de RELIA le permet dès maintenant) ;</li>
                <li>t'opposer à un traitement, et retirer ton consentement à tout moment ;</li>
                <li>ne subir aucune discrimination pour avoir exercé tes droits ;</li>
                <li>introduire une réclamation auprès de l'autorité de protection des données de ton pays (en France : la CNIL, cnil.fr).</li>
              </ul>
              <p>Pour exercer ces droits, écris à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Nous répondons dans un délai d'un mois. Tant que tes données sont uniquement dans ton navigateur, tu peux aussi les supprimer toi-même à tout moment.</p>
            </>
          ),
        },
        {
          title: 'Contact et mises à jour',
          body: <p>Une question : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Dernière mise à jour : {LEGAL.updatedOn}. En cas de changement important, nous te le signalerons dans l'application.</p>,
        },
      ]}
    />
  )
}
