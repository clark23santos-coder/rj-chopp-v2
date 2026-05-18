import { NavLink } from 'react-router-dom';

function menuClass({ isActive }: any) {
  return `rounded-2xl px-5 py-4 font-black transition block ${
    isActive
      ? 'bg-yellow-400 text-black'
      : 'bg-yellow-400 text-black hover:bg-yellow-500'
  }`;
}

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 w-72 h-screen overflow-y-auto bg-black border-r border-zinc-800 p-6">
      <h1 className="text-3xl font-black text-yellow-400 mb-10">
        RJ Chopp
      </h1>

      <nav className="flex flex-col gap-3 pb-20">
        <NavLink to="/" className={menuClass}>Dashboard</NavLink>
        <NavLink to="/produtos" className={menuClass}>Produtos</NavLink>
        <NavLink to="/estoque" className={menuClass}>Estoque</NavLink>
        <NavLink to="/pedidos" className={menuClass}>Pedidos</NavLink>
        <NavLink to="/clientes" className={menuClass}>Clientes</NavLink>
        <NavLink to="/financeiro" className={menuClass}>Financeiro</NavLink>
        <NavLink to="/despesas" className={menuClass}>Despesas</NavLink>
        <NavLink to="/receber" className={menuClass}>Contas a Receber</NavLink>
        <NavLink to="/retiradas" className={menuClass}>Retiradas</NavLink>
        <NavLink to="/relatorios" className={menuClass}>Relatórios</NavLink>
      </nav>
    </aside>
  );
}