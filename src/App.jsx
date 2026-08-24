import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase/config'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admins from './pages/Admins'
import Desbravadores from './pages/Desbravadores'
import Coletas from './pages/Coletas'
import Mapa from './pages/Mapa'
import Itens from './pages/Itens'
import Premios from './pages/Premios'

const routes = [
  { path: '/',              component: <Dashboard />,     title: 'Dashboard'      },
  { path: '/admins',        component: <Admins />,        title: 'Admins'         },
  { path: '/desbravadores', component: <Desbravadores />, title: 'Desbravadores'  },
  { path: '/coletas',       component: <Coletas />,       title: 'Coletas'        },
  { path: '/mapa',          component: <Mapa />,          title: 'Mapa'           },
  { path: '/itens',         component: <Itens />,         title: 'Itens e pontos' },
  { path: '/premios',       component: <Premios />,       title: 'Premios'        },
]

function Layout({ title, children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: '#F0FAF0' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [usuario, setUsuario] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setUsuario(user))
    return unsub
  }, [])

  if (usuario === undefined) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A3A17' }}>
      <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!usuario) return <Login onLogin={() => {}} />

  return (
    <BrowserRouter>
      <Routes>
        {routes.map(({ path, component, title }) => (
          <Route
            key={path}
            path={path}
            element={<Layout title={title}>{component}</Layout>}
          />
        ))}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}