import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore'
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
    <div className="bg-white rounded-lg border border-blue-100 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Metas por Cidade</h2>

      {cidadesComProgresso.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">Nenhuma meta definida pelas cidades.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cidadesComProgresso.map(cidade => (
            <div key={cidade.id} className="border border-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{cidade.nome}</p>
                  <p className="text-xs text-gray-400">{cidade.estado}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-blue">{cidade.percentual}%</p>
                  <p className="text-xs text-gray-400">{cidade.coletas.toLocaleString('pt-BR')} / {cidade.meta.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-brand-pale rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-brand-blue transition-all"
                  style={{ width: `${cidade.percentual}%` }}
                />
              </div>

              {/* Status */}
              <div className="mt-3 flex items-center gap-2">
                {cidade.meta === 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-xs font-medium text-yellow-700">
                    ⚠️ Meta não definida
                  </span>
                ) : cidade.percentual >= 100 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-xs font-medium text-green-700">
                    ✓ Meta atingida!
                  </span>
                ) : cidade.percentual >= 50 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-xs font-medium text-brand-blue">
                    → Na meta
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-xs font-medium text-orange-700">
                    ↗ Começando
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumo total */}
      {cidadesComProgresso.length > 0 && (
        <div className="mt-6 pt-6 border-t border-blue-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {cidadesComProgresso.length}
              </p>
              <p className="text-xs text-gray-400">Cidades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {cidadesComProgresso.filter(c => c.meta > 0).length}
              </p>
              <p className="text-xs text-gray-400">Com meta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-green">
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
