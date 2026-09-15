import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Mapa() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [coletas, setColetas] = useState([])
  const [loading, setLoading] = useState(true)
  const markersRef = useRef([])

  // Carrega coletas em tempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coletas'), snap => {
      const coletasData = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      const coletasFiltradas = coletasData.filter(c => c.status === 'recolhido' || c.status === 'validado')
      setColetas(coletasFiltradas)
      setLoading(false)
    })
    return unsub
  }, [])

  // Inicializa Mapbox
  useEffect(() => {
    if (loading || !mapContainer.current) return

    // Carrega Mapbox GL dinamicamente
    const loadMapbox = async () => {
      try {
        // Carrega CSS
        const link = document.createElement('link')
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
        document.head.appendChild(link)

        // Carrega JS
        const script = document.createElement('script')
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
        script.async = true
        script.onload = () => {
          const mapboxgl = window.mapboxgl
          if (!mapboxgl) return

          mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

          if (map.current) return

          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-51.92, -14.2],
            zoom: 3.5
          })

          map.current.on('load', () => {
            renderMarkers(mapboxgl)
          })
        }
        document.head.appendChild(script)
      } catch (error) {
        console.error('Erro ao carregar Mapbox:', error)
      }
    }

    loadMapbox()
  }, [loading])

  // Renderiza marcadores quando coletas mudam
  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return

    renderMarkers()
  }, [coletas])

  const renderMarkers = (mapboxgl = null) => {
    const mb = mapboxgl || window.mapboxgl
    if (!mb || !map.current) return

    // Remove marcadores antigos
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Adiciona novos marcadores
    coletas.forEach(coleta => {
      if (!coleta.latitude || !coleta.longitude) return

      const opacidade = coleta.status === 'validado' ? 1 : 0.5

      const markerEl = document.createElement('div')
      markerEl.style.width = '20px'
      markerEl.style.height = '20px'
      markerEl.style.borderRadius = '50%'
      markerEl.style.backgroundColor = '#2D5A27'
      markerEl.style.border = '3px solid #fff'
      markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      markerEl.style.opacity = opacidade
      markerEl.style.cursor = 'pointer'

      const marker = new mb.Marker(markerEl)
        .setLngLat([coleta.longitude, coleta.latitude])
        .addTo(map.current)

      markersRef.current.push(marker)
    })
  }

  const totalRecolhidas = coletas.filter(c => c.status === 'recolhido').length
  const totalValidadas = coletas.filter(c => c.status === 'validado').length
  const totalColetas = coletas.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center gap-4 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-full bg-white">
      {/* Mapa */}
      <div className="flex-1 rounded-2xl border overflow-hidden relative" style={{ borderColor: '#D4E8D1' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

        {/* Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '12px',
          borderWidth: '1.5px',
          borderColor: '#D4E8D1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10
        }}>
          <p style={{ fontSize: '9px', color: '#2D5A27', letterSpacing: '0.5px', fontWeight: '700', marginBottom: '4px' }}>
            COLETAS BRASIL
          </p>
          <p style={{ fontSize: '24px', color: '#2D5A27', fontWeight: 'bold', marginBottom: '6px' }}>
            {totalColetas}
          </p>
          <div style={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#2D5A27',
                opacity: 0.5
              }} />
              <p style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>
                {totalRecolhidas} recolhidas
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#2D5A27',
                opacity: 1
              }} />
              <p style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>
                {totalValidadas} validadas
              </p>
            </div>
          </div>
        </div>

        {/* Legenda */}
        {totalColetas > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '12px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '10px',
            gap: '6px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '5px',
                backgroundColor: '#2D5A27',
                opacity: 0.5
              }} />
              <p style={{ fontSize: '11px', color: '#2D5A27', fontWeight: '600' }}>
                Recolhida (pendente)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '5px',
                backgroundColor: '#2D5A27',
                opacity: 1
              }} />
              <p style={{ fontSize: '11px', color: '#2D5A27', fontWeight: '600' }}>
                Validada
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Painel */}
      <div className="w-80 rounded-2xl border p-6 flex flex-col gap-4 shrink-0 bg-white" style={{ borderColor: '#D4E8D1' }}>
        <div>
          <p className="text-sm font-semibold mb-4" style={{ color: '#1A3A17' }}>
            Visao Geral Brasil
          </p>
        </div>

        <div className="space-y-3">
          <div className="border rounded-lg p-4" style={{ borderColor: '#D4E8D1' }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total de Coletas</p>
            <p className="text-3xl font-bold" style={{ color: '#2D5A27' }}>
              {totalColetas}
            </p>
          </div>

          <div className="border rounded-lg p-4" style={{ borderColor: '#D4E8D1' }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Recolhidas</p>
            <p className="text-2xl font-bold" style={{ color: '#F5A623' }}>
              {totalRecolhidas}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Aguardando validacao
            </p>
          </div>

          <div className="border rounded-lg p-4" style={{ borderColor: '#D4E8D1' }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Validadas</p>
            <p className="text-2xl font-bold" style={{ color: '#2D5A27' }}>
              {totalValidadas}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Pontos creditados
            </p>
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: '#D4E8D1' }}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Taxa de Validacao</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full transition-all"
              style={{
                width: totalColetas > 0 ? `${(totalValidadas / totalColetas) * 100}%` : '0%',
                backgroundColor: '#2D5A27'
              }}
            />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#1A3A17' }}>
            {totalColetas > 0 ? `${Math.round((totalValidadas / totalColetas) * 100)}%` : '0%'}
          </p>
        </div>

        <div className="text-xs text-gray-500 leading-relaxed">
          <p>
            O mapa mostra todas as coletas realizadas em todo o Brasil. Os marcadores com opacidade reducida estao aguardando validacao pelos admins.
          </p>
        </div>
      </div>
    </div>
  )
}
