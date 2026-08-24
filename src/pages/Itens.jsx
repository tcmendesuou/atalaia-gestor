import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const niveisDefault = [
  { id: 'recrutado',  nome: 'Recrutado',  min: 0,    max: 199,  cor: '#B0BEC5' },
  { id: 'soldado',    nome: 'Soldado',    min: 200,  max: 599,  cor: '#81C784' },
  { id: 'sentinela',  nome: 'Sentinela',  min: 600,  max: 1499, cor: '#4CAF50' },
  { id: 'guardiao',   nome: 'Guardiao',   min: 1500, max: 2999, cor: '#2D5A27' },
  { id: 'guerreiro',  nome: 'Guerreiro',  min: 3000, max: 5999, cor: '#1A3A17' },
  { id: 'libertador', nome: 'Libertador', min: 6000, max: null, cor: '#F5A623' },
]

export default function Itens() {
  const [itens, setItens] = useState([])
  const [niveis, setNiveis] = useState(niveisDefault)
  const [editandoItem, setEditandoItem] = useState(null)
  const [editandoNivel, setEditandoNivel] = useState(null)
  const [nivelForm, setNivelForm] = useState({})
  const [novo, setNovo] = useState({ nome: '', pontos: '' })
  const [adicionando, setAdicionando] = useState(false)
  const [adicionandoNivel, setAdicionandoNivel] = useState(false)
  const [novoNivel, setNovoNivel] = useState({ nome: '', min: '', max: '', cor: '#2D5A27' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'itens'), snap => {
      setItens(snap.docs.map(d => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })
    const u2 = onSnapshot(collection(db, 'niveis'), snap => {
      if (!snap.empty) setNiveis(snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => a.min - b.min))
    })
    return () => { u1(); u2() }
  }, [])

  async function toggleAtivo(item) {
    await updateDoc(doc(db, 'itens', item.id), { ativo: !item.ativo })
  }

  async function removerItem(id) {
    if (!confirm('Remover este item?')) return
    await deleteDoc(doc(db, 'itens', id))
  }

  async function salvarItem(id, campo, valor) {
    await updateDoc(doc(db, 'itens', id), { [campo]: valor })
  }

  async function adicionarItem() {
    if (!novo.nome || !novo.pontos) return
    const id = novo.nome.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    await setDoc(doc(db, 'itens', id), { id, nome: novo.nome, pontos: parseInt(novo.pontos), ativo: true })
    setNovo({ nome: '', pontos: '' })
    setAdicionando(false)
  }

  async function salvarNivel() {
    if (!nivelForm.nome) return
    await setDoc(doc(db, 'niveis', nivelForm.id), {
      ...nivelForm,
      min: parseInt(nivelForm.min) || 0,
      max: nivelForm.max ? parseInt(nivelForm.max) : null,
    })
    setEditandoNivel(null)
    setNivelForm({})
  }

  async function removerNivel(id) {
    if (!confirm('Remover este nivel?')) return
    await deleteDoc(doc(db, 'niveis', id))
  }

  async function adicionarNivel() {
    if (!novoNivel.nome || novoNivel.min === '') return
    const id = novoNivel.nome.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    await setDoc(doc(db, 'niveis', id), {
      id, nome: novoNivel.nome,
      min: parseInt(novoNivel.min),
      max: novoNivel.max ? parseInt(novoNivel.max) : null,
      cor: novoNivel.cor || '#2D5A27',
    })
    setNovoNivel({ nome: '', min: '', max: '', cor: '#2D5A27' })
    setAdicionandoNivel(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5A27' }} />
    </div>
  )

  const inputClass = "text-sm border rounded-lg px-2 py-1 focus:outline-none"
  const inputStyle = { borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">

      {/* ITENS — 65% */}
      <div className="bg-white rounded-2xl border flex flex-col overflow-hidden" style={{ flex: '0 0 62%', borderColor: '#D4E8D1' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#D4E8D1' }}>
          <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Tabela de itens e pontos</span>
          <button
            onClick={() => setAdicionando(true)}
            className="text-xs px-4 py-2 rounded-xl text-white font-semibold"
            style={{ backgroundColor: '#F5A623' }}
          >
            + Novo item
          </button>
        </div>

        <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold uppercase tracking-wide shrink-0" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
          {['Item', 'Pontos', 'Status', 'Acoes'].map(h => <span key={h}>{h}</span>)}
        </div>

        <div className="overflow-y-auto flex-1">
          {itens.map(item => (
            <div key={item.id} className="grid grid-cols-4 px-4 py-3 border-b items-center last:border-0" style={{ borderColor: '#D4E8D1' }}>
              {editandoItem === item.id ? (
                <input className={inputClass} style={inputStyle} defaultValue={item.nome}
                  onBlur={e => { salvarItem(item.id, 'nome', e.target.value); setEditandoItem(null) }} autoFocus />
              ) : (
                <span className={`text-sm ${item.ativo ? '' : 'line-through text-gray-400'}`} style={{ color: item.ativo ? '#1A3A17' : '' }}>{item.nome}</span>
              )}

              {editandoItem === item.id ? (
                <input className={inputClass} style={{ ...inputStyle, width: 80 }} type="number" defaultValue={item.pontos}
                  onBlur={e => salvarItem(item.id, 'pontos', parseInt(e.target.value))} />
              ) : (
                <span className="text-sm font-bold" style={{ color: item.ativo ? '#F5A623' : '#aaa' }}>{item.pontos} pts</span>
              )}

              <button onClick={() => toggleAtivo(item)} className="text-xs px-2 py-1 rounded-full w-fit font-semibold"
                style={{ backgroundColor: item.ativo ? '#D4E8D1' : '#f0f0f0', color: item.ativo ? '#2D5A27' : '#888' }}>
                {item.ativo ? 'Ativo' : 'Inativo'}
              </button>

              <div className="flex gap-2">
                <button onClick={() => setEditandoItem(editandoItem === item.id ? null : item.id)}
                  className="text-xs hover:underline" style={{ color: '#2D5A27' }}>
                  {editandoItem === item.id ? 'Salvar' : 'Editar'}
                </button>
                <button onClick={() => removerItem(item.id)} className="text-xs text-red-400 hover:underline">Remover</button>
              </div>
            </div>
          ))}

          {adicionando && (
            <div className="grid grid-cols-4 px-4 py-3 border-b items-center" style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}>
              <input className={inputClass} style={inputStyle} placeholder="Nome do item" value={novo.nome}
                onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))} autoFocus />
              <input className={inputClass} style={{ ...inputStyle, width: 80 }} type="number" placeholder="Pontos" value={novo.pontos}
                onChange={e => setNovo(p => ({ ...p, pontos: e.target.value }))} />
              <span className="text-xs text-gray-400">Ativo apos salvar</span>
              <div className="flex gap-2">
                <button onClick={adicionarItem} className="text-xs px-3 py-1 rounded-lg text-white" style={{ backgroundColor: '#2D5A27' }}>Salvar</button>
                <button onClick={() => setAdicionando(false)} className="text-xs text-gray-400">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NIVEIS — 35% */}
      <div className="bg-white rounded-2xl border flex flex-col flex-1 overflow-hidden" style={{ borderColor: '#D4E8D1' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#D4E8D1' }}>
          <div>
            <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Jornada do heroi — faixas de pontos</span>
            <p className="text-xs text-gray-400 mt-0.5">Define os pontos necessarios para cada nivel</p>
          </div>
          <button onClick={() => setAdicionandoNivel(true)} className="text-xs px-4 py-2 rounded-xl text-white font-semibold" style={{ backgroundColor: '#F5A623' }}>
            + Novo nivel
          </button>
        </div>

        <div className="grid grid-cols-5 px-4 py-2 text-xs font-semibold uppercase tracking-wide shrink-0" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
          {['Nivel', 'Pts minimos', 'Pts maximos', 'Cor', 'Acoes'].map(h => <span key={h}>{h}</span>)}
        </div>

        <div className="overflow-y-auto flex-1">
          {niveis.map(n => (
            <div key={n.id} className="grid grid-cols-5 px-4 py-2.5 border-b items-center last:border-0" style={{ borderColor: '#D4E8D1' }}>
              {editandoNivel === n.id ? (
                <input className={inputClass} style={{ ...inputStyle, width: 110 }} value={nivelForm.nome}
                  onChange={e => setNivelForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: n.cor || '#888' }} />
                  <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{n.nome}</span>
                </div>
              )}

              {editandoNivel === n.id ? (
                <input className={inputClass} style={{ ...inputStyle, width: 80 }} type="number" value={nivelForm.min}
                  onChange={e => setNivelForm(f => ({ ...f, min: e.target.value }))} />
              ) : (
                <span className="text-sm text-gray-600">{n.min} pts</span>
              )}

              {editandoNivel === n.id ? (
                <input className={inputClass} style={{ ...inputStyle, width: 80 }} type="number" value={nivelForm.max || ''} placeholder="Sem limite"
                  onChange={e => setNivelForm(f => ({ ...f, max: e.target.value }))} />
              ) : (
                <span className="text-sm text-gray-600">{n.max ? `${n.max} pts` : 'Sem limite'}</span>
              )}

              {editandoNivel === n.id ? (
                <input type="color" value={nivelForm.cor || '#2D5A27'}
                  onChange={e => setNivelForm(f => ({ ...f, cor: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border" style={{ borderColor: '#D4E8D1' }} />
              ) : (
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: n.cor || '#888', borderColor: '#D4E8D1' }} />
              )}

              <div className="flex gap-2">
                {editandoNivel === n.id ? (
                  <>
                    <button onClick={salvarNivel} className="text-xs px-2 py-1 rounded-lg text-white" style={{ backgroundColor: '#2D5A27' }}>Salvar</button>
                    <button onClick={() => setEditandoNivel(null)} className="text-xs text-gray-400">Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditandoNivel(n.id); setNivelForm({ ...n }) }}
                      className="text-xs hover:underline" style={{ color: '#2D5A27' }}>Editar</button>
                    <button onClick={() => removerNivel(n.id)} className="text-xs text-red-400 hover:underline">Remover</button>
                  </>
                )}
              </div>
            </div>
          ))}

          {adicionandoNivel && (
            <div className="grid grid-cols-5 px-4 py-2.5 border-b items-center" style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}>
              <input className={inputClass} style={{ ...inputStyle, width: 110 }} placeholder="Nome" value={novoNivel.nome}
                onChange={e => setNovoNivel(p => ({ ...p, nome: e.target.value }))} autoFocus />
              <input className={inputClass} style={{ ...inputStyle, width: 80 }} type="number" placeholder="Min" value={novoNivel.min}
                onChange={e => setNovoNivel(p => ({ ...p, min: e.target.value }))} />
              <input className={inputClass} style={{ ...inputStyle, width: 80 }} type="number" placeholder="Max" value={novoNivel.max}
                onChange={e => setNovoNivel(p => ({ ...p, max: e.target.value }))} />
              <input type="color" value={novoNivel.cor} onChange={e => setNovoNivel(p => ({ ...p, cor: e.target.value }))}
                className="w-8 h-8 rounded cursor-pointer border" style={{ borderColor: '#D4E8D1' }} />
              <div className="flex gap-2">
                <button onClick={adicionarNivel} className="text-xs px-2 py-1 rounded-lg text-white" style={{ backgroundColor: '#2D5A27' }}>Salvar</button>
                <button onClick={() => setAdicionandoNivel(false)} className="text-xs text-gray-400">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}