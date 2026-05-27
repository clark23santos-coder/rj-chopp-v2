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
import {
  Printer,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Wallet,
  Receipt,
  TrendingUp,
  HandCoins,
  ClipboardList,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const COMPANY_SETTINGS_STORAGE_KEY = 'rjchopp_company_settings';

const defaultCompanySettings = {
  companyName: 'RJ CHOPP',
  phone: '(44) 99958-8160',
  city: 'Loanda - Paraná',
  address: '',
  document: '',
  noteMessage: 'Obrigado pela preferência.',
  reportFooter: 'Relatório gerado pelo sistema RJ Chopp SGE',
};

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

function readStorage(key: string, fallback: any) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function getCompanySettings() {
  return {
    ...defaultCompanySettings,
    ...readStorage(COMPANY_SETTINGS_STORAGE_KEY, {}),
  };
}

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

function ReportCard({ title, value, fullValue, money = false, icon: Icon, tone = 'yellow' }: any) {
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

function PremiumPanel({ title, description, icon: Icon, children }: any) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/50 p-6 shadow-[0_0_38px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.05),transparent_38%,rgba(250,204,21,.035))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative">
        <div className="mb-6 flex items-start gap-3">
          {Icon && (
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
              <Icon size={24} />
            </div>
          )}

          <div>
            <h2 className="text-2xl font-black text-yellow-400">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {description}
              </p>
            )}
          </div>
        </div>

        {children}
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

  const companySettings = getCompanySettings();

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
          description="Relatórios financeiros, operacionais, produtos vendidos, estoque e impressão em PDF."
        />

        {loading && (
          <div className="mb-8 rounded-[2rem] border border-yellow-500/15 bg-black/45 p-6 backdrop-blur-xl">
            <p className="font-bold text-zinc-400">
              Carregando relatórios...
            </p>
          </div>
        )}

        <PremiumPanel
          title="Filtro do relatório"
          description="Escolha o mês desejado ou veja todos os meses."
          icon={CalendarDays}
        >
          <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <div>
              <label className="mb-2 block text-sm font-black text-yellow-200">
                Mês do relatório
              </label>

              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className={inputClass}
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
              className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
            >
              <ChevronLeft size={18} />
              Mês anterior
            </button>

            <button
              onClick={() => setSelectedMonth(getCurrentMonthKey())}
              className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
            >
              <RefreshCcw size={18} />
              Mês atual
            </button>

            <button
              onClick={() => setSelectedMonth(changeMonth(selectedMonth || getCurrentMonthKey(), 1))}
              className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
            >
              Próximo mês
              <ChevronRight size={18} />
            </button>

            <button
              onClick={printReport}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(250,204,21,.35)]"
            >
              <Printer size={18} />
              Imprimir / PDF
            </button>
          </div>

          <p className="mt-4 text-zinc-500">
            Mostrando relatório de:{' '}
            <strong className="text-yellow-400">
              {getMonthName(selectedMonth)}
            </strong>
          </p>
        </PremiumPanel>

        <div className="mb-8 mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard
            title="Receita"
            value={formatCompactMoney(totals.revenue)}
            fullValue={formatMoney(totals.revenue)}
            money
            icon={Wallet}
            tone="green"
          />

          <ReportCard
            title="Despesas"
            value={formatCompactMoney(totals.expenses)}
            fullValue={formatMoney(totals.expenses)}
            money
            icon={Receipt}
            tone="red"
          />

          <ReportCard
            title="Lucro"
            value={formatCompactMoney(totals.profit)}
            fullValue={formatMoney(totals.profit)}
            money
            icon={TrendingUp}
            tone={totals.profit >= 0 ? 'green' : 'red'}
          />

          <ReportCard
            title="Fiado"
            value={formatCompactMoney(totals.receivable)}
            fullValue={formatMoney(totals.receivable)}
            money
            icon={HandCoins}
          />
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <ReportCard title="Pedidos" value={filteredOrders.length} icon={ClipboardList} />
          <ReportCard title="Clientes" value={clients.length} icon={Users} />
          <ReportCard title="Produtos" value={products.length} icon={Package} />
          <ReportCard title="Estoque baixo" value={totals.lowStock} icon={AlertTriangle} tone={totals.lowStock > 0 ? 'red' : 'yellow'} />
        </div>

        <PremiumPanel
          title="Comparativo de lucro por mês"
          description="Comparação dos últimos 12 meses com receita, despesas e lucro."
          icon={TrendingUp}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(250,204,21,.12)" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#d4d4d8"
                  fontSize={12}
                />
                <YAxis
                  stroke="#d4d4d8"
                  fontSize={12}
                  tickFormatter={(value) => formatCompactMoney(value)}
                />
                <Tooltip
                  formatter={(value: any) => formatMoney(value)}
                  contentStyle={{
                    background: '#050505',
                    border: '1px solid rgba(250, 204, 21, .25)',
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 0 35px rgba(245, 158, 11, .14)',
                  }}
                />
                <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[10, 10, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[10, 10, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="#facc15" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PremiumPanel>
      </div>

      <div
        id="print-report"
        className="bg-white text-black rounded-3xl p-8"
      >
        <div className="print-header flex items-start justify-between border-b border-zinc-300 pb-3 mb-3">
          <div>
            <h1 className="text-4xl font-black">
              {companySettings.companyName || 'RJ CHOPP'}
            </h1>

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
            <p className="font-bold">
              {companySettings.city || 'Loanda - Paraná'}
            </p>

            {companySettings.phone && (
              <p>{companySettings.phone}</p>
            )}

            {companySettings.address && (
              <p>{companySettings.address}</p>
            )}

            {companySettings.document && (
              <p>{companySettings.document}</p>
            )}
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
          {companySettings.reportFooter || 'Relatório gerado pelo sistema RJ Chopp SGE'}
        </div>
      </div>
    </Layout>
  );
}