import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-72 min-h-screen bg-black border-r border-zinc-800 p-6">
      <h1 className="text-3xl font-black text-yellow-400 mb-10">
        RJ Chopp
      </h1>

      <nav className="flex flex-col gap-3">
        <Link
          to="/"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Dashboard
        </Link>

        <Link
          to="/produtos"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Produtos
        </Link>

        <Link
          to="/pedidos"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Pedidos
        </Link>

        <Link
          to="/clientes"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Clientes
        </Link>

        <Link
          to="/financeiro"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Financeiro
        </Link>

        <Link
          to="/despesas"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Despesas
        </Link>

        <Link
          to="/receber"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Contas a Receber
        </Link>

        <Link
          to="/retiradas"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Retiradas
        </Link>

        <Link
          to="/agenda-retirada"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Agenda de Retirada
        </Link>

        <Link
          to="/relatorios"
          className="bg-zinc-900 hover:bg-zinc-800 rounded-2xl px-5 py-4"
        >
          Relatórios
        </Link>
      </nav>
    </aside>
  );
}