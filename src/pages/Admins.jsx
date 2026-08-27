import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '../firebase/config'

const ESTADOS_CIDADES = {
  'SP': ['Piracicaba', 'São Paulo', 'Campinas', 'Ribeirão Preto', 'Sorocaba'],
  'MG': ['Belo Horizonte', 'Contagem', 'Betim', 'Divinópolis', 'Montes Claros'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'São Gonçalo', 'Itaboraí'],
  'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Ilhéus'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Santa Maria', 'Gravataí'],
}

const VAZIO = { nome: '', email: '', senha: '', estado: '', cidade: '', status: 'ativo' }

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#D4E8D1' }}>
          <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{titulo}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

const inputClass = "w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
const inputStyle = { borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }

export default function Admins() {
  const [admins, setAdmins] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(VAZIO)
  const [selecionado, setSelecionado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), snap => {
      setAdmins(snap.docs.map(d => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })
    return unsub
  }, [])

  function abrirNovo() { setForm(VAZIO); setErro(''); setModal('novo') }
  function abrirVer(a) { setSelecionado(a); setModal('ver') }
  function fechar() { setModal(null); setSelecionado(null); setForm(VAZIO); setErro('') }

  async function criarAdmin() {
    if (!form.nome || !form.email || !form.senha || !form.estado || !form.cidade) {
      setErro('Preencha todos os campos.'); return
    }

    // Validar se já existe admin na mesma cidade
    const adminExistente = admins.find(a => a.cidade === form.cidade && a.estado === form.estado)
    if (adminExistente) {
      setErro(`Já existe um admin cadastrado em ${form.cidade}, ${form.estado}.`); return
    }

    setSalvando(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      const codigoConvite = Math.random().toString(36).substring(2, 8).toUpperCase()
      await setDoc(doc(db, 'admins', cred.user.uid), {
        id: cred.user.uid,
        nome: form.nome,
        email: form.email,
        estado: form.estado,
        cidade: form.cidade,
        status: 'ativo',
        codigoConvite,
        criadoEm: new Date().toISOString(),
      })
      fechar()
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setErro('Este e-mail ja esta em uso.')
      else setErro('Erro ao criar admin.')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleStatus(admin) {
    await updateDoc(doc(db, 'admins', admin.id), {
      status: admin.status === 'ativo' ? 'inativo' : 'ativo'
    })
  }

  async function remover(id) {
    if (!confirm('Remover este admin?')) return
    await deleteDoc(doc(db, 'admins', id))
    fechar()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5A27' }} />
    </div>
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-white rounded-2xl border overflow-hidden flex flex-col flex-1" style={{ borderColor: '#D4E8D1' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#D4E8D1' }}>
          <div>
            <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>Admins cadastrados</span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
              {admins.filter(a => a.status === 'ativo').length} ativos
            </span>
          </div>
          <button
            onClick={abrirNovo}
            className="text-xs px-4 py-2 rounded-xl text-white font-semibold transition-colors"
            style={{ backgroundColor: '#F5A623' }}
          >
            + Novo admin
          </button>
        </div>

        {/* Tabela */}
        <div className="grid grid-cols-5 px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
          {['Admin', 'Localizacao', 'Cod. Convite', 'Status', 'Acoes'].map(h => (
            <span key={h}>{h}</span>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {admins.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-400">Nenhum admin cadastrado ainda.</p>
            </div>
          ) : (
            admins.map(a => (
              <div key={a.id} className="grid grid-cols-5 px-4 py-3 border-b items-center hover:bg-green-50 transition-colors last:border-0" style={{ borderColor: '#D4E8D1' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{a.nome}</p>
                  <p className="text-xs text-gray-400">{a.email}</p>
                </div>
                <span className="text-sm text-gray-600">{a.cidade}, {a.estado}</span>
                <span className="text-sm font-mono font-bold" style={{ color: '#2D5A27' }}>{a.codigoConvite}</span>
                <button
                  onClick={() => toggleStatus(a)}
                  className="text-xs px-2 py-1 rounded-full w-fit font-semibold transition-colors"
                  style={{
                    backgroundColor: a.status === 'ativo' ? '#D4E8D1' : '#f0f0f0',
                    color: a.status === 'ativo' ? '#2D5A27' : '#888'
                  }}
                >
                  {a.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => abrirVer(a)} className="text-xs text-gray-400 hover:text-gray-600">Ver</button>
                  <button onClick={() => remover(a.id)} className="text-xs text-red-400 hover:text-red-600">Remover</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal novo admin */}
      {modal === 'novo' && (
        <Modal titulo="Novo admin" onClose={fechar}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>Nome completo</label>
              <input
                type="text"
                className={inputClass}
                style={inputStyle}
                placeholder="Ex: Joao Silva"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>E-mail</label>
              <input
                type="email"
                className={inputClass}
                style={inputStyle}
                placeholder="admin@atalaia.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>Senha inicial</label>
              <input
                type="password"
                className={inputClass}
                style={inputStyle}
                placeholder="Minimo 6 caracteres"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>Estado</label>
                <select
                  className={inputClass}
                  style={inputStyle}
                  value={form.estado}
                  onChange={e => setForm(f => ({ ...f, estado: e.target.value, cidade: '' }))}
                >
                  <option value="">Selecione...</option>
                  {Object.keys(ESTADOS_CIDADES).map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>Cidade</label>
                <select
                  className={inputClass}
                  style={inputStyle}
                  value={form.cidade}
                  onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))}
                  disabled={!form.estado}
                >
                  <option value="">Selecione...</option>
                  {form.estado && ESTADOS_CIDADES[form.estado].map(cidade => (
                    <option key={cidade} value={cidade}>{cidade}</option>
                  ))}
                </select>
              </div>
            </div>

            {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={fechar} className="flex-1 py-2.5 rounded-xl border text-sm text-gray-500 hover:bg-gray-50" style={{ borderColor: '#D4E8D1' }}>
                Cancelar
              </button>
              <button
                onClick={criarAdmin}
                disabled={salvando}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#F5A623' }}
              >
                {salvando ? 'Criando...' : 'Criar admin'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal ver detalhes */}
      {modal === 'ver' && selecionado && (
        <Modal titulo="Detalhes do admin" onClose={fechar}>
          <div className="flex flex-col gap-3">
            {[
              ['Nome', selecionado.nome],
              ['E-mail', selecionado.email],
              ['Cidade', selecionado.cidade],
              ['Estado', selecionado.estado],
              ['Status', selecionado.status],
              ['Codigo de convite', selecionado.codigoConvite],
              ['Criado em', selecionado.criadoEm ? new Date(selecionado.criadoEm).toLocaleDateString('pt-BR') : '-'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between border-b pb-2" style={{ borderColor: '#D4E8D1' }}>
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{val}</span>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => toggleStatus(selecionado)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: selecionado.status === 'ativo' ? '#FFEBEE' : '#D4E8D1',
                  color: selecionado.status === 'ativo' ? '#C62828' : '#2D5A27'
                }}
              >
                {selecionado.status === 'ativo' ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => remover(selecionado.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100"
              >
                Remover
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}