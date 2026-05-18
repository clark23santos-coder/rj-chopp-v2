import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
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

function getProductDisplayName(product: any) {
  if (!product) {
    return 'Produto';
  }

  const name = String(product.name || '').trim();
  const brand = String(product.brand || '').trim();
  const category = String(product.category || '').trim();

  const parts = [name];

  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
    parts.push(brand);
  }

  if (category && !name.toLowerCase().includes(category.toLowerCase())) {
    parts.push(category);
  }

  return parts.filter(Boolean).join(' - ');
}

function getMonthKey(value: any) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthName(monthKey: string) {
  if (!monthKey) {
    return 'Todos os meses';
  }

  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

function changeMonth(monthKey: string, direction: number) {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1 + direction, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function ReportCard({ title, value, fullValue, money = false }: any) {
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

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

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
        ordersResponse,
        financialResponse,
        productsResponse,
        clientsResponse,
      ] = await Promise.all([
        api.get('/orders', authHeaders()),
        api.get('/financial-transactions', authHeaders()),
        api.get('/products', authHeaders()),
        api.get('/clients', authHeaders()),
      ]);

      setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
      setFinancial(Array.isArray(financialResponse.data) ? financialResponse.data : []);
      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
      setClients(Array.isArray(clientsResponse.data) ? clientsResponse.data : []);
    } catch (error) {
      console.log('Erro ao carregar relatórios:', error);

      setOrders([]);
      setFinancial([]);
      setProducts([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();

    orders.forEach((order) => {
      const key = getMonthKey(order.createdAt);
      if (key) months.add(key);
    });

    financial.forEach((item) => {
      const key = getMonthKey(item.createdAt);
      if (key) months.add(key);
    });

    months.add(getCurrentMonthKey());

    return Array.from(months).sort().reverse();
  }, [orders, financial]);

  const filteredOrders = useMemo(() => {
    if (!selectedMonth) {
      return orders;
    }

    return orders.filter((order) => getMonthKey(order.createdAt) === selectedMonth);
  }, [orders, selectedMonth]);

  const filteredFinancial = useMemo(() => {
    if (!selectedMonth) {
      return financial;
    }

    return financial.filter((item) => getMonthKey(item.createdAt) === selectedMonth);
  }, [financial, selectedMonth]);

  const totals = useMemo(() => {
    const revenue = filteredFinancial
      .filter((item) => item.type === 'ENTRY')
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const expenses = filteredFinancial
      .filter((item) => item.type === 'OUTPUT')
      .reduce((total, item) => total + Number(item.amount || 0), 0);

    const receivable = filteredOrders
      .filter((order) => {
        const payment = String(order.paymentMethod || '').toUpperCase();
        const status = String(order.status || '').toUpperCase();

        return payment.includes('FIADO') && status !== 'FINISHED' && status !== 'CANCELED';
      })
      .reduce((total, order) => total + Number(order.total || 0), 0);

    const lowStock = products.filter((product) => {
      return Number(product.stock || 0) <= Number(product.minimumStock || 0);
    }).length;

    return {
      revenue,
      expenses,
      receivable,
      profit: revenue - expenses,
      lowStock,
    };
  }, [filteredOrders, filteredFinancial, products]);

  const monthlyChart = useMemo(() => {
    const map: any = {};

    financial.forEach((item) => {
      const monthKey = getMonthKey(item.createdAt);

      if (!monthKey) {
        return;
      }

      if (!map[monthKey]) {
        map[monthKey] = {
          monthKey,
          month: getMonthName(monthKey),
          receita: 0,
          despesas: 0,
          lucro: 0,
        };
      }

      if (item.type === 'ENTRY') {
        map[monthKey].receita += Number(item.amount || 0);
      }

      if (item.type === 'OUTPUT') {
        map[monthKey].despesas += Number(item.amount || 0);
      }

      map[monthKey].lucro = map[monthKey].receita - map[monthKey].despesas;
    });

    const currentKey = getCurrentMonthKey();

    if (!map[currentKey]) {
      map[currentKey] = {
        monthKey: currentKey,
        month: getMonthName(currentKey),
        receita: 0,
        despesas: 0,
        lucro: 0,
      };
    }

    return Object.values(map)
      .sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey))
      .slice(-12)
      .map((item: any) => ({
        ...item,
        monthLabel: item.month
          .replace(' de ', '/')
          .replace('janeiro', 'jan')
          .replace('fevereiro', 'fev')
          .replace('março', 'mar')
          .replace('abril', 'abr')
          .replace('maio', 'mai')
          .replace('junho', 'jun')
          .replace('julho', 'jul')
          .replace('agosto', 'ago')
          .replace('setembro', 'set')
          .replace('outubro', 'out')
          .replace('novembro', 'nov')
          .replace('dezembro', 'dez'),
      }));
  }, [financial]);

  const soldProducts = useMemo(() => {
    const map: any = {};

    filteredOrders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const product =
          item.product ||
          products.find((productItem) => productItem.id === item.productId);

        const productName = getProductDisplayName(product);

        const category =
          product?.category ||
          item.product?.category ||
          'Sem categoria';

        const brand =
          product?.brand ||
          item.product?.brand ||
          '';

        const mapKey = `${productName}-${category}-${brand}`;

        if (!map[mapKey]) {
          map[mapKey] = {
            name: productName,
            category,
            brand,
            quantity: 0,
            total: 0,
          };
        }

        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || item.price || product?.salePrice || 0);
        const total = Number(item.total || quantity * unitPrice);

        map[mapKey].quantity += quantity;
        map[mapKey].total += total;
      });
    });

    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  }, [filteredOrders, products]);

  const barrelProducts = useMemo(() => {
    return soldProducts.filter((item: any) => {
      const text = `${item.name} ${item.category}`.toLowerCase();

      return (
        text.includes('barril') ||
        text.includes('chopp') ||
        text.includes('chope') ||
        text.includes('50l') ||
        text.includes('30l')
      );
    });
  }, [soldProducts]);

  const beverageProducts = useMemo(() => {
    return soldProducts.filter((item: any) => {
      const text = `${item.name} ${item.category}`.toLowerCase();

      return (
        text.includes('heineken') ||
        text.includes('coca') ||
        text.includes('refrigerante') ||
        text.includes('agua') ||
        text.includes('água') ||
        text.includes('cerveja') ||
        text.includes('bebida') ||
        text.includes('fardo')
      );
    });
  }, [soldProducts]);

  const expenses = useMemo(() => {
    return filteredFinancial.filter((item) => item.type === 'OUTPUT');
  }, [filteredFinancial]);

  const entries = useMemo(() => {
    return filteredFinancial.filter((item) => item.type === 'ENTRY');
  }, [filteredFinancial]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => {
      return Number(product.stock || 0) <= Number(product.minimumStock || 0);
    });
  }, [products]);

  const recentOrders = filteredOrders.slice(0, 10);

  function printReport() {
    window.print();
  }

  return (
    <Layout>
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm;
            }

            html,
            body {
              background: white !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden !important;
            }

            #print-report,
            #print-report * {
              visibility: visible !important;
            }

            aside,
            button,
            .no-print,
            .no-print * {
              display: none !important;
              visibility: hidden !important;
            }

            main {
              background: white !important;
              color: black !important;
              display: block !important;
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
            }

            #print-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              display: block !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              font-size: 8.5px !important;
              line-height: 1.12 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }

            #print-report h1 {
              font-size: 19px !important;
              line-height: 1 !important;
              margin: 0 0 2px 0 !important;
              letter-spacing: 2px !important;
            }

            #print-report h2 {
              font-size: 11px !important;
              line-height: 1 !important;
              margin: 4px 0 3px 0 !important;
            }

            #print-report p {
              margin: 0 !important;
            }

            #print-report .print-header {
              padding-bottom: 4px !important;
              margin-bottom: 5px !important;
            }

            #print-report .print-grid {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              gap: 3px !important;
              margin: 4px 0 !important;
              width: 100% !important;
            }

            #print-report .print-card {
              border: 1px solid #777 !important;
              padding: 3px !important;
              border-radius: 2px !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }

            #print-report .print-card-title {
              font-size: 7px !important;
              color: #555 !important;
              font-weight: 700 !important;
            }

            #print-report .print-card-value {
              font-size: 13px !important;
              line-height: 1 !important;
              font-weight: 900 !important;
              word-break: break-word !important;
              white-space: normal !important;
            }

            #print-report table {
              font-size: 7px !important;
              width: 100% !important;
              max-width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              margin-bottom: 4px !important;
              page-break-inside: auto !important;
            }

            #print-report th,
            #print-report td {
              padding: 1.5px 2px !important;
              border: 1px solid #999 !important;
              word-break: break-word !important;
              overflow-wrap: anywhere !important;
              vertical-align: top !important;
            }

            #print-report th {
              background: #f1f1f1 !important;
              font-weight: 900 !important;
            }

            #print-report tr {
              page-break-inside: avoid !important;
            }

            #print-report .print-section {
              margin-top: 4px !important;
              page-break-inside: avoid !important;
            }

            #print-report .print-chart {
              display: none !important;
            }

            #print-report .print-footer {
              margin-top: 4px !important;
              padding-top: 3px !important;
              font-size: 7px !important;
            }
          }
        `}
      </style>

      <div className="no-print">
        <PageHeader
          title="Relatórios"
          description="Relatórios financeiros e operacionais"
        />

        {loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
            <p className="text-zinc-400 font-bold">
              Carregando relatórios...
            </p>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8">
          <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-4 items-end">
            <div>
              <label className="block mb-2 text-sm font-bold text-zinc-300">
                Mês do relatório
              </label>

              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400"
              >
                <option value="">Todos os meses</option>

                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setSelectedMonth(changeMonth(selectedMonth || getCurrentMonthKey(), -1))}
              className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold"
            >
              Mês anterior
            </button>

            <button
              onClick={() => setSelectedMonth(getCurrentMonthKey())}
              className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold"
            >
              Mês atual
            </button>

            <button
              onClick={() => setSelectedMonth(changeMonth(selectedMonth || getCurrentMonthKey(), 1))}
              className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold"
            >
              Próximo mês
            </button>
          </div>

          <p className="text-zinc-500 mt-4">
            Mostrando relatório de: <strong className="text-yellow-400">{getMonthName(selectedMonth)}</strong>
          </p>
        </div>

        <div className="flex justify-end mb-8">
          <button
            onClick={printReport}
            className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black"
          >
            Imprimir / Salvar PDF
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <ReportCard
            title="Receita"
            value={formatCompactMoney(totals.revenue)}
            fullValue={formatMoney(totals.revenue)}
            money
          />

          <ReportCard
            title="Despesas"
            value={formatCompactMoney(totals.expenses)}
            fullValue={formatMoney(totals.expenses)}
            money
          />

          <ReportCard
            title="Lucro"
            value={formatCompactMoney(totals.profit)}
            fullValue={formatMoney(totals.profit)}
            money
          />

          <ReportCard
            title="Fiado"
            value={formatCompactMoney(totals.receivable)}
            fullValue={formatMoney(totals.receivable)}
            money
          />
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <ReportCard title="Pedidos" value={filteredOrders.length} />
          <ReportCard title="Clientes" value={clients.length} />
          <ReportCard title="Produtos" value={products.length} />
          <ReportCard title="Estoque baixo" value={totals.lowStock} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-black text-yellow-400 mb-2">
            Comparativo de lucro por mês
          </h2>

          <p className="text-zinc-500 mb-6">
            Comparação dos últimos 12 meses com receita, despesas e lucro.
          </p>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#a1a1aa"
                  fontSize={12}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickFormatter={(value) => formatCompactMoney(value)}
                />
                <Tooltip
                  formatter={(value: any) => formatMoney(value)}
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="#facc15" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        id="print-report"
        className="bg-white text-black rounded-3xl p-8"
      >
        <div className="print-header flex items-start justify-between border-b border-zinc-300 pb-3 mb-3">
          <div>
            <h1 className="text-4xl font-black">RJ CHOPP</h1>
            <p className="font-bold text-zinc-600">
              Relatório geral de vendas e operação
            </p>
            <p className="text-zinc-500">
              Período: {getMonthName(selectedMonth)}
            </p>
            <p className="text-zinc-500">
              Gerado em {new Date().toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold">Loanda - Paraná</p>
            <p>(44) 99958-8160</p>
          </div>
        </div>

        <div className="print-grid grid md:grid-cols-4 gap-4 mb-6">
          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Receita</p>
            <p className="print-card-value text-2xl font-black">{formatMoney(totals.revenue)}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Despesas</p>
            <p className="print-card-value text-2xl font-black">{formatMoney(totals.expenses)}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Lucro estimado</p>
            <p className="print-card-value text-2xl font-black">{formatMoney(totals.profit)}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Fiado</p>
            <p className="print-card-value text-2xl font-black">{formatMoney(totals.receivable)}</p>
          </div>
        </div>

        <div className="print-grid grid md:grid-cols-4 gap-4 mb-6">
          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Pedidos do período</p>
            <p className="print-card-value text-2xl font-black">{filteredOrders.length}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Clientes cadastrados</p>
            <p className="print-card-value text-2xl font-black">{clients.length}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Produtos cadastrados</p>
            <p className="print-card-value text-2xl font-black">{products.length}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="print-card-title text-zinc-500 font-bold">Itens vendidos</p>
            <p className="print-card-value text-2xl font-black">
              {soldProducts.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)}
            </p>
          </div>
        </div>

        <div className="print-section print-chart">
          <h2 className="text-2xl font-black mb-3">Comparativo mensal</h2>

          <table className="w-full border border-zinc-300 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Mês</th>
                <th className="p-3 border border-zinc-300">Receita</th>
                <th className="p-3 border border-zinc-300">Despesas</th>
                <th className="p-3 border border-zinc-300">Lucro</th>
              </tr>
            </thead>

            <tbody>
              {monthlyChart.map((item: any) => (
                <tr key={item.monthKey}>
                  <td className="p-3 border border-zinc-300">{item.month}</td>
                  <td className="p-3 border border-zinc-300">{formatMoney(item.receita)}</td>
                  <td className="p-3 border border-zinc-300">{formatMoney(item.despesas)}</td>
                  <td className="p-3 border border-zinc-300">{formatMoney(item.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="text-2xl font-black mb-3">Resumo financeiro</h2>

          <table className="w-full border border-zinc-300 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Tipo</th>
                <th className="p-3 border border-zinc-300">Quantidade</th>
                <th className="p-3 border border-zinc-300">Total</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="p-3 border border-zinc-300">Entradas</td>
                <td className="p-3 border border-zinc-300">{entries.length}</td>
                <td className="p-3 border border-zinc-300">{formatMoney(totals.revenue)}</td>
              </tr>

              <tr>
                <td className="p-3 border border-zinc-300">Saídas / Despesas</td>
                <td className="p-3 border border-zinc-300">{expenses.length}</td>
                <td className="p-3 border border-zinc-300">{formatMoney(totals.expenses)}</td>
              </tr>

              <tr>
                <td className="p-3 border border-zinc-300">Lucro estimado</td>
                <td className="p-3 border border-zinc-300">-</td>
                <td className="p-3 border border-zinc-300">{formatMoney(totals.profit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="text-2xl font-black mb-3">Últimos pedidos do período</h2>

          <table className="w-full border border-zinc-300 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Cliente</th>
                <th className="p-3 border border-zinc-300">Status</th>
                <th className="p-3 border border-zinc-300">Pagamento</th>
                <th className="p-3 border border-zinc-300">Total</th>
                <th className="p-3 border border-zinc-300">Data</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="p-3 border border-zinc-300">
                      {order.client?.name || 'Cliente não informado'}
                    </td>
                    <td className="p-3 border border-zinc-300">
                      {order.status || '-'}
                    </td>
                    <td className="p-3 border border-zinc-300">
                      {order.paymentMethod || '-'}
                    </td>
                    <td className="p-3 border border-zinc-300">
                      {formatMoney(order.total)}
                    </td>
                    <td className="p-3 border border-zinc-300">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border border-zinc-300" colSpan={5}>
                    Nenhum pedido registrado no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="text-2xl font-black mb-3">Barris / Chopp vendidos</h2>

          <table className="w-full border border-zinc-300 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Produto</th>
                <th className="p-3 border border-zinc-300">Quantidade</th>
                <th className="p-3 border border-zinc-300">Total</th>
              </tr>
            </thead>

            <tbody>
              {barrelProducts.length > 0 ? (
                barrelProducts.map((item: any) => (
                  <tr key={item.name}>
                    <td className="p-3 border border-zinc-300">{item.name}</td>
                    <td className="p-3 border border-zinc-300">{item.quantity}</td>
                    <td className="p-3 border border-zinc-300">{formatMoney(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border border-zinc-300" colSpan={3}>
                    Nenhum barril/chopp registrado no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="text-2xl font-black mb-3">Bebidas vendidas</h2>

          <table className="w-full border border-zinc-300 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Produto</th>
                <th className="p-3 border border-zinc-300">Quantidade</th>
                <th className="p-3 border border-zinc-300">Total</th>
              </tr>
            </thead>

            <tbody>
              {beverageProducts.length > 0 ? (
                beverageProducts.map((item: any) => (
                  <tr key={item.name}>
                    <td className="p-3 border border-zinc-300">{item.name}</td>
                    <td className="p-3 border border-zinc-300">{item.quantity}</td>
                    <td className="p-3 border border-zinc-300">{formatMoney(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border border-zinc-300" colSpan={3}>
                    Nenhuma bebida registrada no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="text-2xl font-black mb-3">Todas as vendas por produto</h2>

          <table className="w-full border border-zinc-300 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Produto</th>
                <th className="p-3 border border-zinc-300">Categoria</th>
                <th className="p-3 border border-zinc-300">Qtd</th>
                <th className="p-3 border border-zinc-300">Total</th>
              </tr>
            </thead>

            <tbody>
              {soldProducts.length > 0 ? (
                soldProducts.map((item: any) => (
                  <tr key={item.name}>
                    <td className="p-3 border border-zinc-300">{item.name}</td>
                    <td className="p-3 border border-zinc-300">{item.category}</td>
                    <td className="p-3 border border-zinc-300">{item.quantity}</td>
                    <td className="p-3 border border-zinc-300">{formatMoney(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border border-zinc-300" colSpan={4}>
                    Nenhum produto vendido no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="text-2xl font-black mb-3">Produtos com estoque baixo</h2>

          <table className="w-full border border-zinc-300 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Produto</th>
                <th className="p-3 border border-zinc-300">Categoria</th>
                <th className="p-3 border border-zinc-300">Estoque atual</th>
                <th className="p-3 border border-zinc-300">Estoque mínimo</th>
              </tr>
            </thead>

            <tbody>
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product: any) => (
                  <tr key={product.id}>
                    <td className="p-3 border border-zinc-300">{getProductDisplayName(product)}</td>
                    <td className="p-3 border border-zinc-300">{product.category || '-'}</td>
                    <td className="p-3 border border-zinc-300">
                      {product.stock} {product.unit}
                    </td>
                    <td className="p-3 border border-zinc-300">
                      {product.minimumStock} {product.unit}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border border-zinc-300" colSpan={4}>
                    Nenhum produto com estoque baixo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2 className="text-2xl font-black mb-3">Despesas do período</h2>

          <table className="w-full border border-zinc-300">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Descrição</th>
                <th className="p-3 border border-zinc-300">Categoria</th>
                <th className="p-3 border border-zinc-300">Valor</th>
                <th className="p-3 border border-zinc-300">Data</th>
              </tr>
            </thead>

            <tbody>
              {expenses.length > 0 ? (
                expenses.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 border border-zinc-300">{item.description}</td>
                    <td className="p-3 border border-zinc-300">{item.category}</td>
                    <td className="p-3 border border-zinc-300">{formatMoney(item.amount)}</td>
                    <td className="p-3 border border-zinc-300">{formatDate(item.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border border-zinc-300" colSpan={4}>
                    Nenhuma despesa registrada no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print-footer mt-5 border-t border-zinc-300 pt-3 text-zinc-500 text-sm">
          Relatório gerado pelo sistema RJ Chopp SGE
        </div>
      </div>
    </Layout>
  );
}
