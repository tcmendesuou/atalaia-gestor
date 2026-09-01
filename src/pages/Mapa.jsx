import { useEffect, useRef, useState } from 'react'

export default function Mapa() {
  const mapRef = useRef(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!mapRef.current) return

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

    // Debug: log do token
    console.log('Token Mapbox:', MAPBOX_TOKEN ? '✅ Carregado' : '❌ NÃO CARREGADO')

    if (!MAPBOX_TOKEN) {
      setErro('Token Mapbox não configurado. Verifique variáveis de ambiente.')
      setCarregando(false)
      return
    }

    // 1️⃣ Carregar CSS PRIMEIRO
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css'
    document.head.appendChild(link)

    // 2️⃣ Carregar script
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'
    
    script.onload = () => {
      try {
        window.mapboxgl.accessToken = MAPBOX_TOKEN

        // Esperar um frame antes de criar o mapa (garante que DOM está pronto)
        setTimeout(() => {
          const map = new window.mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/warm-v10',
            center: [-51.4532, -10.2033], // Centro Brasil
            zoom: 4,
          })

          map.on('load', () => {
            console.log('✅ Mapa carregado com sucesso')
            setCarregando(false)
          })

          map.on('error', (e) => {
            console.error('❌ Erro no mapa:', e.error)
            setErro('Erro ao carregar mapa. Verifique o token Mapbox.')
          })
        }, 100)
      } catch (err) {
        console.error('❌ Erro ao inicializar Mapbox:', err)
        setErro('Erro ao inicializar Mapbox: ' + err.message)
      }
    }

    script.onerror = () => {
      console.error('❌ Falha ao carregar script do Mapbox')
      setErro('Falha ao carregar script do Mapbox')
      setCarregando(false)
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup: remover script se component desmontar
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white rounded-2xl border px-4 py-3 flex items-center gap-2" style={{ borderColor: '#D4E8D1' }}>
        <i className="ti ti-map text-lg" style={{ color: '#2D5A27' }} />
        <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Visao geral — Piracicaba</span>
      </div>

      {carregando && (
        <div className="flex-1 rounded-2xl overflow-hidden border flex items-center justify-center bg-white" style={{ borderColor: '#D4E8D1' }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}

      {erro && (
        <div className="flex-1 rounded-2xl overflow-hidden border flex items-center justify-center bg-red-50" style={{ borderColor: '#D4E8D1' }}>
          <div className="text-center">
            <p className="text-sm text-red-600 font-semibold">⚠️ {erro}</p>
            <p className="text-xs text-gray-600 mt-2">Abra o Console (F12) para mais detalhes</p>
          </div>
        </div>
      )}

      {!carregando && !erro && (
        <div ref={mapRef} className="flex-1 rounded-2xl overflow-hidden border" style={{ borderColor: '#D4E8D1' }} />
      )}
    </div>
  )
}
