import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function Destination() {
  const { iata } = useParams()
  const location = useLocation()
  const [summary, setSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [form, setForm] = useState({ name: '', rating: 5, comment: '' })
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const from = params.get('from') || ''

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/destination/${iata}`)
        const data = await res.json()
        setSummary(data)

        const r = await fetch(`${API_BASE}/reviews/${iata}`)
        setReviews(await r.json())
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [iata])

  const submitReview = async (e) => {
    e.preventDefault()
    setPosting(true)
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airport_iata: iata, ...form, rating: Number(form.rating) })
      })
      if (res.ok) {
        setForm({ name: '', rating: 5, comment: '' })
        const r = await fetch(`${API_BASE}/reviews/${iata}`)
        setReviews(await r.json())
      }
    } finally {
      setPosting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-blue-200">Loading…</div>
  )

  if (!summary) return (
    <div className="min-h-screen flex items-center justify-center text-red-300">Not found</div>
  )

  const { airport, links } = summary

  // Preserve selected origin when opening external flight search if provided
  const flightUrl = useMemo(() => {
    if (!from) return links.flights
    try {
      const u = new URL(links.flights)
      // Google Flights format often uses hl/en and params; safest is to set a generic URL with origin and destination
      // Fallback: construct parameters ?q=flights from-to
      return `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(from)}%20to%20${encodeURIComponent(airport.iata)}`
    } catch {
      return links.flights
    }
  }, [links.flights, from, airport.iata])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link to="/" className="text-blue-300 hover:text-blue-200">← Back</Link>

        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-6 ring-1 ring-blue-500/20">
            <h1 className="text-3xl font-bold mb-1">{airport.city} ({airport.iata})</h1>
            <p className="text-blue-200/80 mb-4">{airport.name}, {airport.country}</p>
            <div className="flex flex-wrap gap-3">
              <a className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500" href={flightUrl} target="_blank" rel="noreferrer">Search flights</a>
              <a className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500" href={links.hotels} target="_blank" rel="noreferrer">Find accommodation</a>
              <a className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600" href={links.wikipedia} target="_blank" rel="noreferrer">Wikipedia</a>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-3">Reviews</h2>
              {reviews.length === 0 && (
                <p className="text-blue-200/70">No reviews yet. Be the first to share your tips!</p>
              )}
              <ul className="space-y-3">
                {reviews.map(r => (
                  <li key={r._id} className="bg-slate-900/40 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                    </div>
                    {r.comment && <p className="text-blue-200/80 mt-1">{r.comment}</p>}
                    {r.created_at && <p className="text-xs text-blue-300/60 mt-1">{new Date(r.created_at).toLocaleString()}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-blue-500/20">
            <h3 className="font-semibold mb-3">Add your review</h3>
            <form onSubmit={submitReview} className="space-y-3">
              <div>
                <label className="text-sm text-blue-200/90">Name</label>
                <input className="w-full mt-1 px-3 py-2 rounded bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div>
                <label className="text-sm text-blue-200/90">Rating</label>
                <select className="w-full mt-1 px-3 py-2 rounded bg-slate-900 border border-slate-700" value={form.rating} onChange={e => setForm(f => ({...f, rating: e.target.value}))}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-blue-200/90">Comment</label>
                <textarea rows={4} className="w-full mt-1 px-3 py-2 rounded bg-slate-900 border border-slate-700" value={form.comment} onChange={e => setForm(f => ({...f, comment: e.target.value}))} placeholder="Share tips about the airport, transportation, must-see places..." />
              </div>
              <button disabled={posting} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60">{posting ? 'Posting…' : 'Publish review'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
