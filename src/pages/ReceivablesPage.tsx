import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Eye,
  HandCoins,
  Wallet,
  Phone,
  MapPin,
  CalendarDays,
  User,
  Package,
  X,
  AlertTriangle,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';
import {
  CACHE_ORDERS_KEY,
  OFFLINE_ORDERS_KEY,
  addOfflineAction,
  cacheItems,
  getCachedItems,
  isOnline,
  mergeOfflineWithOnline,
  saveOfflineItem,
} from '../services/offline';

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

function InfoBox({ label, value, icon: Icon, highlight = false }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/15 bg-black/45 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.10),transparent_34%)]" />

      <div className="relative flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-2 text-yellow-400">
            <Icon size={18} />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-black text-zinc-500">
            {label}
          </p>

          <p
            className={`break-words text-xl font-black ${
              highlight ? 'text-yellow-400' : 'text-white'
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
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
      const onlineOrders = Array.isArray(response.data) ? response.data : [];

      cacheItems(CACHE_ORDERS_KEY, onlineOrders);
      setOrders(mergeOfflineWithOnline(OFFLINE_ORDERS_KEY, onlineOrders));
    } catch (error) {
      console.log('Erro ao carregar contas a receber:', error);
      setOrders(mergeOfflineWithOnline(OFFLINE_ORDERS_KEY, getCachedItems(CACHE_ORDERS_KEY)));
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

      const data = {
        status: 'FINISHED',
        paymentMethod: 'PAGO',
        total: Number(order.total || 0),
        note: order.note || '',
      };

      if (!isOnline()) {
        const offlineOrder = {
          ...order,
          ...data,
          offlinePending: true,
          offlineAction: 'RECEIVE_PAYMENT',
        };

        saveOfflineItem(OFFLINE_ORDERS_KEY, offlineOrder);

        addOfflineAction({
          type: 'RECEIVE_PAYMENT',
          title: `Receber fiado offline: ${order.client?.name || 'Cliente não informado'}`,
          payload: {
            id: order.id,
            data,
            config: authHeaders(),
          },
        });

        setOrders((current) =>
          current.map((item) => (item.id === order.id ? offlineOrder : item))
        );

        addAuditLog({
          area: 'Financeiro',
          action: 'FINISHED',
          title: `Fiado recebido offline: ${order.client?.name || 'Cliente não informado'}`,
          description: `Valor: ${formatMoney(order.total)}. Será sincronizado quando a internet voltar.`,
        });

        alert('Pagamento marcado offline. Quando a internet voltar, o sistema vai sincronizar.');
        return;
      }

      await api.put(
        `/orders/${order.id}`,
        data,
        authHeaders()
      );

      await loadOrders();

      addAuditLog({
        area: 'Financeiro',
        action: 'FINISHED',
        title: `Fiado recebido: ${order.client?.name || 'Cliente não informado'}`,
        description: `Pedido #${String(order.id || '').slice(0, 8).toUpperCase()}\nValor recebido: ${formatMoney(order.total)}\nPagamento marcado como PAGO.`,
      });

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
        description="Controle de fiado, pagamentos pendentes e valores recebidos."
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

      <PremiumPanel>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
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
                  className="border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035]"
                >
                  <td className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                        <User size={20} />
                      </div>

                      <div>
                        <p className="font-black text-white">
                          {order.client?.name || 'Cliente não informado'}
                        </p>

                        <p className="mt-1 text-xs font-medium text-zinc-500">
                          Pedido: #{String(order.id || '').slice(0, 8).toUpperCase()}
                        </p>

                        {order.offlinePending && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-black text-yellow-400">
                            <AlertTriangle size={13} />
                            Pendente de sincronizar
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-yellow-400" />
                      {order.client?.phone || '-'}
                    </div>
                  </td>

                  <td className="p-5 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-yellow-400" />
                      {order.client?.address || '-'}
                    </div>
                  </td>

                  <td className="p-5 font-black text-yellow-400">
                    {formatMoney(order.total)}
                  </td>

                  <td className="p-5 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-yellow-400" />
                      {formatDate(order.createdAt)}
                    </div>
                  </td>

                  <td className="p-5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/15 px-4 py-2 text-sm font-black text-red-400">
                      <AlertTriangle size={16} />
                      Em aberto
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                        title="Ver pedido"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        disabled={loading}
                        onClick={() => receivePayment(order)}
                        className="flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/15 px-4 py-3 font-black text-green-400 transition hover:bg-green-500 hover:text-white disabled:opacity-50"
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
                    className="p-6 text-zinc-500"
                    colSpan={7}
                  >
                    Nenhuma conta pendente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumPanel>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Contas a Receber
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    Detalhes do Fiado
                  </h2>

                  <p className="mt-2 text-sm font-medium text-zinc-400">
                    Pedido #{String(selectedOrder.id || '').slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-2xl border border-yellow-500/20 bg-black/45 p-3 text-zinc-300 transition hover:bg-yellow-400 hover:text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <InfoBox
                  label="Cliente"
                  value={selectedOrder.client?.name || 'Cliente não informado'}
                  icon={User}
                />

                <InfoBox
                  label="Telefone"
                  value={selectedOrder.client?.phone || '-'}
                  icon={Phone}
                />

                <InfoBox
                  label="Endereço"
                  value={selectedOrder.client?.address || '-'}
                  icon={MapPin}
                />

                <InfoBox
                  label="Valor"
                  value={formatMoney(selectedOrder.total)}
                  icon={Wallet}
                  highlight
                />
              </div>

              <div className="mb-6 rounded-[2rem] border border-yellow-500/15 bg-black/45 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-400">
                    <Package size={22} />
                  </div>

                  <h3 className="text-xl font-black text-yellow-400">
                    Produtos do pedido
                  </h3>
                </div>

                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 rounded-2xl border border-yellow-500/10 bg-black/45 p-4"
                    >
                      <div>
                        <p className="font-black text-white">
                          {item.product?.name || 'Produto'}
                        </p>

                        <p className="text-sm text-zinc-500">
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

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  disabled={loading}
                  onClick={() => receivePayment(selectedOrder)}
                  className="flex-1 rounded-2xl bg-green-500 py-4 font-black text-white transition hover:bg-green-400 disabled:opacity-50"
                >
                  Marcar como recebido
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}