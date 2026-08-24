import type { AssessmentDraft } from '../types/assessment'

export type FieldErrors = Partial<Record<keyof AssessmentDraft, string>>

const PINCODE_RE = /^\d{6}$/

function optionalCoord(
  value: string,
  min: number,
  max: number,
  label: string,
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return `${label} must be a number.`
  if (parsed < min || parsed > max) {
    return `${label} must be between ${min} and ${max}.`
  }
  return undefined
}

function requiredPositiveNumber(
  value: string,
  label: string,
  max: number,
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required.`
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return `${label} must be a number.`
  if (parsed <= 0) return `${label} must be greater than 0.`
  if (parsed > max) return `${label} seems unrealistically large (max ${max}).`
  return undefined
}

function optionalNonNegativeNumber(
  value: string,
  label: string,
  max: number,
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return `${label} must be a number.`
  if (parsed < 0) return `${label} cannot be negative.`
  if (parsed > max) return `${label} seems unrealistically large (max ${max}).`
  return undefined
}

export function validatePropertyStep(draft: AssessmentDraft): FieldErrors {
  const errors: FieldErrors = {}
  if (!draft.propertyName.trim()) {
    errors.propertyName = 'Property name is required.'
  }
  if (!draft.city.trim()) errors.city = 'City is required.'
  if (!draft.state.trim()) errors.state = 'State is required.'
  const pincode = draft.pincode.trim()
  if (pincode && !PINCODE_RE.test(pincode)) {
    errors.pincode = 'PIN code must be exactly 6 digits.'
  }
  const latError = optionalCoord(draft.latitude, -90, 90, 'Latitude')
  if (latError) errors.latitude = latError
  const lngError = optionalCoord(draft.longitude, -180, 180, 'Longitude')
  if (lngError) errors.longitude = lngError
  return errors
}

export function validateRooftopStep(draft: AssessmentDraft): FieldErrors {
  const errors: FieldErrors = {}
  const areaError = requiredPositiveNumber(
    draft.roofAreaSqm,
    'Roof area',
    100000,
  )
  if (areaError) errors.roofAreaSqm = areaError
  if (!draft.roofMaterial) errors.roofMaterial = 'Select a roof material.'
  if (!draft.roofType) errors.roofType = 'Select a roof type.'
  const openSpaceError = optionalNonNegativeNumber(
    draft.openSpaceSqm,
    'Open space',
    1000000,
  )
  if (openSpaceError) errors.openSpaceSqm = openSpaceError
  return errors
}

export function validateReviewStep(draft: AssessmentDraft): FieldErrors {
  const errors: FieldErrors = {}
  const rainfall = draft.annualRainfallMm.trim()
  if (!rainfall) {
    errors.annualRainfallMm =
      'Annual rainfall is required — load it in the Environmental Review step or enter it manually.'
    return errors
  }
  const parsed = Number(rainfall)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    errors.annualRainfallMm = 'Annual rainfall must be a positive number (mm/year).'
  } else if (parsed > 15000) {
    errors.annualRainfallMm = 'Annual rainfall seems unrealistically high (max 15000 mm).'
  }
  return errors
}

export function validateWaterDemandStep(draft: AssessmentDraft): FieldErrors {
  const errors: FieldErrors = {}
  const sizeTrimmed = draft.householdSize.trim()
  if (!sizeTrimmed) {
    errors.householdSize = 'Number of residents is required.'
  } else {
    const size = Number(sizeTrimmed)
    if (!Number.isInteger(size)) {
      errors.householdSize = 'Enter a whole number of residents.'
    } else if (size < 1 || size > 100) {
      errors.householdSize = 'Residents must be between 1 and 100.'
    }
  }
  const lpcdError = requiredPositiveNumber(draft.perCapitaLpd, 'Per-capita use', 500)
  if (lpcdError) {
    errors.perCapitaLpd =
      draft.perCapitaLpd.trim() === ''
        ? 'Per-capita water use is required.'
        : lpcdError.replace('greater than 0', 'at least 1')
  }
  const lpcdValue = Number(draft.perCapitaLpd.trim())
  if (Number.isFinite(lpcdValue) && lpcdValue < 1) {
    errors.perCapitaLpd = 'Per-capita use must be at least 1 L/person/day.'
  }
  return errors
}
