import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setErro('')
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha)
      const snap = await getDoc(doc(db, 'gestores', cred.user.uid))
      if (!snap.exists()) {
        await auth.signOut()
        setErro('Acesso negado. Voce nao e um Gestor Geral.')
        return
      }
      onLogin()
    } catch {
      setErro('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#1A3A17' }}>
      <div className="bg-white rounded-2xl p-10 w-full max-w-sm flex flex-col gap-6 items-center">

        <img src="/logo.png" alt="Atalaia" className="w-24 h-24 object-contain" />

        <div className="text-center">
          <p className="text-xl font-bold tracking-widest" style={{ color: '#1A3A17' }}>PROJETO ATALAIA</p>
          <p className="text-xs mt-1" style={{ color: '#2D5A27' }}>Painel do Gestor Geral</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="gestor@atalaia.com"
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
              style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#2D5A27' }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
              style={{ borderColor: '#D4E8D1', backgroundColor: '#F0FAF0' }}
            />
          </div>
          {erro && <p className="text-xs text-red-500 text-center">{erro}</p>}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: '#F5A623' }}
        >
          {loading ? 'Entrando...' : 'Entrar como Gestor'}
        </button>

        <p className="text-xs text-center" style={{ color: '#aaa' }}>
          Acesso restrito ao Gestor Geral
        </p>
      </div>
    </div>
  )
}