import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const nivelConfig = {
  'Recrutado':  { bg: '#f0f0f0',  cor: '#888' },
  'Soldado':    { bg: '#E3F2FD',  cor: '#1565C0' },
  'Sentinela':  { bg: '#E8F5E9',  cor: '#2D5A27' },
  'Guardiao':   { bg: '#D4E8D1',  cor: '#1A3A17' },
  'Guerreiro':  { bg: '#1A3A17',  cor: '#fff' },
  'Libertador': { bg: '#FFF8ED',  cor: '#F5A623' },
}

const statusConfig = {
  ativo:     { bg: '#D4E8D1', cor: '#2D5A27' },
  inativo:   { bg: '#f0f0f0', cor: '#888' },
  bloqueado: { bg: '#FFEBEE', cor: '#C62828' },
}

export default function Desbravadores() {
  const [desbravadores, setDesbravadores] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState(null)
  const [filtroAdmin, setFiltroAdmin] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'desbravadores'), snap => {
      setDesbravadores(snap.docs.map(d => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })
    const unsub2 = onSnapshot(collection(db, 'admins'), snap => {
      setAdmins(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const detalhe = desbravadores.find(d => d.id === selecionado)

  const filtrados = desbravadores.filter(d => {
    const matchAdmin = filtroAdmin === 'todos' || d.adminId === filtroAdmin
    const matchStatus = filtroStatus === 'todos' || d.status === filtroStatus
    const matchBusca = !busca || d.nome.toLowerCase().includes(busca.toLowerCase())
    return matchAdmin && matchStatus && matchBusca
  })

  async function toggleStatus(id, status) {
    const novoStatus = status === 'ativo' ? 'bloqueado' : 'ativo'
    await updateDoc(doc(db, 'desbravadores', id), { status: novoStatus })
  }

  function iniciaisNome(nome) {
    return nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5A27' }} />
    </div>
  )

  return (
    <div className="flex gap-4 h-full">

      {/* Lista */}
      <div className="flex-1 bg-white rounded-2xl border flex flex-col overflow-hidden" style={{ borderColor: '#D4E8D1' }}>

        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: '#D4E8D1' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Todos os desbravadores</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
              {desbravadores.filter(d => d.status === 'ativo').length} ativos
            </span>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-sm focus:outline-none w-48"
            style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}
          />
        </div>

        {/* Filtros */}
        <div className="px-4 py-2 border-b flex gap-2 flex-wrap" style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}>
          <select
            value={filtroAdmin}
            onChange={e => setFiltroAdmin(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1 focus:outline-none"
            style={{ borderColor: '#D4E8D1', color: '#2D5A27' }}
          >
            <option value="todos">Todos os admins</option>
            {admins.map(a => <option key={a.id} value={a.id}>{a.nome} — {a.regiao}</option>)}
          </select>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1 focus:outline-none"
            style={{ borderColor: '#D4E8D1', color: '#2D5A27' }}
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>

        {/* Tabela header */}
        <div className="grid grid-cols-6 px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
          {['Desbravador', 'Admin', 'Nivel', 'Pontos', 'Status', 'Acoes'].map(h => <span key={h}>{h}</span>)}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-auto">
          {filtrados.map(d => {
            const adm = admins.find(a => a.id === d.adminId)
            const nivel = nivelConfig[d.nivel] || nivelConfig['Recrutado']
            const status = statusConfig[d.status] || statusConfig['inativo']
            return (
              <div
                key={d.id}
                onClick={() => setSelecionado(d.id)}
                className={`grid grid-cols-6 px-4 py-3 border-b items-center cursor-pointer transition-colors last:border-0 ${selecionado === d.id ? '' : 'hover:bg-green-50'}`}
                style={{ borderColor: '#D4E8D1', backgroundColor: selecionado === d.id ? '#F0FAF0' : '' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#2D5A27' }}>
                    {iniciaisNome(d.nome)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold truncate max-w-28" style={{ color: '#1A3A17' }}>{d.nome}</p>
                    <p className="text-xs text-gray-400 truncate max-w-28">{d.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{adm?.regiao || '—'}</span>
                <span className="text-xs px-2 py-1 rounded-full w-fit font-semibold" style={{ backgroundColor: nivel.bg, color: nivel.cor }}>
                  {d.nivel || 'Recrutado'}
                </span>
                <span className="text-sm font-bold" style={{ color: '#2D5A27' }}>{(d.pontos || 0).toLocaleString()}</span>
                <span className="text-xs px-2 py-1 rounded-full w-fit font-semibold" style={{ backgroundColor: status.bg, color: status.cor }}>
                  {d.status || 'ativo'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); toggleStatus(d.id, d.status) }}
                  className="text-xs hover:underline"
                  style={{ color: d.status === 'ativo' ? '#C62828' : '#2D5A27' }}
                >
                  {d.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                </button>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-gray-400">Nenhum desbravador encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel detalhe */}
      <div className="w-72 shrink-0">
        {detalhe ? (
          <div className="bg-white rounded-2xl border flex flex-col overflow-hidden h-full" style={{ borderColor: '#D4E8D1' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#D4E8D1' }}>
              <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Perfil</span>
              <button onClick={() => setSelecionado(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="flex flex-col items-center gap-2 py-5 border-b" style={{ borderColor: '#D4E8D1' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#2D5A27' }}>
                {iniciaisNome(detalhe.nome)}
              </div>
              <p className="text-sm font-bold" style={{ color: '#1A3A17' }}>{detalhe.nome}</p>
              <p className="text-xs text-gray-400">{detalhe.email}</p>
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: nivelConfig[detalhe.nivel]?.bg || '#f0f0f0', color: nivelConfig[detalhe.nivel]?.cor || '#888' }}>
                {detalhe.nivel || 'Recrutado'}
              </span>
            </div>

            <div className="grid grid-cols-3 border-b" style={{ borderColor: '#D4E8D1' }}>
              {[
                { label: 'Pontos', val: (detalhe.pontos || 0).toLocaleString(), cor: '#2D5A27' },
                { label: 'Visitas', val: detalhe.visitas || 0, cor: '#1A3A17' },
                { label: 'Coletas', val: detalhe.coletas || 0, cor: '#F5A623' },
              ].map(m => (
                <div key={m.label} className="flex flex-col items-center py-3 border-r last:border-0" style={{ borderColor: '#D4E8D1' }}>
                  <span className="text-base font-bold" style={{ color: m.cor }}>{m.val}</span>
                  <span className="text-xs text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 flex flex-col gap-2">
              {[
                ['Admin', admins.find(a => a.id === detalhe.adminId)?.nome || '—'],
                ['Regiao', admins.find(a => a.id === detalhe.adminId)?.regiao || '—'],
                ['Status', detalhe.status || 'ativo'],
                ['Membro desde', detalhe.criadoEm ? new Date(detalhe.criadoEm).toLocaleDateString('pt-BR') : '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b pb-2" style={{ borderColor: '#D4E8D1' }}>
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold" style={{ color: '#1A3A17' }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4 mt-auto">
              <button
                onClick={() => toggleStatus(detalhe.id, detalhe.status)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: detalhe.status === 'ativo' ? '#FFEBEE' : '#D4E8D1',
                  color: detalhe.status === 'ativo' ? '#C62828' : '#2D5A27'
                }}
              >
                {detalhe.status === 'ativo' ? 'Bloquear conta' : 'Ativar conta'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border h-full flex flex-col items-center justify-center gap-2" style={{ borderColor: '#D4E8D1' }}>
            <i className="ti ti-users text-4xl text-gray-200" />
            <p className="text-sm text-gray-400">Selecione um desbravador</p>
          </div>
        )}
      </div>
    </div>
  )
}