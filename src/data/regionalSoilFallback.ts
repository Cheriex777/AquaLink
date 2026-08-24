/**
 * Regional soil fallback dataset.
 *
 * HONESTY RULE: these are GENERALIZED texture characterizations for regions
 * (e.g., Deccan-trap black-cotton belts, coastal laterites, Indo-Gangetic
 * alluvium). They are NOT site-specific measurements and must always be
 * labelled "Regional fallback estimate" in the UI and reports.
 *
 * Hierarchy enforced by lookup(): city/district → state → India default.
 * Keep entries isolated here so they can be refined with ICAR/NBSS&LUP
 * district-level data later without touching service code.
 */

export interface RegionalSoilEntry {
  level: 'city' | 'state' | 'india'
  state?: string
  city?: string
  textureClass: string
  clayPctApprox: number
  sourceNote: string
}

const INDIA_DEFAULT: RegionalSoilEntry = {
  level: 'india',
  textureClass: 'Loam',
  clayPctApprox: 25,
  sourceNote: 'Coarse all-India composite estimate across major soil orders.',
}

const ENTRIES: RegionalSoilEntry[] = [
  // ================================================================
  // Maharashtra — all 36 districts
  // Priority entries first: Matunga, Wadala, then Mumbai, then others
  // Soil zones: Konkan coast = sandy/laterite · Vidarbha = heavy clay
  //             Marathwada = black clay · W. Maharashtra = loam/clay loam
  // ================================================================

  // --- Priority: Mumbai sub-localities (Matunga & Wadala first) ---
  { level: 'city', state: 'Maharashtra', city: 'Matunga',  textureClass: 'Sandy loam',     clayPctApprox: 12, sourceNote: 'Mumbai island sub-locality — coastal reclaimed alluvium over laterite (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Wadala',   textureClass: 'Sandy loam',     clayPctApprox: 12, sourceNote: 'Mumbai island sub-locality — coastal reclaimed alluvium over laterite (generalized).' },

  // --- Mumbai City & Mumbai Suburban district ---
  { level: 'city', state: 'Maharashtra', city: 'Mumbai',          textureClass: 'Sandy loam',      clayPctApprox: 12, sourceNote: 'Coastal alluvium / altered lateritic cover (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Dharavi',         textureClass: 'Sandy loam',      clayPctApprox: 13, sourceNote: 'Mumbai island — reclaimed tidal flats (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Bandra',          textureClass: 'Sandy loam',      clayPctApprox: 12, sourceNote: 'Mumbai Suburban — lateritic coastal soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Borivali',        textureClass: 'Sandy clay loam', clayPctApprox: 15, sourceNote: 'Mumbai Suburban — mixed laterite-alluvium (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Andheri',         textureClass: 'Sandy loam',      clayPctApprox: 13, sourceNote: 'Mumbai Suburban — lateritic (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Kurla',           textureClass: 'Sandy loam',      clayPctApprox: 13, sourceNote: 'Mumbai Suburban — reclaimed estuarine flat (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Chembur',         textureClass: 'Sandy loam',      clayPctApprox: 13, sourceNote: 'Mumbai Suburban — reclaimed alluvium (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Mulund',          textureClass: 'Sandy clay loam', clayPctApprox: 16, sourceNote: 'Mumbai Suburban — basalt outcrop fringe (generalized).' },

  // --- Thane district ---
  { level: 'city', state: 'Maharashtra', city: 'Thane',           textureClass: 'Sandy clay loam', clayPctApprox: 18, sourceNote: 'Coastal alluvium over basalt (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Kalyan',          textureClass: 'Sandy clay loam', clayPctApprox: 18, sourceNote: 'Ulhas valley alluvium (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Navi Mumbai',     textureClass: 'Sandy clay loam', clayPctApprox: 17, sourceNote: 'Reclaimed coastal alluvium (generalized).' },

  // --- Palghar district (new district, carved from Thane 2014) ---
  { level: 'city', state: 'Maharashtra', city: 'Palghar',         textureClass: 'Sandy loam',      clayPctApprox: 14, sourceNote: 'Coastal lateritic — North Konkan (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Vasai',           textureClass: 'Sandy loam',      clayPctApprox: 14, sourceNote: 'Coastal alluvium (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Dahanu',          textureClass: 'Sandy loam',      clayPctApprox: 14, sourceNote: 'North Konkan coastal laterite (generalized).' },

  // --- Raigad district ---
  { level: 'city', state: 'Maharashtra', city: 'Raigad',          textureClass: 'Sandy loam',      clayPctApprox: 16, sourceNote: 'Konkan lateritic alluvium (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Alibag',          textureClass: 'Sandy loam',      clayPctApprox: 15, sourceNote: 'Konkan coast alluvium (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Panvel',          textureClass: 'Sandy clay loam', clayPctApprox: 18, sourceNote: 'Coastal plain, alluvium (generalized).' },

  // --- Ratnagiri district ---
  { level: 'city', state: 'Maharashtra', city: 'Ratnagiri',       textureClass: 'Sandy loam',      clayPctApprox: 14, sourceNote: 'Konkan laterite, coastal (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Chiplun',         textureClass: 'Sandy loam',      clayPctApprox: 14, sourceNote: 'Konkan river valley alluvium (generalized).' },

  // --- Sindhudurg district ---
  { level: 'city', state: 'Maharashtra', city: 'Sindhudurg',      textureClass: 'Sandy loam',      clayPctApprox: 13, sourceNote: 'South Konkan laterite (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Sawantwadi',      textureClass: 'Sandy loam',      clayPctApprox: 13, sourceNote: 'South Konkan laterite (generalized).' },

  // --- Pune district ---
  { level: 'city', state: 'Maharashtra', city: 'Pune',            textureClass: 'Clay loam',       clayPctApprox: 28, sourceNote: 'Deccan plateau margin, moderate black-soil influence (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Pimpri',          textureClass: 'Clay loam',       clayPctApprox: 27, sourceNote: 'Pune fringe — basalt-derived soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Baramati',        textureClass: 'Clay loam',       clayPctApprox: 30, sourceNote: 'Bhima basin black soil (generalized).' },

  // --- Satara district ---
  { level: 'city', state: 'Maharashtra', city: 'Satara',          textureClass: 'Clay loam',       clayPctApprox: 30, sourceNote: 'Western Ghats foothill — red and black-soil mix (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Karad',           textureClass: 'Clay loam',       clayPctApprox: 30, sourceNote: 'Krishna valley black soil (generalized).' },

  // --- Sangli district ---
  { level: 'city', state: 'Maharashtra', city: 'Sangli',          textureClass: 'Clay loam',       clayPctApprox: 32, sourceNote: 'Krishna-Panchganga irrigation zone — black soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Miraj',           textureClass: 'Clay loam',       clayPctApprox: 30, sourceNote: 'Sangli district, black soil (generalized).' },

  // --- Kolhapur district ---
  { level: 'city', state: 'Maharashtra', city: 'Kolhapur',        textureClass: 'Clay loam',       clayPctApprox: 30, sourceNote: 'Lateritic upland with paddy valleys (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Ichalkaranji',    textureClass: 'Clay loam',       clayPctApprox: 28, sourceNote: 'Kolhapur district, river-plain soil (generalized).' },

  // --- Solapur district ---
  { level: 'city', state: 'Maharashtra', city: 'Solapur',         textureClass: 'Sandy loam',      clayPctApprox: 18, sourceNote: 'Drought-prone shallow-soil belt (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Akkalkot',        textureClass: 'Clay loam',       clayPctApprox: 28, sourceNote: 'Solapur district, black soil (generalized).' },

  // --- Ahmednagar district ---
  { level: 'city', state: 'Maharashtra', city: 'Ahmednagar',      textureClass: 'Sandy clay loam', clayPctApprox: 22, sourceNote: 'Deccan plateau — mixed soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Kopargaon',       textureClass: 'Sandy clay loam', clayPctApprox: 22, sourceNote: 'Godavari valley (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Shrirampur',      textureClass: 'Sandy clay loam', clayPctApprox: 22, sourceNote: 'Ahmednagar district alluvium (generalized).' },

  // --- Nashik district ---
  { level: 'city', state: 'Maharashtra', city: 'Nashik',          textureClass: 'Sandy clay loam', clayPctApprox: 25, sourceNote: 'Godavari basin grape-belt soils (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Niphad',          textureClass: 'Sandy clay loam', clayPctApprox: 22, sourceNote: 'Nashik district, Godavari valley (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Malegaon',        textureClass: 'Sandy clay loam', clayPctApprox: 24, sourceNote: 'Nashik district (generalized).' },

  // --- Dhule district ---
  { level: 'city', state: 'Maharashtra', city: 'Dhule',           textureClass: 'Sandy clay loam', clayPctApprox: 22, sourceNote: 'North Maharashtra — mixed soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Shirpur',         textureClass: 'Sandy clay loam', clayPctApprox: 20, sourceNote: 'Dhule district (generalized).' },

  // --- Nandurbar district ---
  { level: 'city', state: 'Maharashtra', city: 'Nandurbar',       textureClass: 'Sandy loam',      clayPctApprox: 18, sourceNote: 'Satpura foothills — tribal belt (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Shahada',         textureClass: 'Sandy loam',      clayPctApprox: 18, sourceNote: 'Nandurbar district, Tapi valley (generalized).' },

  // --- Jalgaon district ---
  { level: 'city', state: 'Maharashtra', city: 'Jalgaon',         textureClass: 'Sandy clay loam', clayPctApprox: 24, sourceNote: 'Tapi valley — banana-belt soils (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Bhusawal',        textureClass: 'Sandy clay loam', clayPctApprox: 22, sourceNote: 'Jalgaon district, Tapi plain (generalized).' },

  // --- Chhatrapati Sambhajinagar / Aurangabad district (Marathwada) ---
  { level: 'city', state: 'Maharashtra', city: 'Chhatrapati Sambhajinagar', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Deccan basalt plain, black-soil influence (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Aurangabad',      textureClass: 'Clay loam',       clayPctApprox: 35, sourceNote: 'Legacy name — Chhatrapati Sambhajinagar district.' },

  // --- Jalna district ---
  { level: 'city', state: 'Maharashtra', city: 'Jalna',           textureClass: 'Clay',            clayPctApprox: 42, sourceNote: 'Marathwada black-cotton soil (generalized).' },

  // --- Parbhani district ---
  { level: 'city', state: 'Maharashtra', city: 'Parbhani',        textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Marathwada deep black cotton soil (generalized).' },

  // --- Hingoli district ---
  { level: 'city', state: 'Maharashtra', city: 'Hingoli',         textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Marathwada black-soil belt (generalized).' },

  // --- Nanded district ---
  { level: 'city', state: 'Maharashtra', city: 'Nanded',          textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Godavari Marathwada belt — black clay (generalized).' },

  // --- Osmanabad / Dharashiv district ---
  { level: 'city', state: 'Maharashtra', city: 'Osmanabad',       textureClass: 'Clay',            clayPctApprox: 45, sourceNote: 'Marathwada black cotton soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Dharashiv',       textureClass: 'Clay',            clayPctApprox: 45, sourceNote: 'New name of Osmanabad district.' },
  { level: 'city', state: 'Maharashtra', city: 'Tuljapur',        textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Osmanabad district (generalized).' },

  // --- Beed district ---
  { level: 'city', state: 'Maharashtra', city: 'Beed',            textureClass: 'Clay',            clayPctApprox: 45, sourceNote: 'Marathwada sugarcane-belt black soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Ambajogai',       textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Beed district black cotton (generalized).' },

  // --- Latur district ---
  { level: 'city', state: 'Maharashtra', city: 'Latur',           textureClass: 'Clay',            clayPctApprox: 45, sourceNote: 'Marathwada black-soil earthquake belt (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Udgir',           textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Latur district black cotton (generalized).' },

  // --- Nagpur district ---
  { level: 'city', state: 'Maharashtra', city: 'Nagpur',          textureClass: 'Clay loam',       clayPctApprox: 32, sourceNote: 'Central belt transition to cotton soils (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Kamptee',         textureClass: 'Clay loam',       clayPctApprox: 30, sourceNote: 'Nagpur district (generalized).' },

  // --- Wardha district ---
  { level: 'city', state: 'Maharashtra', city: 'Wardha',          textureClass: 'Clay',            clayPctApprox: 45, sourceNote: 'Vidarbha cotton belt — deep black cotton soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Sevagram',        textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Wardha district black cotton (generalized).' },

  // --- Yavatmal district ---
  { level: 'city', state: 'Maharashtra', city: 'Yavatmal',        textureClass: 'Clay',            clayPctApprox: 48, sourceNote: 'Vidarbha deep black cotton soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Pusad',           textureClass: 'Clay',            clayPctApprox: 46, sourceNote: 'Yavatmal district (generalized).' },

  // --- Amravati district ---
  { level: 'city', state: 'Maharashtra', city: 'Amravati',        textureClass: 'Clay loam',       clayPctApprox: 35, sourceNote: 'Western Vidarbha cotton belt (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Achalpur',        textureClass: 'Clay loam',       clayPctApprox: 34, sourceNote: 'Amravati district (generalized).' },

  // --- Akola district ---
  { level: 'city', state: 'Maharashtra', city: 'Akola',           textureClass: 'Clay',            clayPctApprox: 46, sourceNote: 'Vidarbha black-cotton soybean belt (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Akot',            textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Akola district (generalized).' },

  // --- Washim district ---
  { level: 'city', state: 'Maharashtra', city: 'Washim',          textureClass: 'Clay',            clayPctApprox: 46, sourceNote: 'Vidarbha black cotton soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Risod',           textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Washim district (generalized).' },

  // --- Buldhana district ---
  { level: 'city', state: 'Maharashtra', city: 'Buldhana',        textureClass: 'Clay',            clayPctApprox: 46, sourceNote: 'Vidarbha–Marathwada fringe — black cotton (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Khamgaon',        textureClass: 'Clay',            clayPctApprox: 44, sourceNote: 'Buldhana district (generalized).' },

  // --- Chandrapur district ---
  { level: 'city', state: 'Maharashtra', city: 'Chandrapur',      textureClass: 'Clay loam',       clayPctApprox: 36, sourceNote: 'East Vidarbha — mixed red & black soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Ballarpur',       textureClass: 'Clay loam',       clayPctApprox: 35, sourceNote: 'Chandrapur district (generalized).' },

  // --- Gadchiroli district ---
  { level: 'city', state: 'Maharashtra', city: 'Gadchiroli',      textureClass: 'Sandy clay loam', clayPctApprox: 25, sourceNote: 'Tribal forest belt — red lateritic soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Aheri',           textureClass: 'Sandy clay loam', clayPctApprox: 24, sourceNote: 'Gadchiroli district (generalized).' },

  // --- Gondia district ---
  { level: 'city', state: 'Maharashtra', city: 'Gondia',          textureClass: 'Sandy loam',      clayPctApprox: 18, sourceNote: 'East Vidarbha paddy belt — red sandy soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Tirora',          textureClass: 'Sandy loam',      clayPctApprox: 17, sourceNote: 'Gondia district (generalized).' },

  // --- Bhandara district ---
  { level: 'city', state: 'Maharashtra', city: 'Bhandara',        textureClass: 'Sandy loam',      clayPctApprox: 18, sourceNote: 'East Vidarbha rice district — red soil (generalized).' },
  { level: 'city', state: 'Maharashtra', city: 'Tumsar',          textureClass: 'Sandy loam',      clayPctApprox: 17, sourceNote: 'Bhandara district (generalized).' },

  // --- State-level fallback (catches any unmatched Maharashtra location) ---
  {
    level: 'state',
    state: 'Maharashtra',
    textureClass: 'Clay',
    clayPctApprox: 45,
    sourceNote: 'Deccan-trap basaltic black-cotton (Vertisol) belt — generalized state estimate.',
  },

  // ---------------- Remaining states ----------------
  { level: 'state', state: 'Andhra Pradesh', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Krishna–Godavari alluvium with black-soil patches (generalized).' },
  { level: 'state', state: 'Arunachal Pradesh', textureClass: 'Sandy loam', clayPctApprox: 15, sourceNote: 'Himalayan foothill soils (generalized).' },
  { level: 'state', state: 'Assam', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Brahmaputra valley alluvium (generalized).' },
  { level: 'state', state: 'Bihar', textureClass: 'Clay loam', clayPctApprox: 38, sourceNote: 'Gangetic alluvium, calcareous patches (generalized).' },
  { level: 'state', state: 'Chhattisgarh', textureClass: 'Clay', clayPctApprox: 45, sourceNote: 'Black-cotton soils over Deccan/basalt (generalized).' },
  { level: 'state', state: 'Goa', textureClass: 'Sandy loam', clayPctApprox: 15, sourceNote: 'Coastal laterite (generalized).' },
  { level: 'state', state: 'Gujarat', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Alluvial and black-soil mix; heavier in Saurashtra (generalized).' },
  { level: 'state', state: 'Haryana', textureClass: 'Clay loam', clayPctApprox: 32, sourceNote: 'Indo-Gangetic alluvium (generalized).' },
  { level: 'state', state: 'Himachal Pradesh', textureClass: 'Sandy loam', clayPctApprox: 18, sourceNote: 'Mountain soils (generalized).' },
  { level: 'state', state: 'Jharkhand', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Red and lateritic soils (generalized).' },
  { level: 'state', state: 'Karnataka', textureClass: 'Clay loam', clayPctApprox: 30, sourceNote: 'Deccan plateau red/laterite mix (generalized).' },
  { level: 'state', state: 'Kerala', textureClass: 'Sandy clay loam', clayPctApprox: 22, sourceNote: 'Laterite uplands (generalized).' },
  { level: 'state', state: 'Madhya Pradesh', textureClass: 'Clay', clayPctApprox: 45, sourceNote: 'Black-cotton soil belt (generalized).' },
  { level: 'state', state: 'Manipur', textureClass: 'Clay loam', clayPctApprox: 30, sourceNote: 'North-east hill valley soils (generalized).' },
  { level: 'state', state: 'Meghalaya', textureClass: 'Clay loam', clayPctApprox: 30, sourceNote: 'North-east hill soils (generalized).' },
  { level: 'state', state: 'Mizoram', textureClass: 'Clay loam', clayPctApprox: 30, sourceNote: 'North-east hill soils (generalized).' },
  { level: 'state', state: 'Nagaland', textureClass: 'Clay loam', clayPctApprox: 30, sourceNote: 'North-east hill soils (generalized).' },
  { level: 'state', state: 'Tripura', textureClass: 'Clay loam', clayPctApprox: 30, sourceNote: 'North-east hill soils (generalized).' },
  { level: 'state', state: 'Odisha', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Red, laterite and black-soil mix (generalized).' },
  { level: 'state', state: 'Punjab', textureClass: 'Clay loam', clayPctApprox: 30, sourceNote: 'Alluvial plains (generalized).' },
  { level: 'state', state: 'Rajasthan', textureClass: 'Sandy loam', clayPctApprox: 18, sourceNote: 'Arid western sands with eastern black-soil pockets (generalized).' },
  { level: 'state', state: 'Sikkim', textureClass: 'Sandy loam', clayPctApprox: 18, sourceNote: 'Mountain soils (generalized).' },
  { level: 'state', state: 'Tamil Nadu', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Red/black soil mix; heavier in Cauvery delta (generalized).' },
  { level: 'state', state: 'Telangana', textureClass: 'Clay', clayPctApprox: 45, sourceNote: 'Deccan black soils (generalized).' },
  { level: 'state', state: 'Uttar Pradesh', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Gangetic alluvium (generalized).' },
  { level: 'state', state: 'Uttarakhand', textureClass: 'Sandy loam', clayPctApprox: 18, sourceNote: 'Mountain soils (generalized).' },
  { level: 'state', state: 'West Bengal', textureClass: 'Clay loam', clayPctApprox: 38, sourceNote: 'Deltaic alluvium (generalized).' },

  // ---------------- Union Territories ----------------
  { level: 'state', state: 'Delhi', textureClass: 'Clay loam', clayPctApprox: 32, sourceNote: 'Yamuna alluvial plain (generalized).' },
  { level: 'state', state: 'Jammu & Kashmir', textureClass: 'Sandy loam', clayPctApprox: 18, sourceNote: 'Mountain and valley soils (generalized).' },
  { level: 'state', state: 'Ladakh', textureClass: 'Sandy loam', clayPctApprox: 12, sourceNote: 'Cold-desert soils (generalized).' },
  { level: 'state', state: 'Puducherry', textureClass: 'Clay loam', clayPctApprox: 35, sourceNote: 'Coastal alluvium (generalized).' },
  { level: 'state', state: 'Chandigarh', textureClass: 'Sandy loam', clayPctApprox: 20, sourceNote: 'Alluvial fan soils (generalized).' },
  { level: 'state', state: 'Andaman & Nicobar Islands', textureClass: 'Sandy loam', clayPctApprox: 15, sourceNote: 'Island soils (generalized).' },
  { level: 'state', state: 'Lakshadweep', textureClass: 'Sand', clayPctApprox: 8, sourceNote: 'Coral sandy soils (generalized).' },
  { level: 'state', state: 'Dadra & Nagar Haveli and Daman & Diu', textureClass: 'Sandy loam', clayPctApprox: 20, sourceNote: 'Coastal alluvium (generalized).' },
]

const STATE_ALIASES: Record<string, string> = {
  orissa: 'odisha',
  pondicherry: 'puducherry',
  uttaranchal: 'uttarakhand',
  telengana: 'telangana',
  'jammu and kashmir': 'jammu & kashmir',
  'nct of delhi': 'delhi',
  'new delhi': 'delhi',
  chhattisgarh: 'chhattisgarh',
}

const CITY_ALIASES: Record<string, string> = {
  bombay: 'mumbai',
}

export interface RegionalSoilMatch {
  entry: RegionalSoilEntry
  matchedLevel: 'city' | 'state' | 'india'
}

/**
 * Converts a regional entry into the SAME shape the UI expects from live
 * SoilGrids data (SoilData), with honest provenance fields attached.
 */
export function toRegionalSoilData(match: RegionalSoilMatch): import('../types/environmental').SoilData {
  const { entry, matchedLevel } = match
  const scope =
    matchedLevel === 'city'
      ? `Matched city entry: ${entry.city}`
      : matchedLevel === 'state'
        ? `Matched state entry: ${entry.state}`
        : 'All-India composite default'
  return {
    textureClass: entry.textureClass,
    sandPct: null,
    siltPct: null,
    clayPct: entry.clayPctApprox,
    phH2o: null,
    depthLabel: 'regional estimate',
    provider: 'regional-fallback',
    sourceLabel: 'Regional fallback estimate',
    matchNote: `${scope} — ${entry.sourceNote}`,
  }
}

function normaliseState(value: string): string {
  const lower = value.trim().toLowerCase()
  return STATE_ALIASES[lower] ?? lower
}

function normaliseCity(value: string | null): string | null {
  if (!value?.trim()) return null
  const lower = value.trim().toLowerCase()
  return CITY_ALIASES[lower] ?? lower
}

/**
 * Resolves the coarsest→finest hierarchy: city/district → state → India.
 * Returns null only when no input names were provided at all AND the caller
 * still owes the user an explicit "unavailable" state.
 */
export function lookupRegionalSoil(
  stateName: string | null,
  cityName: string | null,
): RegionalSoilMatch | null {
  const state = stateName?.trim() ? normaliseState(stateName) : null
  const city = normaliseCity(cityName)

  if (city && state) {
    const cityMatch = ENTRIES.find(
      (entry) =>
        entry.level === 'city' &&
        entry.state?.toLowerCase() === state &&
        entry.city!.toLowerCase() === city,
    )
    if (cityMatch) return { entry: cityMatch, matchedLevel: 'city' }
  }

  if (city) {
    const aliasCityMatch = ENTRIES.find(
      (entry) =>
        entry.level === 'city' &&
        entry.city!.toLowerCase() === city &&
        (!state || entry.state?.toLowerCase() === state),
    )
    if (aliasCityMatch) return { entry: aliasCityMatch, matchedLevel: 'city' }
  }

  if (state) {
    const stateMatch = ENTRIES.find(
      (entry) => entry.level === 'state' && entry.state?.toLowerCase() === state,
    )
    if (stateMatch) return { entry: stateMatch, matchedLevel: 'state' }
  }

  return { entry: INDIA_DEFAULT, matchedLevel: 'india' }
}
