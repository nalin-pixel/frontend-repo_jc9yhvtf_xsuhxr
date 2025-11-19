import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function AirportMap() {
  const [airports, setAirports] = useState([])
  const [selected, setSelected] = useState(null)
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/airports`)
        if (!res.ok) throw new Error('bad response')
        const data = await res.json()
        setAirports(data)
      } catch (e) {
        console.error(e)
        setError('Failed to load airports')
      }
    }
    load()
  }, [])

  const bounds = useMemo(() => {
    if (!airports.length) return undefined
    const lats = airports.map(a => a.lat)
    const lngs = airports.map(a => a.lng)
    const southWest = [Math.min(...lats), Math.min(...lngs)]
    const northEast = [Math.max(...lats), Math.max(...lngs)]
    return [southWest, northEast]
  }, [airports])

  const onSelect = async (iata) => {
    setError('')
    setSelected(null)
    setConnections([])
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/routes/${iata}?limit=9999`)
      if (!res.ok) throw new Error('Failed to load routes')
      const data = await res.json()
      setSelected(data.airport)
      setConnections(data.connections)
    } catch (e) {
      console.error(e)
      setError('Could not load routes')
    } finally {
      setLoading(false)
    }
  }

  const center = selected ? [selected.lat, selected.lng] : [20, 0]

  const visibleAirports = useMemo(() => {
    if (!selected) return airports
    const connSet = new Set(connections.map(c => c.iata))
    return airports.filter(a => a.iata === selected.iata || connSet.has(a.iata))
  }, [airports, selected, connections])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-2xl font-semibold">Explore direct routes</h2>
          <p className="text-blue-300/80 text-sm">Tap an airport to see its nonstop destinations. Click a destination to open details.</p>
        </div>
        {selected && (
          <div className="text-right">
            <p className="text-blue-200 text-sm">Selected</p>
            <p className="text-white font-semibold">{selected.name} ({selected.iata})</p>
          </div>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden ring-1 ring-blue-500/20">
        <MapContainer center={center} zoom={selected ? 4 : 2} scrollWheelZoom className="h-[520px] w-full" bounds={!selected ? bounds : undefined} worldCopyJump>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Airports */}
          {visibleAirports.map(a => (
            <CircleMarker key={a.iata} center={[a.lat, a.lng]} pathOptions={{ color: selected && a.iata === selected.iata ? '#60a5fa' : '#f8fafc' }} radius={selected && a.iata === selected.iata ? 7 : 5} eventHandlers={{ click: () => onSelect(a.iata) }}>
              <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false}>
                <div className="text-xs">{a.iata} · {a.city}</div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Routes */}
          {selected && connections.map(dest => (
            <Polyline key={`route-${dest.iata}`} positions={[[selected.lat, selected.lng], [dest.lat, dest.lng]]} pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.6 }} />
          ))}

          {/* Clickable destination hotspots */}
          {selected && connections.map(dest => (
            <CircleMarker key={`dest-${dest.iata}`} center={[dest.lat, dest.lng]} radius={10} pathOptions={{ color: 'transparent' }} eventHandlers={{ click: (e) => { e.originalEvent?.stopPropagation?.(); navigate(`/destination/${dest.iata}?from=${selected.iata}`) } }} />
          ))}
        </MapContainer>

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
