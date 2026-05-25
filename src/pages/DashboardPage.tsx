import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { AlertTriangle, CalendarDays } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

const WITHDRAWALS_STORAGE_KEY = 'rjchopp_withdrawals';
const ORDER_META_STORAGE_KEY = 'rjchopp_order_meta';

function readStorage(key: string, fallback: any) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(value: any) {
  if (!value) return '-';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

function isLateWithdrawal(item: any) {
  const status = String(item.status || '').toUpperCase();
  if (!item.pickupDate || status === 'RETIRADO') return false;
  return String(item.pickupDate) < getToday();
}

function isTodayWithdrawal(item: any) {
  const status = String(item.status || '').toUpperCase();
  if (!item.pickupDate || status === 'RETIRADO') return false;
  return String(item.pickupDate) === getToday();
}

function getOrderMeta(orderId: string) {
  const meta = readStorage(ORDER_META_STORAGE_KEY, {});
  return meta[orderId] || {};
}

function isLateOrder(order: any) {
  const status = String(order.status || '').toUpperCase();
  const meta = getOrderMeta(order.id);
  const deliveryDate = String(meta.deliveryDate || order.deliveryDate || '');

  if (!deliveryDate) {
    return false;
  }

  if (status !== 'PENDING') {
    return false;
  }

  return deliveryDate < getToday();
}

function isTodayOrder(order: any) {
  const status = String(order.status || '').toUpperCase();
  const meta = getOrderMeta(order.id);
  const deliveryDate = String(meta.deliveryDate || order.deliveryDate || '');

  if (!deliveryDate) {
    return false;
  }

  if (status !== 'PENDING') {
    return false;
  }

  return deliveryDate === getToday();
}

function formatCompactMoney(value: number) {
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

function DashboardCard({ title, value, money = false, fullValue }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 min-h-[130px] flex flex-col justify-between overflow-hidden">
      <p className="text-zinc-300 font-bold text-sm md:text-base">
        {title}
      </p>

      <div>
        <p
          className={`font-black text-white leading-none ${
            money ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'
          }`}
        >
          {value}
        </p>

        {money && fullValue && (
          <p className="text-xs text-zinc-500 mt-3 truncate">
            {fullValue}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function loadData() {
    try {
      setLoading(true);

      const [
        productsResponse,
        clientsResponse,
        ordersResponse,
        financialResponse,
      ] = await Promise.all([
        api.get('/products', authHeaders()),
        api.get('/clients', authHeaders()),
        api.get('/orders', authHeaders()),
        api.get('/financial-transactions', authHeaders()),
      ]);

      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
      setClients(Array.isArray(clientsResponse.data) ? clientsResponse.data : []);
      setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
      setFinancial(Array.isArray(financialResponse.data) ? financialResponse.data : []);

      const withdrawalsData = readStorage(WITHDRAWALS_STORAGE_KEY, []);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (error) {
      console.log('Erro ao carregar dashboard:', error);

      setProducts([]);
      setClients([]);
      setOrders([]);
      setFinancial([]);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    const revenue = financial
      .filter((item) => item.type === 'ENTRY')
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const expenses = financial
      .filter((item) => item.type === 'OUTPUT')
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const receivable = orders
      .filter((order) => {
        const payment = String(order.paymentMethod || '').toUpperCase();
        const status = String(order.status || '').toUpperCase();

        return payment.includes('FIADO') && status !== 'FINISHED' && status !== 'CANCELED';
      })
      .reduce((total, order) => total + Number(order.total || 0), 0);

    const lowStock = products.filter((product) => {
      return Number(product.stock || 0) <= Number(product.minimumStock || 0);
    }).length;

    const profit = revenue - expenses;
    const lateWithdrawals = withdrawals.filter(isLateWithdrawal);
    const todayWithdrawals = withdrawals.filter(isTodayWithdrawal);
    const lateOrders = orders.filter(isLateOrder);
    const todayOrders = orders.filter(isTodayOrder);

    return {
      revenue,
      expenses,
      profit,
      receivable,
      lowStock,
      lateWithdrawals: lateWithdrawals.length,
      todayWithdrawals: todayWithdrawals.length,
      lateOrders: lateOrders.length,
      todayOrders: todayOrders.length,
    };
  }, [orders, financial, products, withdrawals]);

  const financialChart = [
    { name: 'Receita', valor: totals.revenue },
    { name: 'Despesas', valor: totals.expenses },
    { name: 'Lucro', valor: totals.profit },
    { name: 'Fiado', valor: totals.receivable },
  ];

  const orderStatusChart = [
    {
      name: 'Pedidos',
      value: orders.length,
    },
    {
      name: 'Fiado',
      value: orders.filter((order) =>
        String(order.paymentMethod || '').toUpperCase().includes('FIADO')
      ).length,
    },
    {
      name: 'Estoque baixo',
      value: totals.lowStock,
    },
  ];

  const lateWithdrawalsList = withdrawals.filter(isLateWithdrawal).slice(0, 5);
  const lateOrdersList = orders.filter(isLateOrder).slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  const lowStockProducts = products
    .filter((product) => {
      return Number(product.stock || 0) <= Number(product.minimumStock || 0);
    })
    .slice(0, 5);

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description="Visão real da RJ Chopp"
      />

      {loading && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <p className="text-zinc-400 font-bold">
            Carregando informações...
          </p>
        </div>
      )}

      {totals.lateOrders > 0 && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="bg-red-500 text-white rounded-2xl p-4">
                <AlertTriangle size={32} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-red-400">
                  Atenção: {totals.lateOrders} pedido(s) atrasado(s)
                </h2>

                <p className="text-zinc-300 font-bold mt-1">
                  Existem pedidos pendentes com data de entrega vencida.
                </p>
              </div>
            </div>

            <a
              href="/pedidos"
              className="bg-red-500 text-white rounded-2xl px-6 py-3 font-black text-center"
            >
              Ver pedidos
            </a>
          </div>
        </div>
      )}

      {totals.lateWithdrawals > 0 && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="bg-red-500 text-white rounded-2xl p-4">
                <AlertTriangle size={32} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-red-400">
                  Atenção: {totals.lateWithdrawals} retirada(s) atrasada(s)
                </h2>

                <p className="text-zinc-300 font-bold mt-1">
                  Existem itens que já deveriam ter sido buscados. Confira Retiradas ou Mapa.
                </p>
              </div>
            </div>

            <a
              href="/retiradas"
              className="bg-red-500 text-white rounded-2xl px-6 py-3 font-black text-center"
            >
              Ver retiradas
            </a>
          </div>
        </div>
      )}

      {totals.todayWithdrawals > 0 && (
        <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-3xl p-5 mb-8">
          <div className="flex items-center gap-3">
            <CalendarDays size={24} className="text-yellow-400" />
            <p className="font-black text-yellow-400">
              Hoje tem {totals.todayWithdrawals} retirada(s) para buscar.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-6 gap-6 mb-8">
        <DashboardCard title="Produtos" value={products.length} />
        <DashboardCard title="Clientes" value={clients.length} />
        <DashboardCard title="Pedidos" value={orders.length} />
        <DashboardCard title="Estoque baixo" value={totals.lowStock} />
        <DashboardCard title="Pedidos atrasados" value={totals.lateOrders} />
        <DashboardCard title="Retiradas atrasadas" value={totals.lateWithdrawals} />
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Receita"
          value={formatCompactMoney(totals.revenue)}
          fullValue={formatMoney(totals.revenue)}
          money
        />

        <DashboardCard
          title="Despesas"
          value={formatCompactMoney(totals.expenses)}
          fullValue={formatMoney(totals.expenses)}
          money
        />

        <DashboardCard
          title="Lucro"
          value={formatCompactMoney(totals.profit)}
          fullValue={formatMoney(totals.profit)}
          money
        />

        <DashboardCard
          title="Fiado"
          value={formatCompactMoney(totals.receivable)}
          fullValue={formatMoney(totals.receivable)}
          money
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-black mb-6 text-yellow-400">
            Financeiro
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChart}>
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip
                  formatter={(value: any) => formatMoney(Number(value))}
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="valor" fill="#facc15" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-black mb-6 text-yellow-400">
            Operação
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {orderStatusChart.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#facc15', '#22c55e', '#ef4444'][index]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-black mb-6 text-yellow-400">
            Últimos pedidos
          </h2>

          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-black">
                      {order.client?.name || 'Cliente não informado'}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Status: {order.status || 'Pendente'}
                    </p>
                  </div>

                  <p className="font-black text-yellow-400 text-lg">
                    {formatMoney(Number(order.total || 0))}
                  </p>
                </div>
              </div>
            ))}

            {recentOrders.length === 0 && (
              <p className="text-zinc-500">
                Nenhum pedido cadastrado ainda.
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-black mb-6 text-red-400">
            Pedidos atrasados
          </h2>

          <div className="space-y-4">
            {lateOrdersList.map((order) => {
              const meta = getOrderMeta(order.id);

              return (
                <div key={order.id} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-black">{order.client?.name || 'Cliente não informado'}</p>
                      <p className="text-sm text-zinc-400">Entrega: {formatDate(meta.deliveryDate || order.deliveryDate)}</p>
                      <p className="text-sm text-zinc-500 mt-1">{order.client?.address || '-'}</p>
                    </div>
                    <AlertTriangle size={24} className="text-red-400 shrink-0" />
                  </div>
                </div>
              );
            })}

            {lateOrdersList.length === 0 && (
              <p className="text-zinc-500">Nenhum pedido atrasado.</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-black mb-6 text-red-400">
            Retiradas atrasadas
          </h2>

          <div className="space-y-4">
            {lateWithdrawalsList.map((item) => (
              <div key={item.id} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-black">{item.client || 'Cliente não informado'}</p>
                    <p className="text-sm text-zinc-400">Buscar: {formatDate(item.pickupDate)}</p>
                    <p className="text-sm text-zinc-500 mt-1">{item.item || '-'}</p>
                  </div>
                  <AlertTriangle size={24} className="text-red-400 shrink-0" />
                </div>
              </div>
            ))}

            {lateWithdrawalsList.length === 0 && (
              <p className="text-zinc-500">Nenhuma retirada atrasada.</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-black mb-6 text-yellow-400">
            Produtos com estoque baixo
          </h2>

          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-black">
                      {product.name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Mínimo: {product.minimumStock} {product.unit}
                    </p>
                  </div>

                  <p className="font-black text-red-400 text-lg">
                    {product.stock} {product.unit}
                  </p>
                </div>
              </div>
            ))}

            {lowStockProducts.length === 0 && (
              <p className="text-zinc-500">
                Nenhum produto com estoque baixo.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}