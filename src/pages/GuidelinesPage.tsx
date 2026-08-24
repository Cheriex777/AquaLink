import { useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  BookOpen,
  Droplets,
  ExternalLink,
  Hammer,
  Landmark,
  ListChecks,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import {
  BASICS_COMPONENTS,
  IMPLEMENTATION_STEPS,
  MAINTENANCE_TASKS,
  RESOURCES,
  STANDARDS,
  STRUCTURES,
} from '../content/guidelines'

type TabId = 'basics' | 'implementation' | 'structures' | 'maintenance' | 'standards' | 'resources'

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'basics', label: 'RWH Basics', icon: Droplets },
  { id: 'implementation', label: 'Implementation', icon: Hammer },
  { id: 'structures', label: 'Structures', icon: ArrowDownToLine },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'standards', label: 'Standards & Rules', icon: Landmark },
  { id: 'resources', label: 'Official Resources', icon: BookOpen },
]

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">{children}</div>
  )
}

function BasicsTab() {
  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-slate-900">
        How a rooftop rainwater harvesting system works
      </h3>
      <p className="mt-1.5 text-sm text-slate-600">
        Every system — from a small house to a large institution — is a chain of
        the same six components. Water only stays as clean as the weakest link.
      </p>
      <ol className="mt-4 space-y-3">
        {BASICS_COMPONENTS.map((component, index) => (
          <li key={component.name} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{component.name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{component.role}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-lg bg-primary-50 px-4 py-3 text-xs text-primary-800">
        Rule of thumb: 1 mm of rain over 1 m² of roof = 1 litre. Run your own
        numbers with “New Assessment”.
      </p>
    </SectionCard>
  )
}

function ImplementationTab() {
  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-slate-900">Implementation steps</h3>
      <ol className="mt-4 space-y-4">
        {IMPLEMENTATION_STEPS.map((step) => (
          <li key={step.step} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
              {step.step}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  )
}

function StructuresTab() {
  return (
    <div className="space-y-4">
      {STRUCTURES.map((structure) => (
        <SectionCard key={structure.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">{structure.name}</h3>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {structure.typicalSizeIndicative}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{structure.description}</p>
          <ul className="mt-3 grid gap-1.5">
            {structure.suitableWhen.map((condition) => (
              <li key={condition} className="flex items-start gap-1.5 text-xs text-slate-500">
                <ListChecks className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                {condition}
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Dimensions above are indicative good-practice ranges for typical homes —
        final sizing must follow the CGWB Manual and site conditions. JalSetu’s
        recommendation engine applies the same suitability logic to your inputs.
      </p>
    </div>
  )
}

function MaintenanceTab() {
  return (
    <SectionCard>
      <h3 className="text-base font-semibold text-slate-900">Maintenance schedule</h3>
      <p className="mt-1.5 text-sm text-slate-600">
        Neglected systems fail quietly: filters clog, tanks silt, recharge media
        lose capacity. Keep this schedule visible near the system.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-2 pr-3 font-semibold">Component</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Frequency</th>
              <th scope="col" className="py-2 font-semibold">Task</th>
            </tr>
          </thead>
          <tbody>
            {MAINTENANCE_TASKS.map((task) => (
              <tr key={task.component} className="border-b border-slate-100 align-top">
                <td className="py-2.5 pr-3 font-medium text-slate-900">{task.component}</td>
                <td className="py-2.5 pr-3 text-xs font-medium text-primary-700">{task.frequency}</td>
                <td className="py-2.5 text-slate-600">{task.task}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

function StandardsTab() {
  return (
    <>
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Always verify the <strong>current edition</strong> of a standard and your
          local bye-laws before design or construction — amendments and state
          adaptations change requirements over time.
        </span>
      </div>
      <div className="space-y-4">
        {STANDARDS.map((standard) => (
          <SectionCard key={standard.name}>
            <p className="text-sm font-semibold text-slate-900">{standard.name}</p>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-primary-700">
              {standard.body}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{standard.whatItCovers}</p>
          </SectionCard>
        ))}
      </div>
    </>
  )
}

function ResourcesTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {RESOURCES.map((resource) => (
        <a
          key={resource.title}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                {resource.title}
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                {resource.publisher}
              </p>
            </div>
            <ExternalLink className="size-4 shrink-0 text-slate-400 group-hover:text-primary-600" aria-hidden="true" />
          </div>
          {resource.note ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{resource.note}</p>
          ) : null}
        </a>
      ))}
    </div>
  )
}

const TAB_RENDERERS: Record<TabId, () => React.ReactNode> = {
  basics: BasicsTab,
  implementation: ImplementationTab,
  structures: StructuresTab,
  maintenance: MaintenanceTab,
  standards: StandardsTab,
  resources: ResourcesTab,
}

export default function GuidelinesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('basics')
  const ActiveRenderer = TAB_RENDERERS[activeTab]
  const activeMeta = TABS.find((tab) => tab.id === activeTab)
  const ActiveTabIcon = activeMeta?.icon

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Guidelines</h2>
        <p className="mt-0.5 max-w-2xl text-sm text-slate-500">
          Rainwater harvesting and artificial-recharge guidance compiled from
          official Indian sources — CGWB, Ministry of Jal Shakti, MoHUA, BIS and
          CPWD. Verify current editions before construction.
        </p>
      </div>

      <div className="flex gap-6">
        <nav
          aria-label="Guideline topics"
          className="hidden w-56 shrink-0 flex-col gap-1 lg:flex"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="size-4 shrink-0" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 lg:hidden" role="presentation">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-600'
                }`}
              >
                <tab.icon className="size-3.5" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {ActiveTabIcon && activeMeta ? (
              <>
                <ActiveTabIcon className="size-4 text-primary-600" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-900">{activeMeta.label}</h3>
              </>
            ) : null}
          </div>

          <ActiveRenderer />
        </div>
      </div>
    </div>
  )
}
