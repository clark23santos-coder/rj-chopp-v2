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
import Card from '../components/Card';
import { api } from '../services/api';

export default function DashboardPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any[]>([]);

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
    const [
      productsResponse,
      clientsResponse,
      ordersResponse,
      financialResponse,
    ] = await Promise.all([
      api.get('/products', authHeaders()),
      api.get('/clients', authHeaders()),
      api.get('/orders', authHeaders()),
      api.get('/financial', authHeaders()),
    ]);

    setProducts(productsResponse.data);
    setClients(clientsResponse.data);
    setOrders(ordersResponse.data);
    setFinancial(financialResponse.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    const revenue = orders.reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );

    const expenses = financial
      .filter((item) => item.type === 'OUTPUT')
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const receivable = orders
      .filter(
        (order) =>
          order.paymentMethod === 'FIADO' &&
          order.status !== 'PAGO'
      )
      .reduce((total, order) => total + Number(order.total || 0), 0);

    const lowStock = products.filter(
      (product) =>
        Number(product.stock || 0) <= Number(product.minimumStock || 0)
    ).length;

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
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
      value: orders.filter(
        (order) => order.paymentMethod === 'FIADO'
      ).length,
    },
    {
      name: 'Estoque baixo',
      value: totals.lowStock,
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description="Visão real da RJ Chopp"
      />

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card title="Produtos" value={products.length} />
        <Card title="Clientes" value={clients.length} />
        <Card title="Pedidos" value={orders.length} />
        <Card title="Estoque baixo" value={totals.lowStock} />
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card title="Receita" value={`R$ ${totals.revenue}`} />
        <Card title="Despesas" value={`R$ ${totals.expenses}`} />
        <Card title="Lucro" value={`R$ ${totals.profit}`} />
        <Card title="Fiado" value={`R$ ${totals.receivable}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-black mb-6 text-yellow-400">
            Financeiro
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChart}>
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip />
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}