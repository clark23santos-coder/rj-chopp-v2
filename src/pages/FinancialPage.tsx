import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

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

function FinancialCard({ title, value, fullValue }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 min-h-[130px] flex flex-col justify-between overflow-hidden">
      <p className="text-zinc-300 font-bold text-sm md:text-base">
        {title}
      </p>

      <div>
        <p className="font-black text-white leading-none text-2xl md:text-3xl">
          {value}
        </p>

        {fullValue && (
          <p className="text-xs text-zinc-500 mt-3 truncate">
            {fullValue}
          </p>
        )}
      </div>
    </div>
  );
}

export default function FinancialPage() {
  const [financial, setFinancial] = useState<any[]>([]);
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

      alert('Lançamento apagado com sucesso.');
    } catch (error) {
      console.log('Erro ao apagar lançamento:', error);
      alert('Não foi possível apagar esse lançamento.');
    } finally {
      setLoading(false);
    }
  }

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
    };
  }, [financial]);

  return (
    <Layout>
      <PageHeader
        title="Financeiro"
        description="Controle financeiro da RJ Chopp"
      />

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <FinancialCard
          title="Entradas"
          value={formatCompactMoney(totals.entries)}
          fullValue={formatMoney(totals.entries)}
        />

        <FinancialCard
          title="Saídas"
          value={formatCompactMoney(totals.outputs)}
          fullValue={formatMoney(totals.outputs)}
        />

        <FinancialCard
          title="Lucro"
          value={formatCompactMoney(totals.profit)}
          fullValue={formatMoney(totals.profit)}
        />
      </div>

      <div className="flex justify-end mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Lançamento
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[950px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">Descrição</th>
              <th className="p-5">Categoria</th>
              <th className="p-5">Tipo</th>
              <th className="p-5">Valor</th>
              <th className="p-5">Data</th>
              <th className="p-5">Ações</th>
            </tr>
          </thead>

          <tbody>
            {financial.map((item) => (
              <tr
                key={item.id}
                className="border-t border-zinc-800"
              >
                <td className="p-5 font-bold">
                  {item.description}
                </td>

                <td className="p-5 text-zinc-400">
                  {item.category}
                </td>

                <td className="p-5">
                  {item.type === 'ENTRY' ? (
                    <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                      Entrada
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                      Saída
                    </span>
                  )}
                </td>

                <td
                  className={`p-5 font-black ${
                    item.type === 'ENTRY'
                      ? 'text-green-400'
                      : 'text-red-400'
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
                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-3 rounded-xl"
                    title="Apagar lançamento"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {financial.length === 0 && (
              <tr>
                <td
                  className="p-5 text-zinc-500"
                  colSpan={6}
                >
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              Novo Lançamento
            </h2>

            <form
              onSubmit={saveFinancial}
              className="space-y-4"
            >
              <input
                name="description"
                placeholder="Descrição"
                className={inputClass}
              />

              <input
                name="category"
                placeholder="Categoria"
                className={inputClass}
              />

              <input
                type="number"
                step="0.01"
                name="amount"
                placeholder="Valor"
                className={inputClass}
              />

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

              <button
                disabled={loading}
                className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
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
