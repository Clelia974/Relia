import { BILLING_LIVE, CONTACT_EMAIL, PRICE_ANNUAL, PRICE_MONTHLY, TRIAL_DAYS } from '@/features/landing/landingContent'
import { LegalLayout } from '@/features/legal/LegalLayout'

export function RefundPage() {
  return (
    <LegalLayout
      title="Politique de remboursement"
      intro={`Nous voulons que tu essaies RELIA sans crainte. Le service coûte ${PRICE_MONTHLY} € par mois ou ${PRICE_ANNUAL} € par an. ${BILLING_LIVE ? '' : 'L’abonnement n’est pas encore ouvert : aucun paiement n’est possible aujourd’hui, et cette politique s’appliquera dès son ouverture.'}`}
      sections={[
        {
          title: 'D’abord, l’essai',
          body: <p>Tu peux tester RELIA gratuitement pendant {TRIAL_DAYS} jours, sans carte bancaire. Si l'outil ne te convient pas, tu ne paies rien.</p>,
        },
        {
          title: 'Remboursement intégral sous 30 jours',
          body: <p>Si tu t'abonnes et que RELIA ne te convient pas, nous te remboursons la totalité de ton premier paiement, mensuel ou annuel, pendant 30 jours à compter de la date de paiement. Sans justification à fournir.</p>,
        },
        {
          title: 'Comment demander',
          body: (
            <ul>
              <li>Écris à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> avec l'adresse e-mail de ton compte et la mention « Remboursement ».</li>
              <li>Nous confirmons la réception sous 2 jours ouvrés.</li>
              <li>Le remboursement est effectué sur le moyen de paiement utilisé, sous 5 à 10 jours ouvrés selon ta banque.</li>
            </ul>
          ),
        },
        {
          title: 'Les exceptions',
          body: (
            <ul>
              <li>Après 30 jours, les périodes déjà entamées ne sont pas remboursées ; tu peux résilier pour ne plus être prélevée.</li>
              <li>Les renouvellements sont remboursables sur demande dans les 7 jours suivant le prélèvement, si tu n'as pas utilisé le service depuis.</li>
              <li>En cas d'abus manifeste (abonnements et remboursements répétés), nous pouvons refuser une demande, en t'expliquant pourquoi.</li>
            </ul>
          ),
        },
        {
          title: 'Ton exemplaire',
          body: <p>Tes données restent exportables (JSON) avant et après un remboursement. Pour toute question : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>,
        },
      ]}
    />
  )
}
