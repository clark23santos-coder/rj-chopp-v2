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

import {
  AlertTriangle,
  CalendarDays,
  Package,
  Users,
  ClipboardList,
  Boxes,
  Truck,
  Wallet,
  Receipt,
  TrendingUp,
  HandCoins,
  ArrowRight,
} from 'lucide-react';

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

  if (!deliveryDate) return false;
  if (status !== 'PENDING') return false;

  return deliveryDate < getToday();
}

function isTodayOrder(order: any) {
  const status = String(order.status || '').toUpperCase();
  const meta = getOrderMeta(order.id);
  const deliveryDate = String(meta.deliveryDate || order.deliveryDate || '');

  if (!deliveryDate) return false;
  if (status !== 'PENDING') return false;

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

function DashboardCard({
  title,
  value,
  money = false,
  fullValue,
  icon: Icon,
  tone = 'yellow',
}: any) {
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
          <p
            className={`font-black leading-none text-white ${
              money ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'
            }`}
          >
            {value}
          </p>

          {money && fullValue && (
            <p className="mt-3 truncate text-xs font-medium text-zinc-500">
              {fullValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PremiumPanel({ title, children, icon: Icon, tone = 'yellow' }: any) {
  const titleColor = tone === 'red' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/50 p-6 shadow-[0_0_38px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.11),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.055),transparent_38%,rgba(250,204,21,.035))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative">
        <div className="mb-6 flex items-center gap-3">
          {Icon && (
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
              <Icon size={24} />
            </div>
          )}

          <h2 className={`text-2xl font-black ${titleColor}`}>
            {title}
          </h2>
        </div>

        {children}
      </div>
    </div>
  );
}

function AlertBox({ type, title, description, href, buttonText }: any) {
  const isRed = type === 'red';

  return (
    <div
      className={`relative mb-8 overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl ${
        isRed
          ? 'border-red-500/35 bg-red-500/12'
          : 'border-yellow-400/35 bg-yellow-400/12'
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isRed
            ? 'bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,.18),transparent_35%)]'
            : 'bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,.18),transparent_35%)]'
        }`}
      />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-2xl p-4 text-white ${
              isRed ? 'bg-red-500' : 'bg-yellow-400 text-black'
            }`}
          >
            {isRed ? <AlertTriangle size={32} /> : <CalendarDays size={32} />}
          </div>

          <div>
            <h2 className={`text-2xl font-black ${isRed ? 'text-red-400' : 'text-yellow-400'}`}>
              {title}
            </h2>

            <p className="mt-1 font-bold text-zinc-300">
              {description}
            </p>
          </div>
        </div>

        {href && (
          <a
            href={href}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-center font-black transition hover:scale-[1.02] ${
              isRed
                ? 'bg-red-500 text-white'
                : 'bg-yellow-400 text-black'
            }`}
          >
            {buttonText}
            <ArrowRight size={20} />
          </a>
        )}
      </div>
    </div>
  );
}

function ListItem({ children, danger = false }: any) {
  return (
    <div
      className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
        danger
          ? 'border-red-500/25 bg-red-500/10'
          : 'border-yellow-500/10 bg-black/45 hover:border-yellow-400/25'
      }`}
    >
      {children}
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
        description="Visão geral da operação, estoque, pedidos, retiradas e financeiro da RJ Chopp."
      />

      {loading && (
        <div className="mb-8 rounded-[2rem] border border-yellow-500/15 bg-black/45 p-6 backdrop-blur-xl">
          <p className="font-bold text-zinc-400">
            Carregando informações...
          </p>
        </div>
      )}

      {totals.lateOrders > 0 && (
        <AlertBox
          type="red"
          title={`Atenção: ${totals.lateOrders} pedido(s) atrasado(s)`}
          description="Existem pedidos pendentes com data de entrega vencida."
          href="/pedidos"
          buttonText="Ver pedidos"
        />
      )}

      {totals.lateWithdrawals > 0 && (
        <AlertBox
          type="red"
          title={`Atenção: ${totals.lateWithdrawals} retirada(s) atrasada(s)`}
          description="Existem itens que já deveriam ter sido buscados. Confira Retiradas ou Mapa."
          href="/retiradas"
          buttonText="Ver retiradas"
        />
      )}

      {totals.todayWithdrawals > 0 && (
        <AlertBox
          type="yellow"
          title={`Hoje tem ${totals.todayWithdrawals} retirada(s) para buscar`}
          description="Confira a agenda de retiradas para não deixar nenhum item para trás."
          href="/retiradas"
          buttonText="Abrir retiradas"
        />
      )}

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-6">
        <DashboardCard title="Produtos" value={products.length} icon={Package} />
        <DashboardCard title="Clientes" value={clients.length} icon={Users} />
        <DashboardCard title="Pedidos" value={orders.length} icon={ClipboardList} />
        <DashboardCard title="Estoque baixo" value={totals.lowStock} icon={Boxes} tone={totals.lowStock > 0 ? 'red' : 'yellow'} />
        <DashboardCard title="Pedidos atrasados" value={totals.lateOrders} icon={AlertTriangle} tone={totals.lateOrders > 0 ? 'red' : 'yellow'} />
        <DashboardCard title="Retiradas atrasadas" value={totals.lateWithdrawals} icon={Truck} tone={totals.lateWithdrawals > 0 ? 'red' : 'yellow'} />
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <DashboardCard
          title="Receita"
          value={formatCompactMoney(totals.revenue)}
          fullValue={formatMoney(totals.revenue)}
          money
          icon={Wallet}
          tone="green"
        />

        <DashboardCard
          title="Despesas"
          value={formatCompactMoney(totals.expenses)}
          fullValue={formatMoney(totals.expenses)}
          money
          icon={Receipt}
          tone="red"
        />

        <DashboardCard
          title="Lucro"
          value={formatCompactMoney(totals.profit)}
          fullValue={formatMoney(totals.profit)}
          money
          icon={TrendingUp}
          tone={totals.profit >= 0 ? 'green' : 'red'}
        />

        <DashboardCard
          title="Fiado"
          value={formatCompactMoney(totals.receivable)}
          fullValue={formatMoney(totals.receivable)}
          money
          icon={HandCoins}
          tone="yellow"
        />
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <PremiumPanel title="Financeiro" icon={Wallet}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChart}>
                <XAxis dataKey="name" stroke="#d4d4d8" />
                <YAxis stroke="#d4d4d8" />
                <Tooltip
                  formatter={(value: any) => formatMoney(Number(value))}
                  contentStyle={{
                    background: '#050505',
                    border: '1px solid rgba(250, 204, 21, .25)',
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 0 35px rgba(245, 158, 11, .14)',
                  }}
                />
                <Bar dataKey="valor" fill="#facc15" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PremiumPanel>

        <PremiumPanel title="Operação" icon={ClipboardList}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={112}
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
                    background: '#050505',
                    border: '1px solid rgba(250, 204, 21, .25)',
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 0 35px rgba(245, 158, 11, .14)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </PremiumPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <PremiumPanel title="Últimos pedidos" icon={ClipboardList}>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <ListItem key={order.id}>
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-black text-white">
                      {order.client?.name || 'Cliente não informado'}
                    </p>

                    <p className="text-sm text-zinc-400">
                      Status: {order.status || 'Pendente'}
                    </p>
                  </div>

                  <p className="text-lg font-black text-yellow-400">
                    {formatMoney(Number(order.total || 0))}
                  </p>
                </div>
              </ListItem>
            ))}

            {recentOrders.length === 0 && (
              <p className="text-zinc-500">
                Nenhum pedido cadastrado ainda.
              </p>
            )}
          </div>
        </PremiumPanel>

        <PremiumPanel title="Pedidos atrasados" icon={AlertTriangle} tone="red">
          <div className="space-y-4">
            {lateOrdersList.map((order) => {
              const meta = getOrderMeta(order.id);

              return (
                <ListItem key={order.id} danger>
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-black text-white">
                        {order.client?.name || 'Cliente não informado'}
                      </p>

                      <p className="text-sm text-zinc-400">
                        Entrega: {formatDate(meta.deliveryDate || order.deliveryDate)}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {order.client?.address || '-'}
                      </p>
                    </div>

                    <AlertTriangle size={24} className="shrink-0 text-red-400" />
                  </div>
                </ListItem>
              );
            })}

            {lateOrdersList.length === 0 && (
              <p className="text-zinc-500">
                Nenhum pedido atrasado.
              </p>
            )}
          </div>
        </PremiumPanel>

        <PremiumPanel title="Retiradas atrasadas" icon={Truck} tone="red">
          <div className="space-y-4">
            {lateWithdrawalsList.map((item) => (
              <ListItem key={item.id} danger>
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-black text-white">
                      {item.client || 'Cliente não informado'}
                    </p>

                    <p className="text-sm text-zinc-400">
                      Buscar: {formatDate(item.pickupDate)}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {item.item || '-'}
                    </p>
                  </div>

                  <AlertTriangle size={24} className="shrink-0 text-red-400" />
                </div>
              </ListItem>
            ))}

            {lateWithdrawalsList.length === 0 && (
              <p className="text-zinc-500">
                Nenhuma retirada atrasada.
              </p>
            )}
          </div>
        </PremiumPanel>

        <PremiumPanel title="Estoque baixo" icon={Boxes}>
          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <ListItem key={product.id}>
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-black text-white">
                      {product.name}
                    </p>

                    <p className="text-sm text-zinc-400">
                      Mínimo: {product.minimumStock} {product.unit}
                    </p>
                  </div>

                  <p className="text-lg font-black text-red-400">
                    {product.stock} {product.unit}
                  </p>
                </div>
              </ListItem>
            ))}

            {lowStockProducts.length === 0 && (
              <p className="text-zinc-500">
                Nenhum produto com estoque baixo.
              </p>
            )}
          </div>
        </PremiumPanel>
      </div>
    </Layout>
  );
}