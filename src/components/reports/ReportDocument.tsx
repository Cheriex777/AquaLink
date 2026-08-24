import { Droplets } from 'lucide-react'
import StaticMapImage from './StaticMapImage'
import type { AssessmentBundle } from '../../services/assessmentStore'
import { ENGINE_VERSION } from '../../services/calculationService'
import type {
  AirQualityData,
  RainfallData,
  SoilData,
} from '../../types/environmental'
import type { GeoPoint } from '../../types/assessment'
import { formatDate, formatINR, formatNumber } from '../../utils/format'

interface ReportDocumentProps {
  bundle: AssessmentBundle
}

function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="mb-3 mt-8 border-b border-slate-300 pb-1.5 text-sm font-bold uppercase tracking-wider text-slate-800 first:mt-0">
      <span className="mr-2 text-primary-700">{number}.</span>
      {title}
    </h2>
  )
}

function KvTable({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-slate-200">
            <th
              scope="row"
              className="w-1/2 border-r border-slate-200 px-3 py-2 text-left align-top font-medium text-slate-600"
            >
              {label}
            </th>
            <td className="px-3 py-2 text-slate-900">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ReportDocument({ bundle }: ReportDocumentProps) {
  const a = bundle.assessment
  const result = bundle.result

  const rainfall = bundle.environmental.find((e) => e.source === 'rainfall')
    ?.payload as RainfallData | undefined
  const soil = bundle.environmental.find((e) => e.source === 'soil')?.payload as
    | SoilData
    | undefined
  const airQuality = bundle.environmental.find((e) => e.source === 'air_quality')
    ?.payload as AirQualityData | undefined

  const polygon = (a.roof_polygon ?? null) as GeoPoint[] | null
  const hasCoordinates =
    a.latitude !== null && a.longitude !== null &&
    Number.isFinite(a.latitude) && Number.isFinite(a.longitude)

  const recommendation = bundle.recommendation
  const surplusKl = result ? Math.round((result.harvest.annualKl - result.demand.annualKl) * 10) / 10 : null

  return (
    <article className="mx-auto max-w-[800px] bg-white p-8 text-slate-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
      {/* Letterhead */}
      <header className="mb-6 flex items-start justify-between gap-4 border-b-2 border-primary-700 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary-700 text-white">
            <Droplets className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight">JalSetu</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Rainwater Harvesting Feasibility Assessment
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>
            Ref <span className="font-mono font-semibold text-slate-700">{a.id.slice(0, 8).toUpperCase()}</span>
          </p>
          <p>Assessed {formatDate(a.created_at)}</p>
          <p>Engine v{ENGINE_VERSION}</p>
        </div>
      </header>

      <section className="mb-6 rounded-lg bg-slate-50 px-5 py-4">
        <h1 className="text-lg font-bold">{a.property_name}</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          {[a.city, a.state].filter(Boolean).join(', ') || 'Location not specified'}
          {a.pincode ? ` · ${a.pincode}` : ''}
        </p>
      </section>

      <SectionTitle number={1} title="Property & Location" />
      <KvTable
        rows={[
          ['Property name', a.property_name],
          ['City / Town', a.city ?? '—'],
          ['State', a.state ?? '—'],
          ['PIN code', a.pincode ?? '—'],
          [
            'Coordinates',
            hasCoordinates
              ? `${a.latitude!.toFixed(5)}° N, ${a.longitude!.toFixed(5)}° E`
              : 'Not provided',
          ],
        ]}
      />

      {hasCoordinates ? (
        <>
          <SectionTitle number={2} title="Site Map" />
          <StaticMapImage
            latitude={a.latitude!}
            longitude={a.longitude!}
            polygon={polygon}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Property marker at assessment coordinates; traced rooftop boundary shown where available.
          </p>
        </>
      ) : null}

      <SectionTitle number={3} title="Rooftop Details" />
      <KvTable
        rows={[
          [
            'Roof area',
            `${formatNumber(Number(a.roof_area_sqm))} m²`,
          ],
          [
            'Area source',
            a.roof_area_source === 'satellite-measured'
              ? `Traced on satellite imagery (${polygon?.length ?? 0} boundary points) — not AI-detected`
              : 'Entered manually',
          ],
          ['Roof material', a.roof_material],
          ['Roof type', a.roof_type ?? '—'],
          [
            'Open space around building',
            a.open_space_sqm !== null ? `${formatNumber(Number(a.open_space_sqm))} m²` : 'Not provided',
          ],
        ]}
      />

      <SectionTitle number={4} title="Environmental Data" />
      <KvTable
        rows={[
          [
            'Annual rainfall',
            rainfall
              ? `${formatNumber(rainfall.annualTotalMm)} mm/yr · ${rainfall.periodStartYear}–${rainfall.periodEndYear} ${rainfall.yearsUsed}-year normal (Open-Meteo)`
              : a.annual_rainfall_mm !== null
                ? `${formatNumber(Number(a.annual_rainfall_mm))} mm/yr (entered manually)`
                : 'Unavailable',
          ],
          [
            'Soil',
            soil
              ? `${soil.textureClass ?? 'Texture n/a'} · sand ${soil.sandPct ?? '—'}% / silt ${soil.siltPct ?? '—'}% / clay ${soil.clayPct ?? '—'}%${soil.phH2o !== null ? ` · pH ${soil.phH2o}` : ''} (SoilGrids ${soil.depthLabel})`
              : 'Unavailable at assessment time',
          ],
          [
            'Air quality (context only)',
            airQuality && airQuality.usAqi !== null
              ? `US AQI ${Math.round(airQuality.usAqi)}${airQuality.category ? ` (${airQuality.category})` : ''} · PM2.5 ${airQuality.pm25UgM3 ?? '—'} µg/m³ · PM10 ${airQuality.pm10UgM3 ?? '—'} µg/m³`
              : 'No reading available',
          ],
        ]}
      />
      <p className="mt-2 text-xs text-slate-500">
        Air quality is reported for context only and is not used in any harvesting calculation.
      </p>

      <SectionTitle number={5} title="Water Demand Analysis" />
      {result ? (
        <KvTable
          rows={[
            ['Residents', a.household_size !== null ? String(a.household_size) : '—'],
            ['Per-capita use', a.per_capita_lpd !== null ? `${a.per_capita_lpd} L/person/day` : '—'],
            ['Daily demand', `${formatNumber(result.demand.dailyLitres, 1)} L`],
            ['Annual demand', `${formatNumber(result.demand.annualLitres)} L (${formatNumber(result.demand.annualKl, 1)} kL)`],
            [
              surplusKl !== null && surplusKl >= 0 ? 'Surplus after demand' : 'Deficit met by other sources',
              surplusKl !== null
                ? `${surplusKl >= 0 ? formatNumber(surplusKl, 1) : formatNumber(-surplusKl, 1)} kL/yr`
                : '—',
            ],
          ]}
        />
      ) : (
        <p className="text-sm text-slate-500">Results snapshot unavailable for this assessment.</p>
      )}

      <SectionTitle number={6} title="Runoff & Harvest Calculation" />
      {result ? (
        <>
          <KvTable
            rows={[
              ['Formula', 'Harvestable water = Roof area × Rainfall × Runoff coefficient × Collection efficiency'],
              ['Roof area', `${formatNumber(result.input.roofAreaSqm)} m²`],
              ['Design rainfall', `${formatNumber(result.input.annualRainfallMm)} mm/yr`],
              ['Runoff coefficient', String(result.input.runoffCoefficient)],
              ['Collection efficiency', `${Math.round(result.input.collectionEfficiency * 100)}%`],
              ['Raw rooftop runoff', `${formatNumber(result.runoff.annualLitres)} L/yr`],
              [
                'Harvest potential',
                `${formatNumber(result.harvest.annualLitres)} L/yr (${formatNumber(result.harvest.annualKl, 1)} kL/yr)`,
              ],
              ['Demand coverage', `${result.coveragePct}% of annual demand`],
            ]}
          />
          <p className="mt-2 text-xs text-slate-500">
            Basis: 1 mm of rain over 1 m² of roof yields 1 litre of runoff.
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500">Results snapshot unavailable for this assessment.</p>
      )}

      <SectionTitle number={7} title="Recharge Potential & Recommended Structures" />
      {result ? (
        <KvTable
          rows={[
            [
              'Recharge potential',
              result.recharge.status === 'assessed'
                ? `${formatNumber(result.recharge.potentialKl ?? 0, 1)} kL/yr (surplus routed to ground)`
                : result.recharge.note,
            ],
            [
              'Recharge suitability',
              result.recharge.status === 'assessed'
                ? result.recharge.feasible
                  ? 'Feasible — adequate open space'
                  : 'Limited by available open space'
                : 'Requires open-space input',
            ],
          ]}
        />
      ) : null}
      {recommendation ? (
        <div className="mt-3 space-y-2">
          {[recommendation.primary, recommendation.secondary, recommendation.complementary]
            .filter((rec): rec is NonNullable<typeof rec> => rec !== null)
            .map((rec) => (
              <div key={rec.structure} className="rounded-lg border border-slate-300 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {rec.label}{' '}
                  <span className="ml-1 font-normal text-xs text-slate-500">
                    {rec.suitabilityPct}% suitable · {rec.confidence} confidence
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{rec.reason}</p>
              </div>
            ))}
          {recommendation.notes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
              {recommendation.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Structure recommendations were not captured for this assessment.
        </p>
      )}

      <SectionTitle number={8} title="Cost–Benefit Analysis" />
      {result ? (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-3 font-semibold">Component</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Basis</th>
                <th scope="col" className="py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="border-b border-slate-200">
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3">First-flush filter</td>
                <td className="py-2 pr-3 text-slate-500">Fixed allowance</td>
                <td className="py-2 text-right">{formatINR(result.cost.filterInr)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3">Plumbing &amp; fittings</td>
                <td className="py-2 pr-3 text-slate-500">
                  ₹{40}/m² × {formatNumber(result.input.roofAreaSqm)} m²
                </td>
                <td className="py-2 text-right">{formatINR(result.cost.plumbingInr)}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3">Storage tank</td>
                <td className="py-2 pr-3 text-slate-500">
                  {formatNumber(result.cost.tankLitres)} L (10 days demand)
                </td>
                <td className="py-2 text-right">{formatINR(result.cost.tankInr)}</td>
              </tr>
              {result.cost.rechargeStructureInr !== null ? (
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3">Recharge structure</td>
                  <td className="py-2 pr-3 text-slate-500">Base allowance</td>
                  <td className="py-2 text-right">{formatINR(result.cost.rechargeStructureInr)}</td>
                </tr>
              ) : null}
              <tr className="bg-slate-50">
                <td className="py-2 pr-3 font-semibold">Estimated total</td>
                <td />
                <td className="py-2 text-right font-bold">{formatINR(result.cost.totalInr)}</td>
              </tr>
            </tbody>
          </table>
          <KvTable
            rows={[
              [
                'Annual savings',
                `${formatINR(result.savings.annualInr)} — ${formatNumber(result.savings.utilisedKl, 1)} kL utilised × ₹${result.savings.tariffPerKlInr}/kL`,
              ],
              [
                'Simple payback',
                result.paybackYears !== null
                  ? `${formatNumber(result.paybackYears, 1)} years`
                  : 'Not recoverable from water savings alone',
              ],
            ]}
          />
        </>
      ) : (
        <p className="text-sm text-slate-500">Results snapshot unavailable for this assessment.</p>
      )}

      <SectionTitle number={9} title="Assumptions & Limitations" />
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
        <li>Collection efficiency of {result ? Math.round(result.input.collectionEfficiency * 100) : 90}% accounts for first-flush diversion and filter losses.</li>
        <li>Runoff coefficient reflects the selected roof material; real values vary with surface condition.</li>
        <li>Rainfall is a multi-year climatological normal; individual years vary significantly.</li>
        <li>Storage tank is sized to approximately {10} days of household demand (bounded 500–10,000 L).</li>
        <li>Recharge potential routes 50% of the post-demand surplus to ground; actual infiltration depends on soil and structure design.</li>
        <li>Costs are indicative Indian market rates for feasibility comparison only — obtain vendor quotations before construction.</li>
        <li>Groundwater-table depth was not assessed; confirm with a local hydrogeologist before building recharge structures.</li>
        <li>This document is a feasibility estimate, not a construction drawing or regulatory approval.</li>
      </ul>

      <SectionTitle number={10} title="Data Sources" />
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
        <li>Rainfall normals — Open-Meteo Historical Weather API (ERA5 daily precipitation).</li>
        <li>Soil properties — SoilGrids 2.0, ISRIC World Soil Information.</li>
        <li>Air quality — Open-Meteo Air Quality API (context only).</li>
        <li>Site imagery — Esri World Imagery (© Esri, Maxar, Earthstar Geographics); base map © OpenStreetMap contributors.</li>
        <li>Calculations — JalSetu calculation engine v{ENGINE_VERSION}.</li>
      </ul>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Generated by JalSetu on {formatDate(new Date().toISOString())} · Ref{' '}
        <span className="font-mono">{a.id.slice(0, 8).toUpperCase()}</span> · Figures are
        indicative estimates and must be verified on site before implementation.
      </footer>
    </article>
  )
}
