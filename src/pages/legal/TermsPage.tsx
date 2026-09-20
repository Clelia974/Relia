import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, LEGAL } from '@/features/landing/landingContent'
import { LegalLayout } from '@/features/legal/LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout
      title="Conditions d'utilisation"
      intro="En utilisant RELIA, tu acceptes ces conditions. Nous les avons voulues simples et équilibrées."
      sections={[
        {
          title: 'Le service',
          body: <p>RELIA est un outil de gestion pour les décoratrices et décorateurs de mariage : suivi des mariages, tâches, budgets, prestataires, devis et factures indicatifs, déroulé du Jour J. Il est proposé par {LEGAL.name} ({LEGAL.country}).</p>,
        },
        {
          title: 'Ce que tu peux faire',
          body: (
            <ul>
              <li>Utiliser RELIA pour ton activité professionnelle, et y saisir les informations de tes clients et prestataires.</li>
              <li>Exporter, importer et imprimer tes documents.</li>
            </ul>
          ),
        },
        {
          title: 'Ce qui est interdit',
          body: (
            <ul>
              <li>Tenter d'accéder aux comptes ou données d'autres personnes, ou de contourner les limites du service.</li>
              <li>Perturber le fonctionnement du service (attaques, envois automatisés massifs).</li>
              <li>Revendre, copier ou extraire le code, l'interface ou la marque RELIA.</li>
              <li>Utiliser RELIA pour des contenus illicites ou des données que tu n'as pas le droit de traiter.</li>
            </ul>
          ),
        },
        {
          title: 'Tes données et tes responsabilités',
          body: <p>Tes données t'appartiennent. Aujourd'hui elles sont conservées dans ton navigateur : leur sauvegarde (via l'export JSON) est de ta responsabilité. Tu restes responsable des documents que tu émets à tes clients : les devis et factures générés par RELIA sont indicatifs, et il t'appartient de vérifier leurs mentions légales et fiscales.</p>,
        },
        {
          title: 'Propriété intellectuelle',
          body: <p>RELIA, son nom, son logo, son interface et son code appartiennent à {LEGAL.name}. Nous te concédons un droit d'usage personnel, non exclusif et non transférable, le temps de ton utilisation. Le contenu que tu saisis reste le tien.</p>,
        },
        {
          title: 'Prix et remboursement',
          body: <p>Les tarifs et le fonctionnement de l'essai sont indiqués sur la page d'accueil. Notre politique de remboursement est détaillée sur la page <Link to="/remboursement">Remboursement</Link>.</p>,
        },
        {
          title: 'Garanties',
          body: <p>Nous faisons de notre mieux pour que RELIA soit fiable, mais le service est fourni « en l'état » : nous ne garantissons ni une disponibilité ininterrompue, ni l'absence totale d'erreur. Les calculs (budgets, marges) sont des aides à la décision, à vérifier.</p>,
        },
        {
          title: 'Limitation de responsabilité',
          body: <p>Dans la limite permise par la loi, notre responsabilité est limitée aux dommages directs et ne peut dépasser les sommes que tu as payées pour RELIA au cours des douze derniers mois. Nous ne répondons pas des pertes indirectes (perte de clientèle, de chiffre d'affaires) ni de la perte de données due à l'effacement de ton navigateur ou à l'absence de sauvegarde. Rien ici ne limite une responsabilité que la loi ne permet pas d'exclure.</p>,
        },
        {
          title: 'Résiliation',
          body: <p>Tu peux arrêter d'utiliser RELIA quand tu veux et, une fois les abonnements ouverts, résilier à tout moment ; l'accès reste actif jusqu'à la fin de la période payée. Nous pouvons suspendre un compte en cas de manquement grave à ces conditions, en te prévenant sauf urgence. Tu peux toujours exporter tes données.</p>,
        },
        {
          title: 'Droit applicable et litiges',
          body: <p>Ces conditions sont régies par le droit du pays de l'éditeur ({LEGAL.country}). En cas de désaccord, écris-nous d'abord à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : nous cherchons une solution amiable avant toute procédure. Si tu agis en tant que consommateur, tes droits impératifs restent protégés.</p>,
        },
        {
          title: 'Modifications',
          body: <p>Nous pouvons faire évoluer ces conditions ; en cas de changement important, tu en seras informée avant son entrée en vigueur. Dernière mise à jour : {LEGAL.updatedOn}.</p>,
        },
      ]}
    />
  )
}
