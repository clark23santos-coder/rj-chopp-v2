import { useEffect, useMemo, useState } from 'react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

export default function ReceivablesPage() {
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
    const response = await api.get(
      '/orders',
      authHeaders()
    );

    setOrders(response.data);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function receivePayment(orderId: string) {
    await api.patch(
      `/orders/${orderId}/receive`,
      {},
      authHeaders()
    );

    loadOrders();
  }

  const receivables = useMemo(() => {
    return orders.filter(
      (order) =>
        order.paymentMethod === 'FIADO' &&
        order.status !== 'PAGO'
    );
  }, [orders]);

  const totalReceivable = useMemo(() => {
    return receivables.reduce(
      (total, order) =>
        total + Number(order.total || 0),
      0
    );
  }, [receivables]);

  return (
    <Layout>
      <PageHeader
        title="Contas a Receber"
        description="Controle de fiado e pagamentos pendentes"
      />

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card
          title="Clientes devendo"
          value={receivables.length}
        />

        <Card
          title="Total a receber"
          value={`R$ ${totalReceivable}`}
        />
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">Cliente</th>
              <th className="p-5">Telefone</th>
              <th className="p-5">Endereço</th>
              <th className="p-5">Valor</th>
              <th className="p-5">Status</th>
              <th className="p-5">Ação</th>
            </tr>
          </thead>

          <tbody>
            {receivables.map((order) => (
              <tr
                key={order.id}
                className="border-t border-zinc-800"
              >
                <td className="p-5 font-bold">
                  {order.client?.name}
                </td>

                <td className="p-5 text-zinc-400">
                  {order.client?.phone || '-'}
                </td>

                <td className="p-5 text-zinc-400">
                  {order.client?.address || '-'}
                </td>

                <td className="p-5 text-yellow-400 font-black">
                  R$ {order.total}
                </td>

                <td className="p-5">
                  <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                    Em aberto
                  </span>
                </td>

                <td className="p-5">
                  <button
                    onClick={() =>
                      receivePayment(order.id)
                    }
                    className="bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-2xl px-5 py-3 font-bold"
                  >
                    Receber Pagamento
                  </button>
                </td>
              </tr>
            ))}

            {receivables.length === 0 && (
              <tr>
                <td
                  className="p-5 text-zinc-500"
                  colSpan={6}
                >
                  Nenhuma conta pendente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}