import { useEffect, useMemo, useState } from 'react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

export default function ReturnsPage() {
  const [orders, setOrders] = useState<any[]>([]);

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

  async function loadOrders() {
    const response = await api.get('/orders', authHeaders());
    setOrders(response.data);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const returnOrders = useMemo(() => {
    return orders.filter((order) => order.returnDate);
  }, [orders]);

  const todayReturns = useMemo(() => {
    return returnOrders.filter((order) => order.returnDate === today);
  }, [returnOrders, today]);

  const lateReturns = useMemo(() => {
    return returnOrders.filter(
      (order) =>
        order.returnDate < today &&
        order.status !== 'FINALIZADO' &&
        order.status !== 'RETIRADO'
    );
  }, [returnOrders, today]);

  return (
    <Layout>
      <PageHeader
        title="Agenda de Retirada"
        description="Controle de busca de cascos, barris e chopeiras"
      />

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card title="Para buscar hoje" value={todayReturns.length} />
        <Card title="Atrasados" value={lateReturns.length} />
        <Card title="Total agendado" value={returnOrders.length} />
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[950px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">Cliente</th>
              <th className="p-5">Telefone</th>
              <th className="p-5">Endereço</th>
              <th className="p-5">Data de busca</th>
              <th className="p-5">Itens</th>
              <th className="p-5">Status</th>
            </tr>
          </thead>

          <tbody>
            {returnOrders.map((order) => (
              <tr key={order.id} className="border-t border-zinc-800">
                <td className="p-5 font-bold">
                  {order.client?.name || 'Cliente'}
                </td>

                <td className="p-5 text-zinc-400">
                  {order.client?.phone || '-'}
                </td>

                <td className="p-5 text-zinc-400">
                  {order.client?.address || '-'}
                </td>

                <td className="p-5 text-yellow-400 font-black">
                  {order.returnDate}
                </td>

                <td className="p-5 text-zinc-400">
                  {order.returnItems || 'Itens não informados'}
                </td>

                <td className="p-5">
                  {order.returnDate < today ? (
                    <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                      Atrasado
                    </span>
                  ) : order.returnDate === today ? (
                    <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold">
                      Buscar hoje
                    </span>
                  ) : (
                    <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-bold">
                      Agendado
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {returnOrders.length === 0 && (
              <tr>
                <td className="p-5 text-zinc-500" colSpan={6}>
                  Nenhuma retirada agendada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}