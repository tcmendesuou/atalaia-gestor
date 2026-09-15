import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function MetasCard() {
  const [cidades, setCidades] = useState([])
  const [coletas, setColetas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'cidades'), snap => {
      setCidades(snap.docs.map(d => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })

    const u2 = onSnapshot(collection(db, 'coletas'), snap => {
      setColetas(snap.docs.map(d => d.data()))
    })

    return () => { u1(); u2() }
  }, [])

  // Calcula progresso por cidade
  const cidadesComProgresso = cidades.map(cidade => {
    const coletasCidade = coletas.filter(c => c.cidade === cidade.nome && c.status === 'recolhido').length
    const percentual = cidade.meta > 0 ? (coletasCidade / cidade.meta) * 100 : 0
    
    return {
      ...cidade,
      coletas: coletasCidade,
      percentual: Math.min(100, Math.round(percentual * 10) / 10),
    }
  })

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: '#D4E8D1' }}>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#1A3A17' }}>Metas por Cidade</h2>

      {cidadesComProgresso.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">Nenhuma meta definida pelas cidades.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cidadesComProgresso.map(cidade => (
            <div key={cidade.id} className="border rounded-lg p-4" style={{ borderColor: '#D4E8D1' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium" style={{ color: '#1A3A17' }}>{cidade.nome}</p>
                  <p className="text-xs text-gray-400">{cidade.estado}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: '#2D5A27' }}>{cidade.percentual}%</p>
                  <p className="text-xs text-gray-400">{cidade.coletas.toLocaleString('pt-BR')} / {cidade.meta.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{ 
                    width: `${cidade.percentual}%`,
                    backgroundColor: cidade.percentual >= 100 ? '#2D5A27' : '#F5A623'
                  }}
                />
              </div>

              {/* Status */}
              <div className="mt-3">
                {cidade.meta === 0 ? (
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#FFF8ED', color: '#F5A623' }}>
                    Meta nao definida
                  </span>
                ) : cidade.percentual >= 100 ? (
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
                    Meta atingida
                  </span>
                ) : cidade.percentual >= 50 ? (
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
                    Na meta
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#FFF8ED', color: '#F5A623' }}>
                    Comecando
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumo total */}
      {cidadesComProgresso.length > 0 && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: '#D4E8D1' }}>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#1A3A17' }}>
                {cidadesComProgresso.length}
              </p>
              <p className="text-xs text-gray-400">Cidades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#1A3A17' }}>
                {cidadesComProgresso.filter(c => c.meta > 0).length}
              </p>
              <p className="text-xs text-gray-400">Com meta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#2D5A27' }}>
                {cidadesComProgresso.filter(c => c.percentual >= 100).length}
              </p>
              <p className="text-xs text-gray-400">Meta atingida</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
