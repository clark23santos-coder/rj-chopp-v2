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

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function DashboardCard({ title, value, money = false }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 min-h-[140px] flex flex-col justify-between overflow-hidden">
      <p className="text-zinc-300 font-bold text-base">
        {title}
      </p>

      <p
        className={`font-black text-white leading-tight break-words ${
          money ? 'text-3xl md:text-4xl' : 'text-5xl'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any[]>([]);
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
    } catch (error) {
      console.log('Erro ao carregar dashboard:', error);

      setProducts([]);
      setClients([]);
      setOrders([]);
      setFinancial([]);
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

    return {
      revenue,
      expenses,
      profit,
      receivable,
      lowStock,
    };
  }, [orders, financial, products]);

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

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Produtos" value={products.length} />
        <DashboardCard title="Clientes" value={clients.length} />
        <DashboardCard title="Pedidos" value={orders.length} />
        <DashboardCard title="Estoque baixo" value={totals.lowStock} />
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Receita"
          value={formatMoney(totals.revenue)}
          money
        />

        <DashboardCard
          title="Despesas"
          value={formatMoney(totals.expenses)}
          money
        />

        <DashboardCard
          title="Lucro"
          value={formatMoney(totals.profit)}
          money
        />

        <DashboardCard
          title="Fiado"
          value={formatMoney(totals.receivable)}
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

      <div className="grid md:grid-cols-2 gap-6">
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