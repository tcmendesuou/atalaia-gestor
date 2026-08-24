import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const statusConfig = {
  pendente:  { label: 'Pendente',  bg: '#FFF8ED', cor: '#F5A623' },
  validado:  { label: 'Validado',  bg: '#D4E8D1', cor: '#2D5A27' },
  rejeitado: { label: 'Rejeitado', bg: '#FFEBEE', cor: '#C62828' },
}

export default function Coletas() {
  const [coletas, setColetas] = useState([])
  const [admins, setAdmins] = useState([])
  const [desbravadores, setDesbravadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [filtroAdmin, setFiltroAdmin] = useState('todos')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'coletas'), s => { setColetas(s.docs.map(d => ({ ...d.data(), id: d.id }))); setLoading(false) })
    const u2 = onSnapshot(collection(db, 'admins'), s => setAdmins(s.docs.map(d => ({ ...d.data(), id: d.id }))))
    const u3 = onSnapshot(collection(db, 'desbravadores'), s => setDesbravadores(s.docs.map(d => ({ ...d.data(), id: d.id }))))
    return () => { u1(); u2(); u3() }
  }, [])

  const detalhe = coletas.find(c => c.id === selecionado)

  const filtradas = coletas.filter(c => {
    const matchStatus = filtro === 'todos' || c.status === filtro
    const des = desbravadores.find(d => d.id === c.desbravadorId)
    const matchAdmin = filtroAdmin === 'todos' || des?.adminId === filtroAdmin
    const matchBusca = !busca || c.desbravadorNome?.toLowerCase().includes(busca.toLowerCase()) || c.item?.toLowerCase().includes(busca.toLowerCase())
    return matchStatus && matchAdmin && matchBusca
  })

  async function validar(coleta) {
    await updateDoc(doc(db, 'coletas', coleta.id), { status: 'validado' })
    const desSnap = await getDoc(doc(db, 'desbravadores', coleta.desbravadorId))
    if (desSnap.exists()) {
      await updateDoc(doc(db, 'desbravadores', coleta.desbravadorId), {
        pontos: (desSnap.data().pontos || 0) + (coleta.pontos || 0),
        coletas: (desSnap.data().coletas || 0) + 1,
      })
    }
    setSelecionado(null)
  }

  async function rejeitar(id) {
    await updateDoc(doc(db, 'coletas', id), { status: 'rejeitado' })
    setSelecionado(null)
  }

  function getAdminDaColeta(c) {
    const des = desbravadores.find(d => d.id === c.desbravadorId)
    return admins.find(a => a.id === des?.adminId)
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

        <div className="px-4 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: '#D4E8D1' }}>
          <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Todas as coletas</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="border rounded-xl px-3 py-1.5 text-sm focus:outline-none w-40"
            style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}
          />
        </div>

        <div className="px-4 py-2 border-b flex gap-2 flex-wrap" style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}>
          {['todos', 'pendente', 'validado', 'rejeitado'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="text-xs px-3 py-1 rounded-full font-semibold transition-colors capitalize"
              style={{
                backgroundColor: filtro === f ? '#2D5A27' : '#fff',
                color: filtro === f ? '#fff' : '#2D5A27',
                border: '1px solid #D4E8D1'
              }}
            >
              {f === 'todos' ? 'Todos' : statusConfig[f].label}
            </button>
          ))}
          <select
            value={filtroAdmin}
            onChange={e => setFiltroAdmin(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1 focus:outline-none ml-auto"
            style={{ borderColor: '#D4E8D1', color: '#2D5A27' }}
          >
            <option value="todos">Todos os admins</option>
            {admins.map(a => <option key={a.id} value={a.id}>{a.regiao}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-6 px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
          {['Desbravador', 'Item', 'Regiao', 'Data', 'Pontos', 'Status'].map(h => <span key={h}>{h}</span>)}
        </div>

        <div className="flex-1 overflow-auto">
          {filtradas.map(c => {
            const adm = getAdminDaColeta(c)
            const status = statusConfig[c.status] || statusConfig['pendente']
            return (
              <div
                key={c.id}
                onClick={() => setSelecionado(c.id)}
                className="grid grid-cols-6 px-4 py-3 border-b items-center cursor-pointer transition-colors last:border-0 hover:bg-green-50"
                style={{ borderColor: '#D4E8D1', backgroundColor: selecionado === c.id ? '#F0FAF0' : '' }}
              >
                <span className="text-sm font-semibold truncate" style={{ color: '#1A3A17' }}>{c.desbravadorNome}</span>
                <span className="text-sm text-gray-600 truncate">{c.item}</span>
                <span className="text-xs text-gray-400">{adm?.regiao || '—'}</span>
                <span className="text-xs text-gray-400">{c.data}</span>
                <span className="text-sm font-bold" style={{ color: '#F5A623' }}>+{c.pontos || 0}</span>
                <span className="text-xs px-2 py-1 rounded-full w-fit font-semibold" style={{ backgroundColor: status.bg, color: status.cor }}>
                  {status.label}
                </span>
              </div>
            )
          })}
          {filtradas.length === 0 && (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-gray-400">Nenhuma coleta encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalhe */}
      <div className="w-72 shrink-0">
        {detalhe ? (
          <div className="bg-white rounded-2xl border flex flex-col overflow-hidden h-full" style={{ borderColor: '#D4E8D1' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#D4E8D1' }}>
              <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Detalhes</span>
              <button onClick={() => setSelecionado(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="mx-4 mt-4 rounded-xl overflow-hidden border" style={{ borderColor: '#D4E8D1', height: 140 }}>
              {detalhe.foto ? (
                <img src={detalhe.foto} alt="Fachada" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F0FAF0' }}>
                  <i className="ti ti-home text-3xl text-gray-300" />
                </div>
              )}
            </div>

            <div className="px-4 py-3 flex flex-col gap-2 flex-1 overflow-auto">
              {[
                ['Desbravador', detalhe.desbravadorNome],
                ['Item', detalhe.item],
                ['Descricao', detalhe.descricaoItem || '—'],
                ['Residencia', detalhe.residencia],
                ['Atendimento', detalhe.atendimento ? 'Atendido' : 'Ausente'],
                ['Data', detalhe.data],
                ['Regiao', getAdminDaColeta(detalhe)?.regiao || '—'],
                ['Pontos', `+${detalhe.pontos || 0} pts`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b pb-1.5" style={{ borderColor: '#D4E8D1' }}>
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-right max-w-40" style={{ color: label === 'Pontos' ? '#F5A623' : '#1A3A17' }}>{val}</span>
                </div>
              ))}
              {detalhe.obs && (
                <div>
                  <span className="text-xs text-gray-400">Observacao</span>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#333' }}>{detalhe.obs}</p>
                </div>
              )}
            </div>

            {detalhe.status === 'pendente' && (
              <div className="px-4 pb-4 flex flex-col gap-2">
                <button
                  onClick={() => validar(detalhe)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#2D5A27' }}
                >
                  Aprovar e dar pontos
                </button>
                <button
                  onClick={() => rejeitar(detalhe.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}
                >
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border h-full flex flex-col items-center justify-center gap-2" style={{ borderColor: '#D4E8D1' }}>
            <i className="ti ti-package text-4xl text-gray-200" />
            <p className="text-sm text-gray-400">Selecione uma coleta</p>
          </div>
        )}
      </div>
    </div>
  )
}