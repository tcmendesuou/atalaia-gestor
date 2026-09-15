import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Mapa() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [coletas, setColetas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const markersRef = useRef([])

  // Debug: mostra variáveis de ambiente
  useEffect(() => {
    console.log('VITE_MAPBOX_TOKEN:', import.meta.env.VITE_MAPBOX_TOKEN)
    console.log('Environment vars:', import.meta.env)
  }, [])

  // Carrega coletas
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

    const token = import.meta.env.VITE_MAPBOX_TOKEN

    if (!token) {
      setError('VITE_MAPBOX_TOKEN nao esta configurado no Vercel')
      console.error('Token nao encontrado. Variáveis disponiveis:', Object.keys(import.meta.env))
      return
    }

    // Carrega CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
    document.head.appendChild(link)

    // Carrega JS
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.async = true
    script.onload = () => {
      if (!window.mapboxgl) {
        setError('Mapbox GL JS nao carregou')
        return
      }

      window.mapboxgl.accessToken = token

      if (map.current) return

      try {
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-51.92, -14.2],
          zoom: 3.5
        })

        map.current.on('load', () => {
          console.log('Mapa carregado com sucesso')
          renderMarkers()
        })

        map.current.on('error', (e) => {
          console.error('Erro Mapbox:', e)
          setError(`Erro Mapbox: ${e.error.message || 'desconhecido'}`)
        })
      } catch (err) {
        console.error('Erro ao criar mapa:', err)
        setError(`Erro: ${err.message}`)
      }
    }

    script.onerror = () => {
      setError('Erro ao carregar Mapbox GL JS do CDN')
    }

    document.head.appendChild(script)
  }, [loading])

  // Renderiza marcadores
  useEffect(() => {
    if (!map.current) return
    try {
      if (map.current.getStyle) {
        renderMarkers()
      }
    } catch (err) {
      console.error('Erro ao renderizar:', err)
    }
  }, [coletas])

  const renderMarkers = () => {
    if (!map.current || !window.mapboxgl) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

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

      const marker = new window.mapboxgl.Marker(markerEl)
        .setLngLat([coleta.longitude, coleta.latitude])
        .addTo(map.current)

      markersRef.current.push(marker)
    })
  }

  const totalRecolhidas = coletas.filter(c => c.status === 'recolhido').length
  const totalValidadas = coletas.filter(c => c.status === 'validado').length
  const totalColetas = coletas.length

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-2xl border" style={{ borderColor: '#FFCDD2' }}>
        <div className="text-center gap-4 flex flex-col items-center max-w-md p-6">
          <div className="text-red-600 text-2xl">Erro ao carregar mapa</div>
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg font-mono">
            Configure VITE_MAPBOX_TOKEN no Vercel Environment Variables
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center gap-4 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-full bg-white">
      <div className="flex-1 rounded-2xl border overflow-hidden relative" style={{ borderColor: '#D4E8D1' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

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

      <div className="w-80 rounded-2xl border p-6 flex flex-col gap-4 shrink-0 bg-white" style={{ borderColor: '#D4E8D1' }}>
        <p className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Visao Geral Brasil</p>

        <div className="space-y-3">
          <div className="border rounded-lg p-4" style={{ borderColor: '#D4E8D1' }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total de Coletas</p>
            <p className="text-3xl font-bold" style={{ color: '#2D5A27' }}>{totalColetas}</p>
          </div>

          <div className="border rounded-lg p-4" style={{ borderColor: '#D4E8D1' }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Recolhidas</p>
            <p className="text-2xl font-bold" style={{ color: '#F5A623' }}>{totalRecolhidas}</p>
            <p className="text-xs text-gray-400 mt-1">Aguardando validacao</p>
          </div>

          <div className="border rounded-lg p-4" style={{ borderColor: '#D4E8D1' }}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Validadas</p>
            <p className="text-2xl font-bold" style={{ color: '#2D5A27' }}>{totalValidadas}</p>
            <p className="text-xs text-gray-400 mt-1">Pontos creditados</p>
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: '#D4E8D1' }}>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Taxa de Validacao</p>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div style={{
              width: totalColetas > 0 ? `${(totalValidadas / totalColetas) * 100}%` : '0%',
              height: '100%',
              backgroundColor: '#2D5A27',
              transition: 'all 0.3s'
            }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#1A3A17' }}>
            {totalColetas > 0 ? `${Math.round((totalValidadas / totalColetas) * 100)}%` : '0%'}
          </p>
        </div>
      </div>
    </div>
  )
}
