import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  X,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
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

function formatCompactMoney(value: any) {
  const number = Number(value || 0);
  const abs = Math.abs(number);
  const sign = number < 0 ? '- ' : '';

  if (abs >= 1000000) {
    return `${sign}R$ ${(abs / 1000000).toFixed(1).replace('.', ',')} mi`;
  }

  if (abs >= 1000) {
    return `${sign}R$ ${(abs / 1000).toFixed(1).replace('.', ',')} mil`;
  }

  return `${sign}${formatMoney(abs)}`;
}

function formatDate(value: any) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('pt-BR');
}

function FinancialCard({ title, value, fullValue, icon: Icon, tone = 'yellow' }: any) {
  const toneClass =
    tone === 'red'
      ? 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/25'
      : tone === 'green'
        ? 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/25'
        : 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/25';

  return (
    <div className="group relative min-h-[145px] overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400/35 hover:shadow-[0_0_50px_rgba(245,158,11,.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[75%] text-sm font-black text-zinc-300 md:text-base">
            {title}
          </p>

          {Icon && (
            <div className={`rounded-2xl border bg-gradient-to-br p-3 ${toneClass}`}>
              <Icon size={22} />
            </div>
          )}
        </div>

        <div>
          <p className="text-2xl font-black leading-none text-white md:text-3xl">
            {value}
          </p>

          {fullValue && (
            <p className="mt-3 truncate text-xs font-medium text-zinc-500">
              {fullValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
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

export default function FinancialPage() {
  const [financial, setFinancial] = useState<any[]>([]);
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

  async function loadFinancial() {
    try {
      const response = await api.get(
        '/financial-transactions',
        authHeaders()
      );

      setFinancial(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log('Erro ao carregar financeiro:', error);
      setFinancial([]);
    }
  }

  useEffect(() => {
    loadFinancial();
  }, []);

  async function saveFinancial(event: any) {
    event.preventDefault();

    try {
      setLoading(true);

      const form = new FormData(event.currentTarget);

      const data = {
        description: String(form.get('description') || ''),
        amount: Number(form.get('amount') || 0),
        category: String(form.get('category') || ''),
        type: String(form.get('type') || 'ENTRY'),
      };

      if (!data.description.trim()) {
        alert('Coloque uma descrição para o lançamento.');
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
      await loadFinancial();

      addAuditLog({
        area: 'Financeiro',
        action: 'CREATE',
        title: `Lançamento financeiro criado: ${data.description}`,
        description: `Tipo: ${data.type === 'OUTPUT' ? 'Saída' : 'Entrada'}\nCategoria: ${data.category || '-'}\nValor: ${formatMoney(data.amount)}`,
      });
    } catch (error) {
      console.log('Erro ao salvar lançamento:', error);
      alert('Não foi possível salvar o lançamento financeiro.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteFinancial(item: any) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja apagar o lançamento "${item.description}"?\n\nEssa ação não tem como desfazer.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      await api.delete(
        `/financial-transactions/${item.id}`,
        authHeaders()
      );

      await loadFinancial();

      addAuditLog({
        area: 'Financeiro',
        action: 'DELETE',
        title: `Lançamento financeiro apagado: ${item.description || 'Lançamento'}`,
        description: `Categoria: ${item.category || '-'}\nTipo: ${item.type === 'OUTPUT' ? 'Saída' : 'Entrada'}\nValor: ${formatMoney(item.amount)}`,
      });

      alert('Lançamento apagado com sucesso.');
    } catch (error) {
      console.log('Erro ao apagar lançamento:', error);
      alert('Não foi possível apagar esse lançamento.');
    } finally {
      setLoading(false);
    }
  }

  const filteredFinancial = financial.filter((item) => {
    const text = search.toLowerCase();

    return (
      item.description?.toLowerCase().includes(text) ||
      item.category?.toLowerCase().includes(text) ||
      item.type?.toLowerCase().includes(text)
    );
  });

  const totals = useMemo(() => {
    const entries = financial
      .filter((item) => item.type === 'ENTRY')
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    const outputs = financial
      .filter((item) => item.type === 'OUTPUT')
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    return {
      entries,
      outputs,
      profit: entries - outputs,
      count: financial.length,
    };
  }, [financial]);

  return (
    <Layout>
      <PageHeader
        title="Financeiro"
        description="Controle de entradas, saídas e resultado financeiro da RJ Chopp."
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialCard
          title="Entradas"
          value={formatCompactMoney(totals.entries)}
          fullValue={formatMoney(totals.entries)}
          icon={TrendingUp}
          tone="green"
        />

        <FinancialCard
          title="Saídas"
          value={formatCompactMoney(totals.outputs)}
          fullValue={formatMoney(totals.outputs)}
          icon={TrendingDown}
          tone="red"
        />

        <FinancialCard
          title="Lucro"
          value={formatCompactMoney(totals.profit)}
          fullValue={formatMoney(totals.profit)}
          icon={Wallet}
          tone={totals.profit >= 0 ? 'green' : 'red'}
        />

        <FinancialCard
          title="Lançamentos"
          value={totals.count}
          icon={DollarSign}
        />
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
          />

          <input
            placeholder="Pesquisar por descrição, categoria ou tipo..."
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
          Novo Lançamento
        </button>
      </div>

      <PremiumPanel>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
                <th className="p-5">Descrição</th>
                <th className="p-5">Categoria</th>
                <th className="p-5">Tipo</th>
                <th className="p-5">Valor</th>
                <th className="p-5">Data</th>
                <th className="p-5">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredFinancial.map((item) => {
                const isEntry = item.type === 'ENTRY';

                return (
                  <tr
                    key={item.id}
                    className="border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035]"
                  >
                    <td className="p-5">
                      <p className="font-black text-white">
                        {item.description}
                      </p>

                      <p className="mt-1 text-xs font-medium text-zinc-500">
                        ID: {String(item.id || '').slice(0, 8)}
                      </p>
                    </td>

                    <td className="p-5 text-zinc-400">
                      {item.category || '-'}
                    </td>

                    <td className="p-5">
                      {isEntry ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/15 px-4 py-2 text-sm font-black text-green-400">
                          <TrendingUp size={16} />
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/15 px-4 py-2 text-sm font-black text-red-400">
                          <TrendingDown size={16} />
                          Saída
                        </span>
                      )}
                    </td>

                    <td
                      className={`p-5 font-black ${
                        isEntry ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatMoney(item.amount)}
                    </td>

                    <td className="p-5 text-zinc-400">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="p-5">
                      <button
                        onClick={() => deleteFinancial(item)}
                        className="rounded-xl border border-red-500/25 bg-red-500/15 p-3 text-red-400 transition hover:bg-red-500 hover:text-white"
                        title="Apagar lançamento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredFinancial.length === 0 && (
                <tr>
                  <td
                    className="p-6 text-zinc-500"
                    colSpan={6}
                  >
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumPanel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Financeiro
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    Novo Lançamento
                  </h2>

                  <p className="mt-2 text-sm font-medium text-zinc-400">
                    Registre uma entrada ou saída financeira.
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

              <form
                onSubmit={saveFinancial}
                className="space-y-4"
              >
                <Field label="Descrição">
                  <input
                    name="description"
                    placeholder="Descrição"
                    className={inputClass}
                  />
                </Field>

                <Field label="Categoria">
                  <input
                    name="category"
                    placeholder="Categoria"
                    className={inputClass}
                  />
                </Field>

                <Field label="Valor">
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    placeholder="Valor"
                    className={inputClass}
                  />
                </Field>

                <Field label="Tipo">
                  <select
                    name="type"
                    className={inputClass}
                  >
                    <option value="ENTRY">
                      Entrada
                    </option>

                    <option value="OUTPUT">
                      Saída
                    </option>
                  </select>
                </Field>

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Lançamento'}
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