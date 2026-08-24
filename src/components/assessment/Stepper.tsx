import { Check } from 'lucide-react'

export interface WizardStep {
  id: string
  shortLabel: string
  title: string
}

interface StepperProps {
  steps: WizardStep[]
  currentIndex: number
  maxVisitedIndex: number
  disabled?: boolean
  onSelect: (index: number) => void
}

export default function Stepper({
  steps,
  currentIndex,
  maxVisitedIndex,
  disabled,
  onSelect,
}: StepperProps) {
  const progressPct = ((currentIndex + 1) / steps.length) * 100

  function circleClass(index: number): string {
    if (index < currentIndex) {
      return 'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white'
    }
    if (index === currentIndex) {
      return 'flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary-600 bg-white text-sm font-semibold text-primary-700'
    }
    return 'flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-sm font-medium text-slate-400'
  }

  return (
    <nav aria-label="Assessment progress" className="border-b border-slate-200">
      <div className="px-5 py-4 md:hidden">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">
            Step {currentIndex + 1} of {steps.length}
            <span className="ml-1.5 font-normal text-slate-500">
              · {steps[currentIndex].title}
            </span>
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          />
        </div>
      </div>

      <ol className="hidden items-center px-6 py-5 md:flex">
        {steps.map((step, index) => (
          <li key={step.id} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={disabled || index > maxVisitedIndex || index === currentIndex}
              onClick={() => onSelect(index)}
              className="group flex items-center gap-2 disabled:cursor-default"
            >
              <span className={circleClass(index)}>
                {index < currentIndex ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`whitespace-nowrap text-sm ${
                  index === currentIndex
                    ? 'font-semibold text-primary-700'
                    : index < currentIndex
                      ? 'font-medium text-slate-600 group-hover:text-slate-900'
                      : 'text-slate-400'
                }`}
              >
                {step.shortLabel}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`mx-3 h-0.5 flex-1 rounded-full ${
                  index < currentIndex ? 'bg-primary-600' : 'bg-slate-200'
                }`}
              />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}
