import { useEffect, useMemo, useState } from 'react';

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

    return {
      revenue,
      expenses,
      receivable,
      profit: revenue - expenses,
      lowStock,
    };
  }, [orders, financial, products]);

  const soldProducts = useMemo(() => {
    const map: any = {};

    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const product =
          item.product ||
          products.find((productItem) => productItem.id === item.productId);

        const productName =
          product?.name ||
          item.product?.name ||
          item.productId ||
          'Produto';

        const category =
          product?.category ||
          item.product?.category ||
          'Sem categoria';

        if (!map[productName]) {
          map[productName] = {
            name: productName,
            category,
            quantity: 0,
            total: 0,
          };
        }

        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || item.price || product?.salePrice || 0);
        const total = Number(item.total || quantity * unitPrice);

        map[productName].quantity += quantity;
        map[productName].total += total;
      });
    });

    return Object.values(map).sort((a: any, b: any) => b.total - a.total);
  }, [orders, products]);

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
    return financial.filter((item) => item.type === 'OUTPUT');
  }, [financial]);

  const entries = useMemo(() => {
    return financial.filter((item) => item.type === 'ENTRY');
  }, [financial]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => {
      return Number(product.stock || 0) <= Number(product.minimumStock || 0);
    });
  }, [products]);

  const recentOrders = orders.slice(0, 10);

  function printReport() {
    window.print();
  }

  return (
    <Layout>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }

            body {
              background: white !important;
            }

            aside,
            button,
            .no-print {
              display: none !important;
            }

            main {
              background: white !important;
              color: black !important;
              display: block !important;
              min-height: auto !important;
              padding: 0 !important;
            }

            #print-report {
              display: block !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              font-size: 10px !important;
              line-height: 1.15 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }

            #print-report h1 {
              font-size: 22px !important;
              margin: 0 !important;
            }

            #print-report h2 {
              font-size: 13px !important;
              margin: 5px 0 !important;
            }

            #print-report table {
              font-size: 8.5px !important;
              width: 100% !important;
              border-collapse: collapse !important;
              margin-bottom: 5px !important;
            }

            #print-report th,
            #print-report td {
              padding: 2px 4px !important;
              border: 1px solid #999 !important;
            }

            #print-report .print-grid {
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 5px !important;
              margin: 6px 0 !important;
            }

            #print-report .print-card {
              border: 1px solid #999 !important;
              padding: 4px !important;
              border-radius: 4px !important;
            }

            #print-report .print-section {
              margin-top: 5px !important;
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
          <ReportCard title="Pedidos" value={orders.length} />
          <ReportCard title="Clientes" value={clients.length} />
          <ReportCard title="Produtos" value={products.length} />
          <ReportCard title="Estoque baixo" value={totals.lowStock} />
        </div>
      </div>

      <div
        id="print-report"
        className="bg-white text-black rounded-3xl p-8"
      >
        <div className="flex items-start justify-between border-b border-zinc-300 pb-3 mb-3">
          <div>
            <h1 className="text-4xl font-black">RJ CHOPP</h1>
            <p className="font-bold text-zinc-600">
              Relatório geral de vendas e operação
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
            <p className="text-zinc-500 font-bold">Receita</p>
            <p className="text-2xl font-black">{formatMoney(totals.revenue)}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Despesas</p>
            <p className="text-2xl font-black">{formatMoney(totals.expenses)}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Lucro estimado</p>
            <p className="text-2xl font-black">{formatMoney(totals.profit)}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Fiado</p>
            <p className="text-2xl font-black">{formatMoney(totals.receivable)}</p>
          </div>
        </div>

        <div className="print-grid grid md:grid-cols-4 gap-4 mb-6">
          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Pedidos</p>
            <p className="text-2xl font-black">{orders.length}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Clientes</p>
            <p className="text-2xl font-black">{clients.length}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Produtos</p>
            <p className="text-2xl font-black">{products.length}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Itens vendidos</p>
            <p className="text-2xl font-black">
              {soldProducts.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)}
            </p>
          </div>
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
          <h2 className="text-2xl font-black mb-3">Últimos pedidos</h2>

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
                    Nenhum pedido registrado.
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
                    Nenhum barril/chopp registrado.
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
                    Nenhuma bebida registrada.
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
                    Nenhum produto vendido.
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
                    <td className="p-3 border border-zinc-300">{product.name}</td>
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
          <h2 className="text-2xl font-black mb-3">Despesas</h2>

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
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 border-t border-zinc-300 pt-3 text-zinc-500 text-sm">
          Relatório gerado pelo sistema RJ Chopp SGE
        </div>
      </div>
    </Layout>
  );
}