import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Beer,
} from 'lucide-react';

function getCurrentUser() {
  try {
    const saved = localStorage.getItem('rjchopp_user');

    if (!saved) return null;

    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function canSee(user: any, roles: string[]) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return roles.includes(user.role);
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
  const location = useLocation();

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

  function collapseSidebar() {
    setCollapsed(true);
    localStorage.setItem('rjchopp_sidebar_collapsed', 'true');
  }

  function logout() {
    const confirmLogout = window.confirm('Deseja sair do sistema?');
    if (!confirmLogout) return;

    localStorage.removeItem('rjchopp_user');
    navigate('/login');
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  function getMenuClass(isActive: boolean, isCollapsed = false) {
    return `
      group relative overflow-hidden rounded-2xl border transition-all duration-300
      ${isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'}
      flex items-center gap-3
      ${
        isActive
          ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black border-yellow-300 shadow-[0_0_22px_rgba(250,204,21,.28)]'
          : 'bg-zinc-950/65 text-zinc-300 border-yellow-500/10 hover:bg-yellow-400/12 hover:border-yellow-400/35 hover:text-yellow-300'
      }
    `;
  }

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-yellow-500/20 bg-black/80 px-4 py-3 backdrop-blur-xl flex items-center justify-between shadow-[0_0_35px_rgba(245,158,11,.12)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-400">
            <Beer size={24} />
          </div>

          <div>
            <h1 className="text-xl font-black text-yellow-400 leading-none">
              RJ Chopp
            </h1>

            {user && (
              <p className="text-xs text-zinc-400 font-bold">
                {user.name} • {user.roleLabel}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="bg-yellow-400 text-black rounded-2xl p-3 font-black shadow-[0_0_22px_rgba(250,204,21,.24)]"
        >
          <Menu size={24} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm">
          <aside className="absolute left-0 top-0 bottom-0 w-[86vw] max-w-[350px] overflow-y-auto border-r border-yellow-500/20 bg-black/92 p-4 shadow-[0_0_70px_rgba(245,158,11,.16)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.14),transparent_30%)]" />

            <div className="relative flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/45 bg-yellow-500/10 text-yellow-400">
                  <Beer size={30} />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-yellow-400 leading-none">
                    RJ Chopp
                  </h1>

                  <p className="text-xs text-zinc-400 font-bold mt-2">
                    Sistema de gestão
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="bg-zinc-950 text-white rounded-2xl p-3 border border-yellow-500/20"
              >
                <X size={22} />
              </button>
            </div>

            {user && (
              <div className="relative overflow-hidden bg-black/45 border border-yellow-500/20 rounded-3xl p-4 mb-6 shadow-[0_0_35px_rgba(245,158,11,.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.12),transparent_34%)]" />

                <div className="relative">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.22em]">
                    Usuário
                  </p>

                  <p className="text-white font-black truncate mt-1">
                    {user.name}
                  </p>

                  <p className="text-yellow-400 text-sm font-bold">
                    {user.roleLabel}
                  </p>
                </div>
              </div>
            )}

            <nav className="relative flex flex-col gap-3 pb-6">
              {visibleItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => getMenuClass(isActive)}
                    onClick={closeMobileMenu}
                  >
                    <Icon size={22} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="relative border-t border-yellow-500/15 pt-4 mt-4">
              <button
                onClick={logout}
                className="w-full rounded-2xl px-4 py-3 font-black transition flex items-center gap-3 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
              >
                <LogOut size={22} />
                <span>Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen flex-col overflow-hidden border-r border-yellow-500/20 bg-black/82 p-4 transition-all duration-300 z-40 shadow-[0_0_65px_rgba(245,158,11,.10)] backdrop-blur-xl ${
          collapsed ? 'w-24' : 'w-72'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,.04),transparent_28%,rgba(250,204,21,.03))]" />

        <div className="relative flex items-center justify-between gap-3 mb-8">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/45 bg-yellow-500/10 text-yellow-400 shadow-[0_0_25px_rgba(250,204,21,.14)]">
                  <Beer size={30} />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-yellow-400 leading-none">
                    RJ Chopp
                  </h1>

                  <p className="text-xs text-zinc-400 font-bold mt-2">
                    Sistema de gestão
                  </p>
                </div>
              </div>

              <button
                onClick={toggleSidebar}
                className="bg-yellow-400 text-black rounded-2xl p-3 font-black hover:bg-yellow-300 transition shadow-[0_0_22px_rgba(250,204,21,.20)]"
                title="Fechar menu"
              >
                <ChevronLeft size={22} />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/45 bg-yellow-500/10 text-yellow-400 shadow-[0_0_25px_rgba(250,204,21,.14)]">
                <Beer size={30} />
              </div>

              <button
                onClick={toggleSidebar}
                className="bg-yellow-400 text-black rounded-2xl p-3 font-black hover:bg-yellow-300 transition shadow-[0_0_22px_rgba(250,204,21,.20)]"
                title="Abrir menu"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          )}
        </div>

        {!collapsed && user && (
          <div className="relative overflow-hidden bg-black/45 border border-yellow-500/20 rounded-3xl p-4 mb-6 shadow-[0_0_35px_rgba(245,158,11,.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.12),transparent_34%)]" />

            <div className="relative">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.22em]">
                Usuário
              </p>

              <p className="text-white font-black truncate mt-1">
                {user.name}
              </p>

              <p className="text-yellow-400 text-sm font-bold">
                {user.roleLabel}
              </p>
            </div>
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <nav className="flex flex-col gap-3 pb-6">
            {visibleItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    getMenuClass(isActive, collapsed)
                  }
                  title={collapsed ? item.label : undefined}
                  onClick={() => {
                    if (window.innerWidth >= 768 && !collapsed) {
                      collapseSidebar();
                    }
                  }}
                >
                  <Icon size={22} className="shrink-0" />

                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="relative border-t border-yellow-500/15 pt-4 mt-4">
          <button
            onClick={logout}
            className={`w-full rounded-2xl px-4 py-3 font-black transition flex items-center gap-3 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sair"
          >
            <LogOut size={22} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}