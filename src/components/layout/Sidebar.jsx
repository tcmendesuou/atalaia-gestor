import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',        icon: 'layout-dashboard', label: 'Dashboard'     },
  { to: '/admins',  icon: 'shield-check',     label: 'Admins'        },
  { to: '/desbravadores', icon: 'users',      label: 'Desbravadores' },
  { to: '/coletas', icon: 'package',          label: 'Coletas'       },
  { to: '/mapa',    icon: 'map',              label: 'Mapa'          },
  { to: '/itens',   icon: 'table',            label: 'Itens e pontos'},
  { to: '/premios', icon: 'gift',             label: 'Premios'       },
]

export default function Sidebar() {
  return (
    <div className="w-52 flex flex-col py-4 gap-1 shrink-0" style={{ backgroundColor: '#1A3A17' }}>
      <div className="flex items-center gap-3 px-4 mb-4">
        <img src="/logo.png" alt="Atalaia" className="w-10 h-10 object-contain" />
        <div>
          <p className="text-white text-xs font-bold tracking-widest leading-tight">ATALAIA</p>
          <p className="text-xs leading-tight" style={{ color: '#A8D5A2' }}>Gestor Geral</p>
        </div>
      </div>

      {links.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors ` +
            (isActive ? 'bg-white/20' : 'hover:bg-white/10')
          }
        >
          <i className={`ti ti-${icon} text-white text-lg shrink-0`} />
          <span className="text-white text-sm">{label}</span>
        </NavLink>
      ))}

      <div className="mt-auto mx-2">
        <NavLink
          to="/config"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <i className="ti ti-settings text-white text-lg shrink-0" />
          <span className="text-white text-sm">Configuracoes</span>
        </NavLink>
      </div>
    </div>
  )
}