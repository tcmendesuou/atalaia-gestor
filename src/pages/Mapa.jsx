import { useEffect, useRef } from 'react'

export default function Mapa() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'
    script.onload = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css'
      document.head.appendChild(link)

      window.mapboxgl.accessToken = MAPBOX_TOKEN
      new window.mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/warm-v10',
        center: [-47.6476, -22.7253],
        zoom: 12,
      })
    }
    document.head.appendChild(script)
  }, [])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white rounded-2xl border px-4 py-3 flex items-center gap-2" style={{ borderColor: '#D4E8D1' }}>
        <i className="ti ti-map text-lg" style={{ color: '#2D5A27' }} />
        <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Visao geral — Piracicaba</span>
      </div>
      <div ref={mapRef} className="flex-1 rounded-2xl overflow-hidden border" style={{ borderColor: '#D4E8D1' }} />
    </div>
  )
}
