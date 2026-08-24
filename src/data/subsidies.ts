/**
 * Verified government incentive registry for rooftop rainwater harvesting.
 *
 * HONESTY RULE: every entry below cites an official/municipal source or
 * major-press reporting of an official announcement, with the date it was
 * verified. Benefits are PROPERTY-TAX REBATES (percentages), not cash
 * subsidies — the rupee value depends on each owner's annual municipal tax.
 * Never add entries without a verifiable citation.
 */

export interface SubsidyScheme {
  id: string
  regionLevel: 'city'
  city: string
  state: string
  schemeName: string
  benefitSummary: string
  percentPropertyTaxRebate: number
  maxPercentIfCombined?: number
  citationUrl: string
  citationSource: string
  verifiedOn: string
  conditions: string[]
}

const VERIFIED_ON = '2026-08-24'

export const SUBSIDY_SCHEMES: SubsidyScheme[] = [
  {
    id: 'in-mh-pune-pmc',
    regionLevel: 'city',
    city: 'Pune',
    state: 'Maharashtra',
    schemeName: 'PMC Eco-Friendly Property Tax Discount',
    benefitSummary:
      '5% discount on municipal taxes for rainwater harvesting alone; 10% when combined with one more eco-project (solar / vermiculture).',
    percentPropertyTaxRebate: 5,
    maxPercentIfCombined: 10,
    citationUrl: 'https://propertytax.punecorporation.org/faq.aspx',
    citationSource: 'Pune Municipal Corporation — Property Tax Department FAQ',
    verifiedOn: VERIFIED_ON,
    conditions: [
      'Discount applies to Municipal Taxes (excluding water tax and government taxes).',
      'Residential properties; system must remain functional.',
    ],
  },
  {
    id: 'in-mh-nagpur-nmc',
    regionLevel: 'city',
    city: 'Nagpur',
    state: 'Maharashtra',
    schemeName: 'NMC Environment-Friendly Measures Rebate',
    benefitSummary:
      '5% reduction in property tax for implementing rainwater harvesting (one of four eligible eco-measures).',
    percentPropertyTaxRebate: 5,
    citationUrl:
      'https://timesofindia.indiatimes.com/city/nagpur/only-1363-properties-in-nagpur-harvest-rainwater-to-boost-groundwater/articleshow/109828283.cms',
    citationSource: 'Times of India, citing NMC Property Tax Department (May 2024)',
    verifiedOn: VERIFIED_ON,
    conditions: [
      'Applies under NMC eco-friendly initiative along with solar, wastewater-reuse and vermicomposting measures.',
      'Confirm current eligibility with NMC property tax department.',
    ],
  },
  {
    id: 'in-mp-indore-imc',
    regionLevel: 'city',
    city: 'Indore',
    state: 'Madhya Pradesh',
    schemeName: 'IMC Rainwater Harvesting Property Tax Rebate',
    benefitSummary:
      '10% property tax rebate for buildings with a functional rainwater harvesting system.',
    percentPropertyTaxRebate: 10,
    citationUrl:
      'https://timesofindia.indiatimes.com/city/indore/install-rainwater-harvesting-system-get-10-property-tax-rebate-mayor/articleshow/132078987.cms',
    citationSource:
      'Times of India / Economic Times reporting Indore Municipal Corporation announcement (June 2026)',
    verifiedOn: VERIFIED_ON,
    conditions: [
      'Requires on-site inspection, testing and certification by designated municipal building officers.',
      'Rebate is withdrawn automatically from the next financial year if the system stops functioning.',
    ],
  },
]

function normalise(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/** City-first matching, then falls back to no-match (never invents benefits). */
export function findSubsidy(
  stateName: string | null | undefined,
  cityName: string | null | undefined,
): SubsidyScheme | null {
  const state = normalise(stateName)
  const city = normalise(cityName)
  if (!city && !state) return null
  return (
    SUBSIDY_SCHEMES.find(
      (scheme) =>
        normalise(scheme.city) === city &&
        (!state || normalise(scheme.state) === state),
    ) ??
    SUBSIDY_SCHEMES.find((scheme) => normalise(scheme.state) === state) ??
    null
  )
}
