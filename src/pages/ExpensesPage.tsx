import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Receipt,
  Wallet,
  Search,
  CalendarDays,
  X,
  TrendingDown,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

function Field({ label, children }: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-yellow-200">
        {label}
      </label>

      {children}
    </div>
  );
}

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

function PremiumPanel({ children }: any) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/50 shadow-[0_0_38px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.05),transparent_38%,rgba(250,204,21,.035))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
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

  const filteredExpenses = expenses.filter((expense) => {
    const text = search.toLowerCase();

    return (
      expense.description?.toLowerCase().includes(text) ||
      expense.category?.toLowerCase().includes(text)
    );
  });

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );
  }, [expenses]);

  const biggestExpense = useMemo(() => {
    return expenses.reduce((biggest, item) => {
      if (!biggest) {
        return item;
      }

      return Number(item.amount || 0) > Number(biggest.amount || 0)
        ? item
        : biggest;
    }, null);
  }, [expenses]);

  return (
    <Layout>
      <PageHeader
        title="Despesas"
        description="Controle dos gastos extras, manutenção, compras e custos operacionais da RJ Chopp."
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total de Despesas"
          value={formatMoney(totalExpenses)}
        />

        <Card
          title="Quantidade"
          value={expenses.length}
        />

        <Card
          title="Resultado da busca"
          value={filteredExpenses.length}
        />

        <Card
          title="Maior despesa"
          value={biggestExpense ? formatMoney(biggestExpense.amount) : 'R$ 0,00'}
        />
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
          />

          <input
            placeholder="Pesquisar por despesa ou categoria..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} pl-12`}
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(250,204,21,.35)]"
        >
          <Plus size={20} />
          Adicionar Despesa
        </button>
      </div>

      <PremiumPanel>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
                <th className="p-5">O que foi gasto</th>
                <th className="p-5">Categoria</th>
                <th className="p-5">Valor</th>
                <th className="p-5">Data</th>
                <th className="p-5">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035]"
                >
                  <td className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-2xl border border-red-500/25 bg-red-500/15 p-3 text-red-400">
                        <Receipt size={20} />
                      </div>

                      <div>
                        <p className="font-black text-white">
                          {expense.description}
                        </p>

                        <p className="mt-1 text-xs font-medium text-zinc-500">
                          ID: {String(expense.id || '').slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-zinc-400">
                    {expense.category || 'Despesa'}
                  </td>

                  <td className="p-5 font-black text-red-400">
                    {formatMoney(expense.amount)}
                  </td>

                  <td className="p-5 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-yellow-400" />
                      {formatDate(expense.createdAt)}
                    </div>
                  </td>

                  <td className="p-5">
                    <button
                      onClick={() => deleteExpense(expense)}
                      className="rounded-xl border border-red-500/25 bg-red-500/15 p-3 text-red-400 transition hover:bg-red-500 hover:text-white"
                      title="Apagar despesa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td className="p-6 text-zinc-500" colSpan={5}>
                    Nenhuma despesa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumPanel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Despesas
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    Adicionar Despesa
                  </h2>

                  <p className="mt-2 text-sm font-medium text-zinc-400">
                    Registre qualquer gasto extra da operação.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border border-yellow-500/20 bg-black/45 p-3 text-zinc-300 transition hover:bg-yellow-400 hover:text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={saveExpense} className="space-y-4">
                <Field label="O que foi gasto?">
                  <input
                    name="description"
                    placeholder="Ex: gasolina, conserto, manutenção..."
                    className={inputClass}
                  />
                </Field>

                <Field label="Categoria">
                  <input
                    name="category"
                    placeholder="Ex: Entrega, manutenção, compra..."
                    defaultValue="Despesa"
                    className={inputClass}
                  />
                </Field>

                <Field label="Valor gasto">
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="Quanto foi gasto?"
                    className={inputClass}
                  />
                </Field>

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Despesa'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}