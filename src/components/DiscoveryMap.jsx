import { useEffect, useMemo, useState } from 'react'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { MapPin } from 'lucide-react'

const CITY_COORDS = {
  'San Diego, CA': [-117.1611, 32.7157],
  'Newport Beach, CA': [-117.9242, 33.6189],
  'Erie, PA': [-80.0851, 42.1292],
  'Apple Valley, MN': [-93.2010, 44.7319],
  'Houston, TX': [-95.3698, 29.7604],
  'Palm Springs, CA': [-116.5453, 33.8303],
  'Ellensburg, WA': [-120.5478, 46.9965],
  'Chandler, AZ': [-111.8413, 33.3062],
  'Charlotte, NC': [-80.8431, 35.2271],
  'Las Vegas, NV': [-115.1398, 36.1699],
}

const STATE_NAMES = {
  CA: 'California', PA: 'Pennsylvania', MN: 'Minnesota', TX: 'Texas',
  WA: 'Washington', AZ: 'Arizona', NC: 'North Carolina', NV: 'Nevada',
}

const WIDTH = 960
const HEIGHT = 540

function parseState(location) {
  if (!location) return null
  const match = location.match(/,\s*([A-Z]{2})\s*$/)
  return match ? match[1] : null
}

export default function DiscoveryMap({ orgs = [], approvedIds = new Set(), onSelectOrg }) {
  const [topo, setTopo] = useState(null)
  const [stateFilter, setStateFilter] = useState('ALL')
  const [hoveredState, setHoveredState] = useState(null)
  const [hoveredOrg, setHoveredOrg] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/data/us-states-10m.json')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const fc = feature(data, data.objects.states)
        setTopo(fc)
      })
      .catch((err) => console.error('Map load failed:', err))
    return () => {
      cancelled = true
    }
  }, [])

  const { projection, pathGen } = useMemo(() => {
    if (!topo) return { projection: null, pathGen: null }
    const proj = geoAlbersUsa().fitExtent(
      [[20, 20], [WIDTH - 20, HEIGHT - 20]],
      topo,
    )
    return { projection: proj, pathGen: geoPath(proj) }
  }, [topo])

  const orgsWithCoords = useMemo(() => {
    return orgs
      .map((org) => {
        const coords = CITY_COORDS[org.location]
        if (!coords) return null
        return { ...org, coords, stateCode: parseState(org.location) }
      })
      .filter(Boolean)
  }, [orgs])

  const stateCounts = useMemo(() => {
    const counts = {}
    orgsWithCoords.forEach((o) => {
      if (!o.stateCode) return
      counts[o.stateCode] = (counts[o.stateCode] || 0) + 1
    })
    return counts
  }, [orgsWithCoords])

  const availableStates = useMemo(() => {
    return Object.keys(stateCounts)
      .map((code) => ({ code, name: STATE_NAMES[code] || code, count: stateCounts[code] }))
      .sort((a, b) => b.count - a.count)
  }, [stateCounts])

  const visibleOrgs = useMemo(() => {
    if (stateFilter === 'ALL') return orgsWithCoords
    return orgsWithCoords.filter((o) => o.stateCode === stateFilter)
  }, [orgsWithCoords, stateFilter])

  const markers = useMemo(() => {
    if (!projection) return []
    return visibleOrgs
      .map((o) => {
        const p = projection(o.coords)
        if (!p) return null
        return { ...o, x: p[0], y: p[1], approved: approvedIds.has(o.id) }
      })
      .filter(Boolean)
  }, [visibleOrgs, projection, approvedIds])

  const approvedCount = markers.filter((m) => m.approved).length
  const candidateCount = markers.length - approvedCount

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
            onChange={(e) => setStateFilter(e.target.value)}
            className="brand-input brand-select min-w-[12rem]"
          >
            <option value="ALL">All states</option>
            {availableStates.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.count})
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
            ? topo.features.map((f) => {
                const code = f.properties?.name
                const stateCode = Object.entries(STATE_NAMES).find(([, name]) => name === code)?.[0]
                const hasMatches = stateCode && stateCounts[stateCode]
                const isFiltered = stateFilter !== 'ALL' && stateCode !== stateFilter
                const isHovered = hoveredState === stateCode

                let fill = '#e7ddce'
                if (hasMatches) fill = '#d7cbb4'
                if (isHovered) fill = '#c4b79d'
                if (isFiltered) fill = '#ece4d4'

                return (
                  <path
                    key={f.id}
                    d={pathGen(f)}
                    fill={fill}
                    stroke="#0d3023"
                    strokeOpacity={isFiltered ? 0.08 : 0.18}
                    strokeWidth={0.6}
                    onMouseEnter={() => stateCode && setHoveredState(stateCode)}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{ cursor: stateCode ? 'pointer' : 'default', transition: 'fill 120ms ease' }}
                    onClick={() => {
                      if (!stateCode) return
                      setStateFilter((curr) => (curr === stateCode ? 'ALL' : stateCode))
                    }}
                  />
                )
              })
            : null}

          {markers.map((m) => (
            <g key={m.id} style={{ cursor: 'pointer' }}>
              <circle cx={m.x} cy={m.y} r="18" fill="url(#map-glow)" pointerEvents="none" />
              <circle
                cx={m.x}
                cy={m.y}
                r={hoveredOrg === m.id ? 8 : 6}
                fill={m.approved ? '#2d915f' : '#f4c146'}
                stroke="#0d3023"
                strokeWidth={1.5}
                onMouseEnter={() => setHoveredOrg(m.id)}
                onMouseLeave={() => setHoveredOrg(null)}
                onClick={() => onSelectOrg && onSelectOrg(m)}
                style={{ transition: 'r 120ms ease' }}
              />
              {hoveredOrg === m.id ? (
                <g pointerEvents="none">
                  <rect
                    x={m.x + 12}
                    y={m.y - 26}
                    width={Math.min(260, Math.max(140, m.name.length * 7 + 28))}
                    height={44}
                    rx={10}
                    fill="#0d3023"
                    opacity="0.96"
                  />
                  <text x={m.x + 22} y={m.y - 10} fill="#f6f0e5" fontSize="13" fontWeight="600">
                    {m.name.length > 32 ? `${m.name.slice(0, 32)}…` : m.name}
                  </text>
                  <text x={m.x + 22} y={m.y + 6} fill="#f4c146" fontSize="11" fontWeight="600">
                    {m.location} · Score {m.score ?? '—'}
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
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-forest/30"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
