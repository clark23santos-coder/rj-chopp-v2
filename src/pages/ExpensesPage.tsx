import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';
import {
  CACHE_FINANCIAL_KEY,
  OFFLINE_FINANCIAL_KEY,
  addOfflineAction,
  cacheItems,
  getCachedItems,
  isOnline,
  markOfflineDeleted,
  mergeOfflineWithOnline,
  saveOfflineItem,
} from '../services/offline';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

function formatMoney(value: any) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function formatDate(value: any) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('pt-BR');
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
    try {
      const response = await api.get(
        '/financial-transactions',
        authHeaders()
      );

      const onlyExpenses = Array.isArray(response.data)
        ? response.data.filter((item: any) => item.type === 'OUTPUT')
        : [];

      setExpenses(onlyExpenses);
    } catch (error) {
      console.log('Erro ao carregar despesas:', error);
      setExpenses([]);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  async function saveExpense(event: any) {
    event.preventDefault();

    try {
      setLoading(true);

      const form = new FormData(event.currentTarget);

      const data = {
        type: 'OUTPUT',
        category: String(form.get('category') || 'Despesa'),
        description: String(form.get('description') || ''),
        amount: Number(form.get('amount') || 0),
      };

      if (!data.description.trim()) {
        alert('Coloque o que foi gasto.');
        return;
      }

      if (data.amount <= 0) {
        alert('Coloque um valor maior que zero.');
        return;
      }

      await api.post(
        '/financial-transactions',
        data,
        authHeaders()
      );

      setShowModal(false);
      await loadExpenses();

      addAuditLog({
        area: 'Despesas',
        action: 'CREATE',
        title: `Despesa criada: ${data.description}`,
        description: `Categoria: ${data.category || 'Despesa'}\nValor: ${formatMoney(data.amount)}`,
      });
    } catch (error) {
      console.log('Erro ao salvar despesa:', error);
      alert('Não foi possível salvar a despesa.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteExpense(expense: any) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja apagar a despesa "${expense.description}"?\n\nEssa ação não tem como desfazer.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      await api.delete(
        `/financial-transactions/${expense.id}`,
        authHeaders()
      );

      await loadExpenses();

      addAuditLog({
        area: 'Despesas',
        action: 'DELETE',
        title: `Despesa apagada: ${expense.description || 'Despesa'}`,
        description: `Categoria: ${expense.category || 'Despesa'}\nValor: ${formatMoney(expense.amount)}`,
      });

      alert('Despesa apagada com sucesso.');
    } catch (error) {
      console.log('Erro ao apagar despesa:', error);
      alert('Não foi possível apagar essa despesa.');
    } finally {
      setLoading(false);
    }
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
        <Card
          title="Total de Despesas"
          value={formatMoney(totalExpenses)}
        />

        <Card
          title="Quantidade"
          value={expenses.length}
        />
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
        <table className="w-full min-w-[850px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">O que foi gasto</th>
              <th className="p-5">Categoria</th>
              <th className="p-5">Valor</th>
              <th className="p-5">Data</th>
              <th className="p-5">Ações</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-t border-zinc-800">
                <td className="p-5 font-bold">
                  {expense.description}
                </td>

                <td className="p-5 text-zinc-400">
                  {expense.category || 'Despesa'}
                </td>

                <td className="p-5 text-red-400 font-black">
                  {formatMoney(expense.amount)}
                </td>

                <td className="p-5 text-zinc-400">
                  {formatDate(expense.createdAt)}
                </td>

                <td className="p-5">
                  <button
                    onClick={() => deleteExpense(expense)}
                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-3 rounded-xl"
                    title="Apagar despesa"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {expenses.length === 0 && (
              <tr>
                <td className="p-5 text-zinc-500" colSpan={5}>
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
                name="category"
                placeholder="Categoria. Ex: Entrega, manutenção, compra..."
                defaultValue="Despesa"
                className={inputClass}
              />

              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Quanto foi gasto?"
                className={inputClass}
              />

              <button
                disabled={loading}
                className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Despesa'}
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