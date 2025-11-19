import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Simple equirectangular projection
const projectPoint = (lat, lng, width, height) => {
  const x = ((lng + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}

export default function AirportMap() {
  const [airports, setAirports] = useState([])
  const [selected, setSelected] = useState(null)
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const width = 1100
  const height = 550

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/airports`)
        const data = await res.json()
        setAirports(data)
      } catch (e) {
        setError('Failed to load airports')
      }
    }
    load()
  }, [])

  const handleSelect = async (iata) => {
    setError('')
    setSelected(null)
    setConnections([])
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/routes/${iata}`)
      if (!res.ok) throw new Error('Failed to load routes')
      const data = await res.json()
      setSelected(data.airport)
      setConnections(data.connections)
    } catch (e) {
      setError('Could not load routes')
    } finally {
      setLoading(false)
    }
  }

  const airportPositions = useMemo(() => {
    const map = {}
    airports.forEach(a => {
      map[a.iata] = {
        ...a,
        ...projectPoint(a.lat, a.lng, width, height)
      }
    })
    return map
  }, [airports])

  const selectedPos = selected ? airportPositions[selected.iata] : null

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-2xl font-semibold">Explore direct routes</h2>
          <p className="text-blue-300/80 text-sm">Pick an airport to see its nonstop destinations. Click a destination to open its summary.</p>
        </div>
        {selected && (
          <div className="text-right">
            <p className="text-blue-200 text-sm">Selected</p>
            <p className="text-white font-semibold">{selected.name} ({selected.iata})</p>
          </div>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden ring-1 ring-blue-500/20 bg-slate-900/40">
        {/* Background gradient "map" placeholder */}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[520px]">
          <defs>
            <linearGradient id="ocean" x1="0" x2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0b1220" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={width} height={height} fill="url(#ocean)" />

          {/* Subtle grid */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v-${i}`} x1={(i+1) * (width/12)} y1={0} x2={(i+1) * (width/12)} y2={height} stroke="#1e293b" strokeOpacity="0.35" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h-${i}`} y1={(i+1) * (height/6)} x1={0} y2={(i+1) * (height/6)} x2={width} stroke="#1e293b" strokeOpacity="0.35" />
          ))}

          {/* Route lines */}
          {selected && selectedPos && connections.map(dest => {
            const dpos = airportPositions[dest.iata]
            if (!dpos) return null
            return (
              <g key={`route-${dest.iata}`}> 
                <line x1={selectedPos.x} y1={selectedPos.y} x2={dpos.x} y2={dpos.y} stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="2" />
              </g>
            )
          })}

          {/* Airports dots */}
          {airports.map(a => {
            const p = airportPositions[a.iata]
            const isSelected = selected && a.iata === selected.iata
            return (
              <g key={a.iata} className="cursor-pointer" onClick={() => handleSelect(a.iata)}>
                <circle cx={p.x} cy={p.y} r={isSelected ? 6 : 4} fill={isSelected ? '#60a5fa' : '#f8fafc'} opacity={isSelected ? 1 : 0.9} />
                <text x={p.x + 8} y={p.y - 8} fontSize="12" fill="#e2e8f0" opacity="0.9">{a.iata}</text>
              </g>
            )
          })}

          {/* Clickable destination hotspots */}
          {selected && connections.map(dest => {
            const p = airportPositions[dest.iata]
            if (!p) return null
            return (
              <g key={`dest-${dest.iata}`} onClick={(e) => { e.stopPropagation(); navigate(`/destination/${dest.iata}`) }} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={10} fill="#38bdf8" opacity="0" />
              </g>
            )
          })}
        </svg>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
            <div className="text-blue-200">Loading routes…</div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 text-red-300 text-sm">{error}</div>
      )}
    </div>
  )
}
