const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
})

export function formatINR(value: number): string {
  return inrFormatter.format(value)
}

export function formatNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value)
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))
}

export { numberFormatter }
