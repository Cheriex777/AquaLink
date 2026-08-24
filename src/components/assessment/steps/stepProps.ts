import type { AssessmentDraft } from '../../../types/assessment'
import type { FieldErrors } from '../../../lib/validation'

export interface StepProps {
  draft: AssessmentDraft
  errors: FieldErrors
  onChange: (patch: Partial<AssessmentDraft>) => void
}
