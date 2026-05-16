import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

export default function FinancialPage() {
  const [financial, setFinancial] = useState<any[]>([]);
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

  async function loadFinancial() {
    const response = await api.get(
      '/financial',
      authHeaders()
    );

    setFinancial(response.data);
  }

  useEffect(() => {
    loadFinancial();
  }, []);

  async function saveFinancial(event: any) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const data = {
      description: String(form.get('description')),
      amount: Number(form.get('amount')),
      category: String(form.get('category')),
      type: String(form.get('type')),
    };

    await api.post(
      '/financial',
      data,
      authHeaders()
    );

    setShowModal(false);

    loadFinancial();
  }

  const totals = useMemo(() => {
    const input = financial
      .filter((item) => item.type === 'INPUT')
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    const output = financial
      .filter((item) => item.type === 'OUTPUT')
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    return {
      input,
      output,
      profit: input - output,
    };
  }, [financial]);

  return (
    <Layout>
      <PageHeader
        title="Financeiro"
        description="Controle financeiro da RJ Chopp"
      />

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card
          title="Entradas"
          value={`R$ ${totals.input}`}
        />

        <Card
          title="Saídas"
          value={`R$ ${totals.output}`}
        />

        <Card
          title="Lucro"
          value={`R$ ${totals.profit}`}
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
        <table className="w-full min-w-[850px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">Descrição</th>
              <th className="p-5">Categoria</th>
              <th className="p-5">Tipo</th>
              <th className="p-5">Valor</th>
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
                  {item.type === 'INPUT' ? (
                    <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                      Entrada
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                      Saída
                    </span>
                  )}
                </td>

                <td className="p-5 text-yellow-400 font-black">
                  R$ {item.amount}
                </td>
              </tr>
            ))}

            {financial.length === 0 && (
              <tr>
                <td
                  className="p-5 text-zinc-500"
                  colSpan={4}
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
                name="amount"
                placeholder="Valor"
                className={inputClass}
              />

              <select
                name="type"
                className={inputClass}
              >
                <option value="INPUT">
                  Entrada
                </option>

                <option value="OUTPUT">
                  Saída
                </option>
              </select>

              <button className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black">
                Salvar
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