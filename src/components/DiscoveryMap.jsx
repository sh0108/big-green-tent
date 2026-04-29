import { useEffect, useMemo, useState } from 'react'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { MapPin } from 'lucide-react'

const STATE_NAMES = {
  AK: 'Alaska',
  AL: 'Alabama',
  AR: 'Arkansas',
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KY: 'Kentucky',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VA: 'Virginia',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WY: 'Wyoming',
}

const NAME_TO_CODE = Object.fromEntries(Object.entries(STATE_NAMES).map(([code, name]) => [name, code]))
const WIDTH = 960
const HEIGHT = 540

function hashOffset(seed) {
  let value = 0
  const text = String(seed || '')
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) % 3600
  }
  const angle = (value % 360) * (Math.PI / 180)
  const radius = 5 + (value % 18)
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

export default function DiscoveryMap({
  orgs = [],
  manualReviewOrgs = [],
  approvedIds = new Set(),
  stateFilter = 'ALL',
  onStateChange,
  onSelectOrg,
}) {
  const [topo, setTopo] = useState(null)
  const [hoveredState, setHoveredState] = useState(null)
  const [hoveredOrg, setHoveredOrg] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/data/us-states-10m.json')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setTopo(feature(data, data.objects.states))
      })
      .catch((error) => console.error('Map load failed:', error))
    return () => {
      cancelled = true
    }
  }, [])

  const { pathGen, centroids } = useMemo(() => {
    if (!topo) return { pathGen: null, centroids: {} }
    const proj = geoAlbersUsa().fitExtent(
      [[20, 20], [WIDTH - 20, HEIGHT - 20]],
      topo
    )
    const geo = geoPath(proj)
    const nextCentroids = {}
    topo.features.forEach((shape) => {
      const code = NAME_TO_CODE[shape.properties?.name]
      if (!code) return
      nextCentroids[code] = geo.centroid(shape)
    })
    return { pathGen: geo, centroids: nextCentroids }
  }, [topo])

  const availableStates = useMemo(() => {
    const counts = {}
    const allMappedOrgs = [...orgs, ...manualReviewOrgs]
    allMappedOrgs.forEach((org) => {
      if (!org.state) return
      counts[org.state] = (counts[org.state] || 0) + 1
    })
    return Object.keys(counts)
      .sort()
      .map((code) => ({ code, name: STATE_NAMES[code] || code, count: counts[code] }))
  }, [manualReviewOrgs, orgs])

  const visibleOrgs = useMemo(() => {
    const candidates = orgs.map((org) => ({ ...org, mapCategory: 'candidate' }))
    const flagged = manualReviewOrgs.map((org) => ({ ...org, mapCategory: 'manualReview' }))
    const combined = [...candidates, ...flagged]
    if (stateFilter === 'ALL') return combined
    return combined.filter((org) => org.state === stateFilter)
  }, [manualReviewOrgs, orgs, stateFilter])

  const markers = useMemo(() => {
    return visibleOrgs
      .map((org) => {
        const centroid = centroids[org.state]
        if (!centroid) return null
        const [dx, dy] = hashOffset(org.ein)
        return {
          ...org,
          x: centroid[0] + dx,
          y: centroid[1] + dy,
          approved: approvedIds.has(org.ein),
        }
      })
      .filter(Boolean)
  }, [approvedIds, centroids, visibleOrgs])

  const stateCounts = useMemo(() => {
    const counts = {}
    const allMappedOrgs = [...orgs, ...manualReviewOrgs]
    allMappedOrgs.forEach((org) => {
      if (!org.state) return
      counts[org.state] = (counts[org.state] || 0) + 1
    })
    return counts
  }, [manualReviewOrgs, orgs])

  const flaggedCount = markers.filter((marker) => marker.mapCategory === 'manualReview').length
  const approvedCount = markers.filter((marker) => marker.approved && marker.mapCategory !== 'manualReview').length
  const candidateCount = markers.length - approvedCount - flaggedCount

  const markerFill = (marker) => {
    if (marker.mapCategory === 'manualReview') return '#ed7d32'
    if (marker.approved) return '#2d915f'
    return '#f4c146'
  }

  const markerLabel = (marker) => {
    if (marker.mapCategory === 'manualReview') return 'Flagged for manual review'
    if (marker.approved) return 'Approved'
    return 'Candidate'
  }

  return (
    <div className="brand-card px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Geography</p>
          <h2 className="font-cta text-xl text-forest">Where matches are based</h2>
          <p className="mt-1 text-sm text-forest/60">
            {visibleOrgs.length} {visibleOrgs.length === 1 ? 'org' : 'orgs'} across{' '}
            {stateFilter === 'ALL' ? `${availableStates.length} states` : STATE_NAMES[stateFilter] || stateFilter}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="map-state-filter" className="text-[0.7rem] uppercase tracking-[0.16em] text-forest/55">
            State
          </label>
          <select
            id="map-state-filter"
            value={stateFilter}
            onChange={(event) => onStateChange && onStateChange(event.target.value)}
            className="brand-input brand-select min-w-[12rem]"
          >
            <option value="ALL">All states</option>
            {availableStates.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-forest/8 bg-cream/70">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto w-full"
          role="img"
          aria-label="US map of nonprofit locations"
        >
          <defs>
            <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f4c146" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f4c146" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={WIDTH} height={HEIGHT} fill="transparent" />

          {topo && pathGen
            ? topo.features.map((shape) => {
                const stateCode = NAME_TO_CODE[shape.properties?.name]
                const hasMatches = stateCode && stateCounts[stateCode]
                const isFiltered = stateFilter !== 'ALL' && stateCode !== stateFilter
                const isHovered = hoveredState === stateCode

                let fill = '#e7ddce'
                if (hasMatches) fill = '#d7cbb4'
                if (isHovered) fill = '#c4b79d'
                if (isFiltered) fill = '#ece4d4'

                return (
                  <path
                    key={shape.id}
                    d={pathGen(shape)}
                    fill={fill}
                    stroke="#0d3023"
                    strokeOpacity={isFiltered ? 0.08 : 0.18}
                    strokeWidth={0.6}
                    onMouseEnter={() => stateCode && setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{ cursor: stateCode ? 'pointer' : 'default', transition: 'fill 120ms ease' }}
                    onClick={() => {
                      if (!stateCode || !onStateChange) return
                      onStateChange(stateFilter === stateCode ? 'ALL' : stateCode)
                    }}
                  />
                )
              })
            : null}

          {markers.map((marker) => (
            <g key={marker.ein} style={{ cursor: 'pointer' }}>
              <circle cx={marker.x} cy={marker.y} r="18" fill="url(#map-glow)" pointerEvents="none" />
              <circle
                cx={marker.x}
                cy={marker.y}
                r={hoveredOrg === marker.ein ? 8 : 6}
                fill={markerFill(marker)}
                stroke="#0d3023"
                strokeWidth={1.5}
                onMouseEnter={() => setHoveredOrg(marker.ein)}
                onMouseLeave={() => setHoveredOrg(null)}
                onClick={() => onSelectOrg && onSelectOrg(marker)}
                style={{ transition: 'r 120ms ease' }}
              />
              {hoveredOrg === marker.ein ? (
                <g pointerEvents="none">
                  <rect
                    x={marker.x + 12}
                    y={marker.y - 26}
                    width={Math.min(290, Math.max(150, marker.name.length * 7 + 30))}
                    height={46}
                    rx={10}
                    fill="#0d3023"
                    opacity="0.96"
                  />
                  <text x={marker.x + 22} y={marker.y - 10} fill="#f6f0e5" fontSize="13" fontWeight="600">
                    {marker.name.length > 34 ? `${marker.name.slice(0, 34)}…` : marker.name}
                  </text>
                  <text x={marker.x + 22} y={marker.y + 7} fill="#f4c146" fontSize="11" fontWeight="600">
                    {markerLabel(marker)} · {marker.state} · Score {marker.computedOverallScore ?? marker.scoreOverall ?? '—'}
                  </text>
                </g>
              ) : null}
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-forest/70">
        <LegendSwatch color="#f4c146" label={`Candidates · ${candidateCount}`} />
        <LegendSwatch color="#2d915f" label={`Approved · ${approvedCount}`} />
        <LegendSwatch color="#ed7d32" label={`Flagged For Manual Review · ${flaggedCount}`} />
        <span className="inline-flex items-center gap-1.5 text-xs text-forest/50">
          <MapPin className="h-3.5 w-3.5" />
          Click a state or marker to filter
        </span>
      </div>
    </div>
  )
}

function LegendSwatch({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  )
}
