import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const VAZIO = { nome: '', descricao: '', fornecedor: '', contato: '', pontos: '', quantidade: '', prazo: '', ativo: true, geral: true }

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#D4E8D1' }}>
          <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{titulo}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

const inputClass = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
const inputStyle = { borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }

export default function Premios() {
  const [premios, setPremios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(VAZIO)
  const [selecionado, setSelecionado] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'premios'), snap => {
      setPremios(snap.docs.map(d => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })
    return unsub
  }, [])

  function abrirNovo() { setForm(VAZIO); setModal('novo') }
  function abrirVer(p) { setSelecionado(p); setModal('ver') }
  function abrirEditar(p) { setForm({ ...p }); setSelecionado(p); setModal('editar') }
  function fechar() { setModal(null); setSelecionado(null); setForm(VAZIO) }

  async function uploadFoto(file) {
    setUploadingFoto(true)
    try {
      const storageRef = ref(storage, `premios/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setForm(f => ({ ...f, foto: url }))
    } catch { alert('Erro ao fazer upload.') }
    finally { setUploadingFoto(false) }
  }

  async function salvar() {
    if (!form.nome || !form.pontos) { alert('Preencha nome e pontos.'); return }
    setSalvando(true)
    try {
      const id = selecionado?.id || form.nome.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
      await setDoc(doc(db, 'premios', id), {
        ...form,
        pontos: parseInt(form.pontos) || 0,
        quantidade: form.quantidade ? parseInt(form.quantidade) : null,
        resgatados: form.resgatados || 0,
        geral: true,
      })
      fechar()
    } catch { alert('Erro ao salvar.') }
    finally { setSalvando(false) }
  }

  async function remover(id) {
    if (!confirm('Remover este premio?')) return
    await deleteDoc(doc(db, 'premios', id))
    fechar()
  }

  async function toggleAtivo(p) {
    await updateDoc(doc(db, 'premios', p.id), { ativo: !p.ativo })
  }

  const filtrados = premios.filter(p => filtro === 'todos' || (filtro === 'ativo' ? p.ativo : !p.ativo))

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5A27' }} />
    </div>
  )

  const FormField = ({ label, field, placeholder, type = 'text', obrigatorio }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>
        {label} {obrigatorio && <span className="text-red-400">*</span>}
      </label>
      <input type={type} className={inputClass} style={inputStyle} placeholder={placeholder}
        value={form[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
    </div>
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-white rounded-2xl border flex flex-col overflow-hidden flex-1" style={{ borderColor: '#D4E8D1' }}>

        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#D4E8D1' }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Premios gerais da rede</span>
            <div className="flex gap-1">
              {['todos', 'ativo', 'inativo'].map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className="text-xs px-3 py-1 rounded-full font-semibold capitalize transition-colors"
                  style={{ backgroundColor: filtro === f ? '#2D5A27' : '#F0FAF0', color: filtro === f ? '#fff' : '#2D5A27' }}>
                  {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={abrirNovo} className="text-xs px-4 py-2 rounded-xl text-white font-semibold" style={{ backgroundColor: '#F5A623' }}>
            + Novo premio
          </button>
        </div>

        <div className="grid grid-cols-6 px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
          {['Premio', 'Fornecedor', 'Pontos', 'Qtd / Prazo', 'Status', 'Acoes'].map(h => <span key={h}>{h}</span>)}
        </div>

        <div className="flex-1 overflow-auto">
          {filtrados.map(p => (
            <div key={p.id} className="grid grid-cols-6 px-4 py-3 border-b items-center last:border-0 hover:bg-green-50 transition-colors" style={{ borderColor: '#D4E8D1' }}>
              <div className="flex items-center gap-3">
                {p.foto ? (
                  <img src={p.foto} alt="" className="w-9 h-9 rounded-xl object-cover border" style={{ borderColor: '#D4E8D1' }} />
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F0FAF0' }}>
                    <i className="ti ti-gift text-sm" style={{ color: '#2D5A27' }} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{p.nome}</p>
                  <p className="text-xs text-gray-400 truncate max-w-32">{p.descricao}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">{p.fornecedor || '—'}</p>
                <p className="text-xs text-gray-400">{p.contato || ''}</p>
              </div>
              <span className="text-sm font-bold" style={{ color: '#F5A623' }}>{p.pontos} pts</span>
              <div>
                {p.quantidade
                  ? <p className="text-sm text-gray-600">{p.quantidade - (p.resgatados || 0)} restantes</p>
                  : p.prazo ? <p className="text-sm text-gray-600">ate {p.prazo}</p>
                  : <p className="text-sm text-gray-400">Ilimitado</p>
                }
                <p className="text-xs text-gray-400">{p.resgatados || 0} resgatados</p>
              </div>
              <button onClick={() => toggleAtivo(p)} className="text-xs px-2 py-1 rounded-full w-fit font-semibold"
                style={{ backgroundColor: p.ativo ? '#D4E8D1' : '#f0f0f0', color: p.ativo ? '#2D5A27' : '#888' }}>
                {p.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <div className="flex gap-2">
                <button onClick={() => abrirVer(p)} className="text-xs text-gray-400 hover:text-gray-600">Ver</button>
                <button onClick={() => abrirEditar(p)} className="text-xs hover:underline" style={{ color: '#2D5A27' }}>Editar</button>
                <button onClick={() => remover(p.id)} className="text-xs text-red-400 hover:underline">Remover</button>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-gray-400">Nenhum premio encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal novo/editar */}
      {(modal === 'novo' || modal === 'editar') && (
        <Modal titulo={modal === 'novo' ? 'Novo premio geral' : 'Editar premio'} onClose={fechar}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>Foto do premio</label>
              <div className="flex items-center gap-3">
                {form.foto ? (
                  <img src={form.foto} alt="" className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: '#D4E8D1' }} />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center border" style={{ backgroundColor: '#F0FAF0', borderColor: '#D4E8D1' }}>
                    <i className="ti ti-photo text-gray-300 text-2xl" />
                  </div>
                )}
                <label className="text-xs px-3 py-2 rounded-xl cursor-pointer font-semibold" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
                  {uploadingFoto ? 'Enviando...' : 'Escolher foto'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadFoto(e.target.files[0])} />
                </label>
              </div>
            </div>
            <FormField label="Nome do premio" field="nome" placeholder="Ex: Cupom Mercado" obrigatorio />
            <FormField label="Descricao" field="descricao" placeholder="Ex: Desconto de R$ 20" />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Fornecedor" field="fornecedor" placeholder="Ex: Mercado X" />
              <FormField label="Contato / Site" field="contato" placeholder="Ex: mercado.com.br" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Pontos necessarios" field="pontos" placeholder="Ex: 500" type="number" obrigatorio />
              <FormField label="Quantidade disponivel" field="quantidade" placeholder="Vazio = ilimitado" type="number" />
            </div>
            <FormField label="Prazo ativo" field="prazo" placeholder="" type="date" />
            <div className="flex items-center gap-3">
              <button onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ backgroundColor: form.ativo ? '#D4E8D1' : '#f0f0f0', color: form.ativo ? '#2D5A27' : '#888' }}>
                {form.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <span className="text-xs text-gray-400">Clique para alternar</span>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={fechar} className="flex-1 py-2.5 rounded-xl border text-sm text-gray-500" style={{ borderColor: '#D4E8D1' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#F5A623' }}>
                {salvando ? 'Salvando...' : 'Salvar premio'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal ver */}
      {modal === 'ver' && selecionado && (
        <Modal titulo="Detalhes do premio" onClose={fechar}>
          <div className="flex flex-col gap-3">
            {selecionado.foto && <img src={selecionado.foto} alt="" className="w-full h-44 object-cover rounded-xl border" style={{ borderColor: '#D4E8D1' }} />}
            {[
              ['Nome', selecionado.nome],
              ['Descricao', selecionado.descricao || '—'],
              ['Fornecedor', selecionado.fornecedor || '—'],
              ['Contato', selecionado.contato || '—'],
              ['Pontos', `${selecionado.pontos} pts`],
              ['Quantidade', selecionado.quantidade ? `${selecionado.quantidade - (selecionado.resgatados || 0)} restantes` : 'Ilimitado'],
              ['Prazo', selecionado.prazo || '—'],
              ['Resgatados', selecionado.resgatados || 0],
              ['Status', selecionado.ativo ? 'Ativo' : 'Inativo'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between border-b pb-2" style={{ borderColor: '#D4E8D1' }}>
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{val}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => abrirEditar(selecionado)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2D5A27' }}>Editar</button>
              <button onClick={() => remover(selecionado.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600">Remover</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}