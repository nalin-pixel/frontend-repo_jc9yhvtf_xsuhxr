import AirportMap from './components/AirportMap'
import { Routes, Route } from 'react-router-dom'
import Destination from './components/Destination'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>

      <div className="relative min-h-screen p-6">
        <header className="max-w-6xl mx-auto flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-white">SkyLines</h1>
          <a href="/test" className="text-blue-300 hover:text-blue-200 text-sm">System check</a>
        </header>

        <main className="max-w-6xl mx-auto mt-4">
          <AirportMap />
        </main>
      </div>
    </div>
  )
}

export default App
