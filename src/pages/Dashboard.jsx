import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

function MetricCard({ label, value, sub, color = '#2D5A27', bg = '#F0FAF0', onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      style={{ borderColor: '#D4E8D1' }}
      onClick={onClick}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#2D5A27' }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [admins, setAdmins] = useState([])
  const [desbravadores, setDesbravadores] = useState([])
  const [coletas, setColetas] = useState([])
  const [quadrantes, setQuadrantes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'admins'), s => { setAdmins(s.docs.map(d => ({ ...d.data(), id: d.id }))); setLoading(false) }),
      onSnapshot(collection(db, 'desbravadores'), s => setDesbravadores(s.docs.map(d => ({ ...d.data(), id: d.id })))),
      onSnapshot(collection(db, 'coletas'), s => setColetas(s.docs.map(d => ({ ...d.data(), id: d.id })))),
      onSnapshot(collection(db, 'quadrantes'), s => setQuadrantes(s.docs.map(d => d.data()))),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5A27' }} />
    </div>
  )

  const adminsAtivos = admins.filter(a => a.status === 'ativo').length
  const desbravadoresAtivos = desbravadores.filter(d => d.status === 'ativo').length
  const coletasValidadas = coletas.filter(c => c.status === 'validado').length
  const coletasPendentes = coletas.filter(c => c.status === 'pendente')
  const totalPontos = desbravadores.reduce((acc, d) => acc + (d.pontos || 0), 0)
  const porcentagem = ((quadrantes.length / 2180) * 100).toFixed(1)

  const ranking = [...admins]
    .filter(a => a.status === 'ativo')
    .map(a => ({
      ...a,
      totalDesbravadores: desbravadores.filter(d => d.adminId === a.id).length,
      totalColetas: coletas.filter(c => {
        const des = desbravadores.find(d => d.id === c.desbravadorId)
        return des?.adminId === a.id && c.status === 'validado'
      }).length,
    }))
    .sort((a, b) => b.totalColetas - a.totalColetas)

  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">

      {/* Metricas principais */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Admins ativos"
          value={adminsAtivos}
          sub={`${admins.length} total`}
          onClick={() => navigate('/admins')}
        />
        <MetricCard
          label="Desbravadores ativos"
          value={desbravadoresAtivos}
          sub={`${desbravadores.length} total`}
          color="#F5A623"
          onClick={() => navigate('/desbravadores')}
        />
        <MetricCard
          label="Coletas validadas"
          value={coletasValidadas}
          sub={`${coletasPendentes.length} pendentes`}
          onClick={() => navigate('/coletas')}
        />
        <MetricCard
          label="Piracicaba libertada"
          value={`${porcentagem}%`}
          sub={`${quadrantes.length} casas visitadas`}
          color="#2D5A27"
        />
      </div>

      <div className="grid grid-cols-5 gap-4 flex-1">

        {/* Coletas pendentes */}
        <div className="col-span-3 bg-white rounded-2xl border flex flex-col overflow-hidden" style={{ borderColor: '#D4E8D1' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#D4E8D1' }}>
            <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Coletas aguardando validacao</span>
            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#FFF8ED', color: '#F5A623' }}>
              {coletasPendentes.length} pendentes
            </span>
          </div>
          <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
            {['Desbravador', 'Item', 'Data', 'Admin'].map(h => <span key={h}>{h}</span>)}
          </div>
          <div className="flex-1 overflow-auto">
            {coletasPendentes.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <p className="text-sm text-gray-400">Nenhuma coleta pendente</p>
              </div>
            ) : (
              coletasPendentes.map(c => {
                const des = desbravadores.find(d => d.id === c.desbravadorId)
                const adm = admins.find(a => a.id === des?.adminId)
                return (
                  <div key={c.id} className="grid grid-cols-4 px-4 py-3 border-b items-center last:border-0" style={{ borderColor: '#D4E8D1' }}>
                    <span className="text-sm" style={{ color: '#1A3A17' }}>{c.desbravadorNome}</span>
                    <span className="text-sm text-gray-600">{c.item}</span>
                    <span className="text-xs text-gray-400">{c.data}</span>
                    <span className="text-xs font-semibold" style={{ color: '#2D5A27' }}>{adm?.regiao || '—'}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Ranking de admins */}
        <div className="col-span-2 bg-white rounded-2xl border flex flex-col overflow-hidden" style={{ borderColor: '#D4E8D1' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#D4E8D1' }}>
            <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Ranking de admins</span>
          </div>
          {ranking.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-sm text-gray-400">Nenhum admin ainda</p>
            </div>
          ) : (
            ranking.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: '#D4E8D1' }}>
                <span className="text-sm font-bold w-5" style={{ color: i === 0 ? '#F5A623' : '#aaa' }}>{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{a.nome}</p>
                  <p className="text-xs text-gray-400">{a.regiao} — {a.totalDesbravadores} desbravadores</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
                  {a.totalColetas} coletas
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}