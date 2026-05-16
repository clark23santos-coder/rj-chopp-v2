import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  function getToken() {
    return localStorage.getItem('token');
  }

  function authHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    };
  }

  async function loadExpenses() {
    const response = await api.get('/financial', authHeaders());

    const onlyExpenses = response.data.filter(
      (item: any) => item.type === 'OUTPUT'
    );

    setExpenses(onlyExpenses);
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  async function saveExpense(event: any) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const data = {
      type: 'OUTPUT',
      category: 'DESPESA',
      description: String(form.get('description')),
      amount: Number(form.get('amount')),
    };

    await api.post('/financial', data, authHeaders());

    setShowModal(false);
    loadExpenses();
  }

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );
  }, [expenses]);

  return (
    <Layout>
      <PageHeader
        title="Despesas"
        description="Controle de gastos extras da RJ Chopp"
      />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card title="Total de Despesas" value={`R$ ${totalExpenses}`} />
        <Card title="Quantidade" value={expenses.length} />
      </div>

      <div className="flex justify-end mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar Despesa
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">O que foi gasto</th>
              <th className="p-5">Categoria</th>
              <th className="p-5">Valor</th>
              <th className="p-5">Data</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-t border-zinc-800">
                <td className="p-5 font-bold">{expense.description}</td>

                <td className="p-5 text-zinc-400">{expense.category}</td>

                <td className="p-5 text-red-400 font-black">
                  R$ {expense.amount}
                </td>

                <td className="p-5 text-zinc-400">
                  {expense.createdAt
                    ? new Date(expense.createdAt).toLocaleString('pt-BR')
                    : '-'}
                </td>
              </tr>
            ))}

            {expenses.length === 0 && (
              <tr>
                <td className="p-5 text-zinc-500" colSpan={4}>
                  Nenhuma despesa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              Adicionar Despesa
            </h2>

            <form onSubmit={saveExpense} className="space-y-4">
              <input
                name="description"
                placeholder="O que foi gasto? Ex: gasolina, conserto..."
                className={inputClass}
              />

              <input
                name="amount"
                type="number"
                placeholder="Quanto foi gasto?"
                className={inputClass}
              />

              <button className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black">
                Salvar Despesa
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