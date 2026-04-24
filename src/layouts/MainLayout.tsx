import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Package, DollarSign, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCashRegister } from '../contexts/CashRegisterContext'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { cashRegister } = useCashRegister()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    }`

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-card border-r border-surface-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-surface-border">
          <h1 className="text-lg font-bold text-white">MindSys PDV</h1>
          <p className="text-xs text-slate-400 mt-0.5">v1.0.0</p>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/pdv" className={navClass}>
            <ShoppingCart size={16} />
            Frente de Caixa
          </NavLink>
          <NavLink to="/products" className={navClass}>
            <Package size={16} />
            Produtos
          </NavLink>
          <NavLink to="/cash-register" className={navClass}>
            <DollarSign size={16} />
            Caixa
          </NavLink>
        </nav>

        {/* Rodapé: usuário e status do caixa */}
        <div className="p-3 border-t border-surface-border space-y-2">
          {/* Status do caixa */}
          <div className={`text-xs px-2 py-1 rounded text-center font-medium ${
            cashRegister
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}>
            {cashRegister ? '● Caixa aberto' : '● Caixa fechado'}
          </div>

          {/* Usuário logado */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
