import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  Users,
  Wallet,
  Receipt,
  HandCoins,
  Truck,
  BarChart3,
  Settings,
  Database,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  History,
  X,
} from 'lucide-react';

function getCurrentUser() {
  try {
    const saved = localStorage.getItem('rjchopp_user');

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function canSee(user: any, roles: string[]) {
  if (!user) {
    return false;
  }

  if (user.role === 'ADMIN') {
    return true;
  }

  return roles.includes(user.role);
}

function menuClass({ isActive }: any) {
  return `group rounded-2xl px-4 py-3 font-black transition flex items-center gap-3 ${
    isActive
      ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
      : 'bg-zinc-900 text-zinc-300 hover:bg-yellow-400 hover:text-black border border-zinc-800'
  }`;
}

const menuItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'SALES', 'FINANCE'],
  },
  {
    to: '/produtos',
    label: 'Produtos',
    icon: Package,
    roles: ['ADMIN', 'SALES'],
  },
  {
    to: '/estoque',
    label: 'Estoque',
    icon: Boxes,
    roles: ['ADMIN', 'SALES'],
  },
  {
    to: '/pedidos',
    label: 'Pedidos',
    icon: ClipboardList,
    roles: ['ADMIN', 'SALES', 'DELIVERY'],
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: Users,
    roles: ['ADMIN', 'SALES'],
  },
  {
    to: '/mapa',
    label: 'Mapa',
    icon: MapPinned,
    roles: ['ADMIN', 'SALES', 'DELIVERY'],
  },
  {
    to: '/financeiro',
    label: 'Financeiro',
    icon: Wallet,
    roles: ['ADMIN', 'FINANCE'],
  },
  {
    to: '/despesas',
    label: 'Despesas',
    icon: Receipt,
    roles: ['ADMIN', 'FINANCE'],
  },
  {
    to: '/receber',
    label: 'Contas a Receber',
    icon: HandCoins,
    roles: ['ADMIN', 'SALES', 'FINANCE'],
  },
  {
    to: '/retiradas',
    label: 'Retiradas',
    icon: Truck,
    roles: ['ADMIN', 'SALES', 'DELIVERY'],
  },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    roles: ['ADMIN', 'FINANCE'],
  },
  {
    to: '/historico',
    label: 'Histórico',
    icon: History,
    roles: ['ADMIN'],
  },
  {
    to: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
    roles: ['ADMIN'],
  },
  {
    to: '/backup',
    label: 'Backup',
    icon: Database,
    roles: ['ADMIN'],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('rjchopp_sidebar_collapsed') === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const user = getCurrentUser();

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => canSee(user, item.roles));
  }, [user]);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('rjchopp_sidebar_collapsed', String(next));
  }

  function logout() {
    const confirmLogout = window.confirm('Deseja sair do sistema?');

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem('rjchopp_user');
    navigate('/login');
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-yellow-400 leading-none">
            RJ Chopp
          </h1>

          {user && (
            <p className="text-xs text-zinc-500 font-bold">
              {user.name} • {user.roleLabel}
            </p>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="bg-yellow-400 text-black rounded-2xl p-3 font-black"
        >
          <Menu size={24} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[90] bg-black/70">
          <aside className="absolute left-0 top-0 bottom-0 w-[86vw] max-w-[340px] bg-black border-r border-zinc-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-3xl font-black text-yellow-400 leading-none">
                  RJ Chopp
                </h1>

                <p className="text-xs text-zinc-500 font-bold mt-2">
                  Sistema de gestão
                </p>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="bg-zinc-900 text-white rounded-2xl p-3 border border-zinc-800"
              >
                <X size={22} />
              </button>
            </div>

            {user && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 mb-6">
                <p className="text-xs text-zinc-500 font-bold uppercase">
                  Usuário
                </p>

                <p className="text-white font-black truncate">
                  {user.name}
                </p>

                <p className="text-yellow-400 text-sm font-bold">
                  {user.roleLabel}
                </p>
              </div>
            )}

            <nav className="flex flex-col gap-3 pb-6">
              {visibleItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={menuClass}
                    onClick={closeMobileMenu}
                  >
                    <Icon size={22} className="shrink-0" />

                    <span className="truncate">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="border-t border-zinc-800 pt-4 mt-4">
              <button
                onClick={logout}
                className="w-full rounded-2xl px-4 py-3 font-black transition flex items-center gap-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
              >
                <LogOut size={22} />

                <span>Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside
        className={`hidden md:block fixed left-0 top-0 h-screen overflow-y-auto bg-black border-r border-zinc-800 p-4 transition-all duration-300 z-40 ${
          collapsed ? 'w-24' : 'w-72'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-8">
          {!collapsed && (
            <div>
              <h1 className="text-3xl font-black text-yellow-400 leading-none">
                RJ Chopp
              </h1>

              <p className="text-xs text-zinc-500 font-bold mt-2">
                Sistema de gestão
              </p>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="bg-yellow-400 text-black rounded-2xl p-3 font-black hover:bg-yellow-500 transition"
            title={collapsed ? 'Abrir menu' : 'Fechar menu'}
          >
            {collapsed ? <Menu size={22} /> : <ChevronLeft size={22} />}
          </button>
        </div>

        {!collapsed && user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 mb-6">
            <p className="text-xs text-zinc-500 font-bold uppercase">
              Usuário
            </p>

            <p className="text-white font-black truncate">
              {user.name}
            </p>

            <p className="text-yellow-400 text-sm font-bold">
              {user.roleLabel}
            </p>
          </div>
        )}

        <nav className="flex flex-col gap-3 pb-6">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={menuClass}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={22} className="shrink-0" />

                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 pt-4 mt-4">
          <button
            onClick={logout}
            className={`w-full rounded-2xl px-4 py-3 font-black transition flex items-center gap-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sair"
          >
            <LogOut size={22} />

            {!collapsed && (
              <span>Sair</span>
            )}
          </button>

          {collapsed && (
            <button
              onClick={toggleSidebar}
              className="w-full mt-3 rounded-2xl px-4 py-3 font-black transition flex items-center justify-center bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
              title="Abrir menu"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
