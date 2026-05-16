import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([
    {
      id: '1',
      client: 'Carlos Eduardo',
      item: 'Chopeira',
      date: '2026-05-18',
      status: 'PENDENTE',
    },
  ]);

  const [showModal, setShowModal] = useState(false);

  function saveWithdrawal(event: any) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const newWithdrawal = {
      id: String(Date.now()),
      client: String(form.get('client')),
      item: String(form.get('item')),
      date: String(form.get('date')),
      status: 'PENDENTE',
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    setShowModal(false);
  }

  function confirmWithdrawal(id: string) {
    setWithdrawals((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'RETIRADO' } : item
      )
    );
  }

  const pending = useMemo(() => {
    return withdrawals.filter((item) => item.status !== 'RETIRADO');
  }, [withdrawals]);

  return (
    <Layout>
      <PageHeader
        title="Retiradas"
        description="Controle de cascos, barris e chopeiras para buscar"
      />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card title="Pendentes" value={pending.length} />
        <Card title="Total de Retiradas" value={withdrawals.length} />
      </div>

      <div className="flex justify-end mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Retirada
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">Cliente</th>
              <th className="p-5">Item</th>
              <th className="p-5">Data</th>
              <th className="p-5">Status</th>
              <th className="p-5">Ação</th>
            </tr>
          </thead>

          <tbody>
            {withdrawals.map((item) => (
              <tr key={item.id} className="border-t border-zinc-800">
                <td className="p-5 font-bold">{item.client}</td>
                <td className="p-5 text-zinc-400">{item.item}</td>
                <td className="p-5 text-zinc-400">{item.date}</td>
                <td className="p-5">
                  {item.status === 'RETIRADO' ? (
                    <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                      Retirado
                    </span>
                  ) : (
                    <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="p-5">
                  <button
                    onClick={() => confirmWithdrawal(item.id)}
                    className="bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-2xl px-5 py-3 font-bold"
                  >
                    Confirmar Retirada
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              Nova Retirada
            </h2>

            <form onSubmit={saveWithdrawal} className="space-y-4">
              <input
                name="client"
                placeholder="Nome do cliente"
                className={inputClass}
              />

              <input
                name="item"
                placeholder="Ex: casco 50L, chopeira..."
                className={inputClass}
              />

              <input
                name="date"
                type="date"
                className={inputClass}
              />

              <button className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black">
                Salvar Retirada
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full bg-zinc-800 rounded-2xl py-4 font-bold"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}