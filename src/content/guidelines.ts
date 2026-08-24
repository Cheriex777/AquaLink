/**
 * Guidelines content — compiled from public OFFICIAL Indian sources.
 * Every standard/regulation named below was verified to exist via the
 * publishers' own portals (CGWB, MoHUA/MoWR, BIS via JSA Knowledge Centre).
 * Indicative dimensions are general good practice, clearly labelled as such.
 */

export interface GuidelineResource {
  title: string
  publisher: string
  url?: string
  note?: string
}

export interface StructureGuideline {
  id: string
  name: string
  description: string
  typicalSizeIndicative: string
  suitableWhen: string[]
}

export interface MaintenanceTask {
  component: string
  frequency: string
  task: string
}

export interface ImplementationStep {
  step: number
  title: string
  detail: string
}

export const BASICS_COMPONENTS: Array<{ name: string; role: string }> = [
  {
    name: 'Catchment (roof)',
    role: 'The roof surface collects rain. Smooth, non-toxic surfaces (RCC, metal sheet, tile) yield the most water.',
  },
  {
    name: 'Conveyance (gutters & downpipes)',
    role: 'Carry water from the roof edges to the filter or storage. Slope gutters continuously and size downpipes for peak monsoon intensity.',
  },
  {
    name: 'First-flush diverter',
    role: 'Discards the first spell of each rain, which carries dust, leaves and bird droppings off the roof — protecting filters and stored water.',
  },
  {
    name: 'Filter',
    role: 'Removes silt and finer contaminants before storage or recharge. Common media: gravel–sand–charcoal layers in a filter chamber.',
  },
  {
    name: 'Storage tank',
    role: 'Holds treated water for direct reuse. Opaque, covered, vented; sized against demand and dry-spell needs.',
  },
  {
    name: 'Recharge structure',
    role: 'Routes filtered surplus into the ground through pits, trenches or wells to replenish groundwater.',
  },
]

export const IMPLEMENTATION_STEPS: ImplementationStep[] = [
  {
    step: 1,
    title: 'Assess the site',
    detail:
      'Measure roof area, note material and slope, check available open space and soil type. The JalSetu wizard automates this assessment, including satellite tracing of the roof.',
  },
  {
    step: 2,
    title: 'Estimate potential',
    detail:
      'Apply local rainfall normals to the catchment: Harvestable litres ≈ Roof area (m²) × Rainfall (mm) × runoff coefficient × collection efficiency. Compare with household demand to decide storage vs recharge emphasis.',
  },
  {
    step: 3,
    title: 'Choose structures & design',
    detail:
      'Select pit / trench / well / tank per site conditions (see the Structures tab). Follow design guidance in the CGWB Manual on Artificial Recharge and IS 15797:2008 for rooftop systems.',
  },
  {
    step: 4,
    title: 'Check local rules',
    detail:
      'Many states/urban bodies mandate RWH for new buildings above plot-size thresholds. Confirm applicable bye-laws with your local development authority before construction.',
  },
  {
    step: 5,
    title: 'Construct',
    detail:
      'Ensure slopes towards outlets, sealed joints, first-flush and filter installation before any connection to storage or recharge, and overflow arrangements away from foundations.',
  },
  {
    step: 6,
    title: 'Commission before monsoon',
    detail:
      'Complete work ahead of the rains: flush lines, test overflows, verify filter flow and label valves for storage vs recharge paths.',
  },
  {
    step: 7,
    title: 'Operate & maintain',
    detail:
      'Follow the maintenance schedule (Maintenance tab). Infiltration capacity falls rapidly when silting is neglected — periodic cleaning is essential (CGWB Manual, O&M chapter).',
  },
]

export const STRUCTURES: StructureGuideline[] = [
  {
    id: 'recharge_pit',
    name: 'Recharge pit',
    description:
      'A small dug/drilled pit filled with boulder–gravel–coarse-sand media that lets filtered rooftop water percolate into shallow groundwater.',
    typicalSizeIndicative: '1–2 m wide × 2–3 m deep (indicative)',
    suitableWhen: [
      'Permeable to moderate soils (sandy loam, loam)',
      'Small plots — needs only ~1–2 m² footprint',
      'Roof surplus available after meeting demand',
    ],
  },
  {
    id: 'recharge_trench',
    name: 'Recharge trench',
    description:
      'A shallow continuous trench with filter media receiving larger flows; suited where a single pit is too small for the runoff volume.',
    typicalSizeIndicative: '0.5–1 m deep × 1–1.5 m wide, length as needed (indicative)',
    suitableWhen: [
      'Plots with ≥ 30 m² open space along a run',
      'Moderate to high permeability soils',
      'Seasonal heavy rainfall needing faster intake',
    ],
  },
  {
    id: 'recharge_well',
    name: 'Recharge well',
    description:
      'A dug or drilled well recharging deeper aquifers directly. Requires hydrogeological confirmation — always verify water-table depth and aquifer conditions locally first.',
    typicalSizeIndicative: 'Site-specific (indicative)',
    suitableWhen: [
      'Large plots with confirmed aquifer access',
      'High-permeability strata',
      'Substantial reliable surplus',
    ],
  },
  {
    id: 'storage_tank',
    name: 'Storage tank',
    description:
      'Covered tank storing filtered rooftop water for direct reuse in flushing, cleaning and (with treatment) other uses.',
    typicalSizeIndicative: '500–10,000 L common domestic range (indicative)',
    suitableWhen: [
      'Demand exceeds harvest — store every usable litre',
      'Low-permeability (clay) sites where recharge is limited',
      'Areas with long dry spells after intense monsoons',
    ],
  },
  {
    id: 'filter_chamber',
    name: 'Filter chamber',
    description:
      'Gravel–sand(-charcoal) chamber between downpipe and storage/recharge, removing silt and organic matter. Essential companion to any system on roofs above ~80–100 m².',
    typicalSizeIndicative: '0.6×0.6×0.6 m to 1×1×1 m chambers (indicative)',
    suitableWhen: [
      'Always — protects both tanks and recharge structures',
      'Larger roofs producing heavier silt loads',
    ],
  },
  {
    id: 'rooftop_system',
    name: 'Complete rooftop harvesting system',
    description:
      'Gutters + downpipes + first-flush + filter feeding storage and/or recharge — the baseline package every building starts with.',
    typicalSizeIndicative: 'Sized to roof area (indicative)',
    suitableWhen: [
      'Every property — ground structures are additions to it',
      'Sites without space for ground structures',
    ],
  },
]

export const MAINTENANCE_TASKS: MaintenanceTask[] = [
  { component: 'Roof & gutters', frequency: 'Monthly in monsoon; before first rain', task: 'Clear leaves, dust and debris; check gutter slopes and joints.' },
  { component: 'First-flush diverter', frequency: 'Start of every rain event', task: 'Verify it diverts the first flush; drain the held water afterwards.' },
  { component: 'Filter chamber', frequency: 'Quarterly (more often in monsoon)', task: 'Open, check flow rate; replace/top-up top sand layer when clogged or slow.' },
  { component: 'Storage tank', frequency: 'Annually (pre-monsoon)', task: 'Empty, scrub walls, disinfect per safe practice, inspect cover, vent mesh and overflow.' },
  { component: 'Recharge pit/trench', frequency: 'Annually pre-monsoon', task: 'Desilt top media and scrape infiltration surface — CGWB notes capacity drops rapidly from silting.' },
  { component: 'Recharge well', frequency: 'As advised locally', task: 'Inspect casing/covering; if yield slows, professional redevelopment may be needed.' },
  { component: 'Pipes & overflow', frequency: 'Pre-monsoon', task: 'Confirm overflow paths discharge away from foundations; no cross-connection with sewerage.' },
]

export interface StandardReference {
  name: string
  body: string
  whatItCovers: string
}

export const STANDARDS: StandardReference[] = [
  {
    name: 'IS 15797:2008 — Rooftop Rainwater Harvesting Guidelines',
    body: 'Bureau of Indian Standards',
    whatItCovers:
      'Indian Standard guidelines for rooftop rainwater harvesting systems. Listed in the Jal Shakti Abhiyan Knowledge Centre; obtain the current edition from BIS.',
  },
  {
    name: 'Manual on Artificial Recharge of Ground Water (2007) & Guide on Artificial Recharge (updated)',
    body: 'Central Ground Water Board (CGWB), Ministry of Jal Shakti',
    whatItCovers:
      'Site selection, planning and design of artificial recharge structures, rooftop RWH chapter, impact assessment, and operation & maintenance — the reference engineering manual in India.',
  },
  {
    name: 'Model Building Bye-Laws 2016',
    body: 'Ministry of Housing & Urban Affairs (MoHUA)',
    whatItCovers:
      'Model provisions requiring rainwater harvesting for new buildings above specified plot/roof sizes; adopted with variations by states and urban local bodies.',
  },
  {
    name: 'National Building Code of India 2016 (Part 9 — Plumbing Services)',
    body: 'Bureau of Indian Standards',
    whatItCovers:
      'Includes provisions covering water supply, plumbing and rainwater harvesting practices for buildings.',
  },
  {
    name: 'Rain Water Harvesting & Conservation Manual (2019)',
    body: 'CPWD (Central Public Works Department)',
    whatItCovers:
      'Government works department manual with practical design and maintenance practice for RWH in buildings.',
  },
  {
    name: 'Jal Shakti Abhiyan: Catch the Rain',
    body: 'Ministry of Jal Shakti / National Water Mission',
    whatItCovers:
      'Annual national campaign promoting rainwater harvesting structures — “Catch the rain, where it falls, when it falls.” Knowledge Centre hosts the manuals listed above.',
  },
]

export const RESOURCES: GuidelineResource[] = [
  {
    title: 'JSA: Catch the Rain — Knowledge Centre',
    publisher: 'Ministry of Jal Shakti',
    url: 'https://jsactr.mowr.gov.in/Public_Dash/KnowledgeCentre.aspx',
    note: 'One-stop download point for the CGWB Manual/Guide, IS 15797, CPWD manuals and Model Bye-Laws.',
  },
  {
    title: 'CGWB Publications repository',
    publisher: 'Central Ground Water Board',
    url: 'https://cgwb.gov.in/cgwbpnm/publications',
    note: 'Artificial-recharge manuals, Master Plan, district recharge plans, aquifer atlases.',
  },
  {
    title: 'Catch the Rain portal',
    publisher: 'National Water Mission',
    url: 'https://nwm.gov.in/catchtherain',
    note: 'Campaign details, themes and state best practices.',
  },
  {
    title: 'Ministry of Housing & Urban Affairs',
    publisher: 'MoHUA',
    url: 'https://mohua.gov.in',
    note: 'Model Building Bye-Laws and urban RWH advisories.',
  },
  {
    title: 'Bureau of Indian Standards',
    publisher: 'BIS',
    url: 'https://www.bis.gov.in',
    note: 'Purchase current editions of IS 15797:2008 and the National Building Code.',
  },
  {
    title: 'India Water Portal — rainwater harvesting guides',
    publisher: 'India Water Portal (civil-society initiative)',
    url: 'https://www.indiawaterportal.org',
    note: 'Practical how-to material and case studies. Non-governmental resource.',
  },
]
