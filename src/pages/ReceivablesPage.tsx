import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Eye } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

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

export default function ReceivablesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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

  async function loadOrders() {
    try {
      const response = await api.get('/orders', authHeaders());
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log('Erro ao carregar contas a receber:', error);
      setOrders([]);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function receivePayment(order: any) {
    const confirmReceive = window.confirm(
      `Confirmar pagamento do pedido de ${order.client?.name || 'cliente'} no valor de ${formatMoney(order.total)}?`
    );

    if (!confirmReceive) {
      return;
    }

    try {
      setLoading(true);

      await api.put(
        `/orders/${order.id}`,
        {
          status: 'FINISHED',
          paymentMethod: 'PAGO',
          total: Number(order.total || 0),
          note: order.note || '',
        },
        authHeaders()
      );

      await loadOrders();

      alert('Pagamento marcado como recebido.');
    } catch (error) {
      console.log('Erro ao receber pagamento:', error);
      alert('Não foi possível marcar esse pagamento como recebido.');
    } finally {
      setLoading(false);
    }
  }

  const receivables = useMemo(() => {
    return orders.filter((order) => {
      const payment = String(order.paymentMethod || '').toUpperCase();
      const status = String(order.status || '').toUpperCase();

      return (
        payment.includes('FIADO') &&
        status !== 'FINISHED' &&
        status !== 'CANCELLED' &&
        status !== 'CANCELED' &&
        status !== 'PAGO'
      );
    });
  }, [orders]);

  const paidFiado = useMemo(() => {
    return orders.filter((order) => {
      const payment = String(order.paymentMethod || '').toUpperCase();
      const status = String(order.status || '').toUpperCase();

      return (
        payment.includes('PAGO') ||
        (payment.includes('FIADO') && status === 'FINISHED')
      );
    });
  }, [orders]);

  const totalReceivable = useMemo(() => {
    return receivables.reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );
  }, [receivables]);

  const totalPaid = useMemo(() => {
    return paidFiado.reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );
  }, [paidFiado]);

  return (
    <Layout>
      <PageHeader
        title="Contas a Receber"
        description="Controle de fiado e pagamentos pendentes"
      />

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card
          title="Fiados em aberto"
          value={receivables.length}
        />

        <Card
          title="Total a receber"
          value={formatMoney(totalReceivable)}
        />

        <Card
          title="Fiados recebidos"
          value={paidFiado.length}
        />

        <Card
          title="Total recebido"
          value={formatMoney(totalPaid)}
        />
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">Cliente</th>
              <th className="p-5">Telefone</th>
              <th className="p-5">Endereço</th>
              <th className="p-5">Valor</th>
              <th className="p-5">Data</th>
              <th className="p-5">Status</th>
              <th className="p-5">Ações</th>
            </tr>
          </thead>

          <tbody>
            {receivables.map((order) => (
              <tr
                key={order.id}
                className="border-t border-zinc-800"
              >
                <td className="p-5 font-bold">
                  {order.client?.name || 'Cliente não informado'}
                </td>

                <td className="p-5 text-zinc-400">
                  {order.client?.phone || '-'}
                </td>

                <td className="p-5 text-zinc-400">
                  {order.client?.address || '-'}
                </td>

                <td className="p-5 text-yellow-400 font-black">
                  {formatMoney(order.total)}
                </td>

                <td className="p-5 text-zinc-400">
                  {formatDate(order.createdAt)}
                </td>

                <td className="p-5">
                  <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                    Em aberto
                  </span>
                </td>

                <td className="p-5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl"
                      title="Ver pedido"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      disabled={loading}
                      onClick={() => receivePayment(order)}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl px-4 py-3 font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Receber
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {receivables.length === 0 && (
              <tr>
                <td
                  className="p-5 text-zinc-500"
                  colSpan={7}
                >
                  Nenhuma conta pendente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              Detalhes do fiado
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm font-bold">
                  Cliente
                </p>
                <p className="text-xl font-black">
                  {selectedOrder.client?.name || 'Cliente não informado'}
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm font-bold">
                  Telefone
                </p>
                <p className="text-xl font-black">
                  {selectedOrder.client?.phone || '-'}
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm font-bold">
                  Endereço
                </p>
                <p className="text-xl font-black">
                  {selectedOrder.client?.address || '-'}
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm font-bold">
                  Valor
                </p>
                <p className="text-xl font-black text-yellow-400">
                  {formatMoney(selectedOrder.total)}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-6">
              <p className="text-zinc-500 text-sm font-bold mb-3">
                Produtos do pedido
              </p>

              <div className="space-y-3">
                {selectedOrder.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 border-b border-zinc-800 pb-3"
                  >
                    <div>
                      <p className="font-bold">
                        {item.product?.name || 'Produto'}
                      </p>
                      <p className="text-zinc-500 text-sm">
                        Quantidade: {item.quantity}
                      </p>
                    </div>

                    <p className="font-black text-yellow-400">
                      {formatMoney(item.total)}
                    </p>
                  </div>
                ))}

                {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                  <p className="text-zinc-500">
                    Nenhum item encontrado.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <button
                disabled={loading}
                onClick={() => receivePayment(selectedOrder)}
                className="flex-1 bg-green-500 text-white rounded-2xl py-4 font-black disabled:opacity-50"
              >
                Marcar como recebido
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-zinc-800 rounded-2xl py-4 font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}