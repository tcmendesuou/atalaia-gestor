import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'

export default function Topbar({ title }) {
  return (
    <div className="h-12 bg-white border-b flex items-center justify-between px-4 shrink-0" style={{ borderColor: '#D4E8D1' }}>
      <span className="text-sm font-semibold" style={{ color: '#1A3A17' }}>{title}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#F0FAF0', color: '#2D5A27' }}>
          Gestor Geral
        </span>
        <button
          onClick={() => signOut(auth)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
          style={{ backgroundColor: '#F0FAF0' }}
          title="Sair"
        >
          <i className="ti ti-logout text-sm" style={{ color: '#2D5A27' }} />
        </button>
      </div>
    </div>
  )
}