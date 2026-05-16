import { useEffect, useMemo, useState } from 'react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

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
      ordersResponse,
      financialResponse,
      productsResponse,
      clientsResponse,
    ] = await Promise.all([
      api.get('/orders', authHeaders()),
      api.get('/financial', authHeaders()),
      api.get('/products', authHeaders()),
      api.get('/clients', authHeaders()),
    ]);

    setOrders(ordersResponse.data);
    setFinancial(financialResponse.data);
    setProducts(productsResponse.data);
    setClients(clientsResponse.data);
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

    return {
      revenue,
      expenses,
      receivable,
      profit: revenue - expenses,
    };
  }, [orders, financial]);

  const soldProducts = useMemo(() => {
    const map: any = {};

    orders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const product =
          item.product ||
          products.find((product) => product.id === item.productId);

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

        map[productName].quantity += Number(item.quantity || 0);
        map[productName].total += Number(
          item.total ||
            Number(item.quantity || 0) *
              Number(item.unitPrice || product?.salePrice || 0)
        );
      });
    });

    return Object.values(map);
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

        <div className="flex justify-end mb-8">
          <button
            onClick={printReport}
            className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black"
          >
            Imprimir / Salvar PDF
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card title="Receita" value={`R$ ${totals.revenue}`} />
          <Card title="Despesas" value={`R$ ${totals.expenses}`} />
          <Card title="Lucro" value={`R$ ${totals.profit}`} />
          <Card title="Fiado" value={`R$ ${totals.receivable}`} />
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
            <p className="text-2xl font-black">R$ {totals.revenue}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Despesas</p>
            <p className="text-2xl font-black">R$ {totals.expenses}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Lucro estimado</p>
            <p className="text-2xl font-black">R$ {totals.profit}</p>
          </div>

          <div className="print-card border border-zinc-300 rounded-2xl p-4">
            <p className="text-zinc-500 font-bold">Fiado</p>
            <p className="text-2xl font-black">R$ {totals.receivable}</p>
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
                    <td className="p-3 border border-zinc-300">R$ {item.total}</td>
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
                    <td className="p-3 border border-zinc-300">R$ {item.total}</td>
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
                    <td className="p-3 border border-zinc-300">R$ {item.total}</td>
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
          <h2 className="text-2xl font-black mb-3">Despesas</h2>

          <table className="w-full border border-zinc-300">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="p-3 border border-zinc-300">Descrição</th>
                <th className="p-3 border border-zinc-300">Categoria</th>
                <th className="p-3 border border-zinc-300">Valor</th>
              </tr>
            </thead>

            <tbody>
              {expenses.length > 0 ? (
                expenses.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 border border-zinc-300">{item.description}</td>
                    <td className="p-3 border border-zinc-300">{item.category}</td>
                    <td className="p-3 border border-zinc-300">R$ {item.amount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 border border-zinc-300" colSpan={3}>
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
