import { useState } from 'react'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useUserProfile } from '@/features/auth/useUserProfile'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

type StepKey = 'weddingCount' | 'mainProblem' | 'firstGoal'

const STEPS: { key: StepKey; question: string; options: string[] }[] = [
  {
    key: 'weddingCount',
    question: 'Combien de mariages gérez-vous actuellement ?',
    options: ['Aucun pour le moment', '1 à 3', '4 à 8', 'Plus de 8'],
  },
  {
    key: 'mainProblem',
    question: "Quel est votre principal problème aujourd'hui ?",
    options: [
      'Coordination des prestataires',
      'Suivi des coûts',
      'Demandes supplémentaires',
      'Création de propositions',
      'Planning et conflits horaires',
    ],
  },
  {
    key: 'firstGoal',
    question: 'Que souhaitez-vous faire maintenant ?',
    options: ['Créer mon premier mariage', 'Voir un exemple', 'Explorer le dashboard'],
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  // Vérifie que le profil public.users a bien été créé par le trigger à l'inscription (cf. useUserProfile) — ne bloque jamais l'onboarding, juste un signal en cas d'anomalie.
  useUserProfile()
  const updateOnboardingAnswers = useWorkspaceStore((s) => s.updateOnboardingAnswers)
  const completeOnboarding = useWorkspaceStore((s) => s.completeOnboarding)
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace)

  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Partial<Record<StepKey, string>>>({})
  const [showDemoConfirm, setShowDemoConfirm] = useState(false)

  const step = STEPS[stepIndex]
  const selected = answers[step.key]
  const isLastStep = stepIndex === STEPS.length - 1

  const handleSelect = (value: string) => {
    setAnswers((a) => ({ ...a, [step.key]: value }))
    updateOnboardingAnswers({ [step.key]: value })
  }

  const finish = () => {
    completeOnboarding()
    if (answers.firstGoal === 'Voir un exemple') {
      setShowDemoConfirm(true)
      return
    }
    if (answers.firstGoal === 'Créer mon premier mariage') {
      navigate('/mariages/nouveau')
      return
    }
    navigate('/aujourdhui')
  }

  const handleContinue = () => {
    if (isLastStep) {
      finish()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  const handleBack = () => {
    if (stepIndex === 0) navigate('/')
    else setStepIndex((i) => i - 1)
  }

  const handleSkip = () => {
    completeOnboarding()
    navigate('/aujourdhui')
  }

  const confirmDemo = () => {
    resetWorkspace('demo')
    setShowDemoConfirm(false)
    navigate('/aujourdhui')
  }

  const declineDemo = () => {
    setShowDemoConfirm(false)
    navigate('/aujourdhui')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-heading text-lg font-semibold text-primary">Relia</span>
        <button type="button" onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
          Passer l'onboarding
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Étape {stepIndex + 1} sur {STEPS.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
              <div
                className="h-full rounded-full bg-thread transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div key={step.key} className="animate-in fade-in-0 slide-in-from-right-2 duration-300">
            <h1 className="text-balance font-heading text-xl font-semibold sm:text-2xl">{step.question}</h1>

            <div className="mt-6 flex flex-col gap-2.5" role="radiogroup" aria-label={step.question}>
              {step.options.map((option) => {
                const isSelected = selected === option
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                      isSelected
                        ? 'border-thread bg-accent text-foreground'
                        : 'border-border text-foreground hover:border-thread/50 hover:bg-accent/60',
                    )}
                  >
                    {option}
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border',
                        isSelected ? 'border-thread bg-thread text-primary-foreground' : 'border-border',
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleBack}>
              Retour
            </Button>
            <Button type="button" onClick={handleContinue} disabled={!selected}>
              {isLastStep ? 'Terminer' : 'Continuer'}
            </Button>
          </div>
        </div>
      </main>

      <AlertDialog open={showDemoConfirm} onOpenChange={(open) => !open && declineDemo()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Charger des données de démonstration ?</AlertDialogTitle>
            <AlertDialogDescription>
              Nous allons remplir votre espace avec des mariages fictifs pour que vous puissiez explorer Relia.
              Aucune donnée réelle n'existe encore, rien ne sera perdu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={declineDemo}>Non merci</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDemo}>Charger l'exemple</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
