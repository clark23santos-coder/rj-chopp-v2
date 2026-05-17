import { NavLink } from 'react-router-dom';

function menuClass({ isActive }: any) {
  return `rounded-2xl px-5 py-4 font-bold transition ${
    isActive
      ? 'bg-yellow-400 text-black'
      : 'bg-zinc-900 text-white hover:bg-yellow-400 hover:text-black'
  }`;
}

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen overflow-y-auto bg-black border-r border-zinc-800 p-6 shrink-0">
      <h1 className="text-3xl font-black text-yellow-400 mb-10">
        RJ Chopp
      </h1>

      <nav className="flex flex-col gap-3 pb-10">
        <NavLink to="/" className={menuClass}>Dashboard</NavLink>
        <NavLink to="/produtos" className={menuClass}>Produtos</NavLink>
        <NavLink to="/pedidos" className={menuClass}>Pedidos</NavLink>
        <NavLink to="/clientes" className={menuClass}>Clientes</NavLink>
        <NavLink to="/financeiro" className={menuClass}>Financeiro</NavLink>
        <NavLink to="/despesas" className={menuClass}>Despesas</NavLink>
        <NavLink to="/receber" className={menuClass}>Contas a Receber</NavLink>
        <NavLink to="/retiradas" className={menuClass}>Retiradas</NavLink>
        <NavLink to="/agenda-retirada" className={menuClass}>Agenda de Retirada</NavLink>
        <NavLink to="/relatorios" className={menuClass}>Relatórios</NavLink>
      </nav>
    </aside>
  );
}