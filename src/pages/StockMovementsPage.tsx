import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

function formatDate(value: any) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('pt-BR');
}

function getMovementLabel(type: string) {
  const value = String(type || '').toUpperCase();

  if (value === 'OUTPUT') {
    return 'Saída';
  }

  return 'Entrada';
}

function getMovementClass(type: string) {
  const value = String(type || '').toUpperCase();

  if (value === 'OUTPUT') {
    return 'bg-red-500/20 text-red-400';
  }

  return 'bg-green-500/20 text-green-400';
}

export default function StockMovementsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
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

  async function loadData() {
    try {
      const [productsResponse, movementsResponse] = await Promise.all([
        api.get('/products', authHeaders()),
        api.get('/stock-movements', authHeaders()),
      ]);

      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
      setMovements(Array.isArray(movementsResponse.data) ? movementsResponse.data : []);
    } catch (error) {
      console.log('Erro ao carregar estoque:', error);
      setProducts([]);
      setMovements([]);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveMovement(event: any) {
    event.preventDefault();

    try {
      setLoading(true);

      const form = new FormData(event.currentTarget);

      const data = {
        productId: String(form.get('productId') || ''),
        type: String(form.get('type') || 'ENTRY'),
        quantity: Number(form.get('quantity') || 0),
        note: String(form.get('note') || ''),
      };

      if (!data.productId) {
        alert('Selecione um produto.');
        return;
      }

      if (data.quantity <= 0) {
        alert('Coloque uma quantidade maior que zero.');
        return;
      }

      const product = products.find((item) => item.id === data.productId);

      if (data.type === 'OUTPUT' && product && Number(product.stock || 0) < data.quantity) {
        const confirmNegative = window.confirm(
          `O estoque atual desse produto é ${product.stock} ${product.unit || ''}.\n\nEssa saída vai deixar o estoque negativo. Deseja continuar?`
        );

        if (!confirmNegative) {
          return;
        }
      }

      await api.post('/stock-movements', data, authHeaders());

      setShowModal(false);
      await loadData();

      alert('Movimentação salva com sucesso.');
    } catch (error) {
      console.log('Erro ao salvar movimentação:', error);
      alert('Não foi possível salvar a movimentação de estoque.');
    } finally {
      setLoading(false);
    }
  }

  const filteredMovements = movements.filter((movement) => {
    const text = search.toLowerCase();

    const productName =
      movement.product?.name ||
      products.find((product) => product.id === movement.productId)?.name ||
      '';

    const matchesSearch =
      !text ||
      productName.toLowerCase().includes(text) ||
      movement.note?.toLowerCase().includes(text) ||
      movement.type?.toLowerCase().includes(text);

    const matchesType =
      !typeFilter ||
      String(movement.type || '').toUpperCase() === typeFilter;

    return matchesSearch && matchesType;
  });

  const totals = useMemo(() => {
    const entries = movements
      .filter((movement) => String(movement.type || '').toUpperCase() === 'ENTRY')
      .reduce((total, movement) => total + Number(movement.quantity || 0), 0);

    const outputs = movements
      .filter((movement) => String(movement.type || '').toUpperCase() === 'OUTPUT')
      .reduce((total, movement) => total + Number(movement.quantity || 0), 0);

    const lowStock = products.filter((product) => {
      return Number(product.stock || 0) <= Number(product.minimumStock || 0);
    }).length;

    return {
      entries,
      outputs,
      lowStock,
      products: products.length,
    };
  }, [movements, products]);

  return (
    <Layout>
      <PageHeader
        title="Estoque"
        description="Entrada, saída e histórico de movimentações"
      />

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card title="Produtos" value={totals.products} />
        <Card title="Estoque baixo" value={totals.lowStock} />
        <Card title="Entradas" value={totals.entries} />
        <Card title="Saídas" value={totals.outputs} />
      </div>

      <div className="grid md:grid-cols-[1fr_220px_auto_auto] gap-4 mb-8">
        <input
          placeholder="Pesquisar por produto, observação ou tipo..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
        />

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className={inputClass}
        >
          <option value="">Todos os tipos</option>
          <option value="ENTRY">Entradas</option>
          <option value="OUTPUT">Saídas</option>
        </select>

        <button
          onClick={loadData}
          className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-6 py-3 font-bold flex items-center justify-center gap-2"
        >
          <RefreshCcw size={18} />
          Atualizar
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nova Movimentação
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="text-2xl font-black text-yellow-400">
              Estoque atual
            </h2>
          </div>

          <table className="w-full min-w-[650px]">
            <thead className="bg-black">
              <tr className="text-left text-zinc-400">
                <th className="p-5">Produto</th>
                <th className="p-5">Categoria</th>
                <th className="p-5">Estoque</th>
                <th className="p-5">Mínimo</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const isLow =
                  Number(product.stock || 0) <= Number(product.minimumStock || 0);

                return (
                  <tr key={product.id} className="border-t border-zinc-800">
                    <td className="p-5 font-bold">
                      {product.name}
                      <p className="text-xs text-zinc-500 mt-1">
                        {product.brand || 'Sem marca'}
                      </p>
                    </td>

                    <td className="p-5 text-zinc-400">
                      {product.category || '-'}
                    </td>

                    <td className={`p-5 font-black ${isLow ? 'text-red-400' : 'text-green-400'}`}>
                      {product.stock} {product.unit}
                    </td>

                    <td className="p-5 text-zinc-400">
                      {product.minimumStock} {product.unit}
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td className="p-5 text-zinc-500" colSpan={4}>
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="text-2xl font-black text-yellow-400">
              Histórico de movimentações
            </h2>
          </div>

          <table className="w-full min-w-[760px]">
            <thead className="bg-black">
              <tr className="text-left text-zinc-400">
                <th className="p-5">Produto</th>
                <th className="p-5">Tipo</th>
                <th className="p-5">Quantidade</th>
                <th className="p-5">Observação</th>
                <th className="p-5">Data</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="border-t border-zinc-800">
                  <td className="p-5 font-bold">
                    {movement.product?.name ||
                      products.find((product) => product.id === movement.productId)?.name ||
                      'Produto não encontrado'}
                  </td>

                  <td className="p-5">
                    <span
                      className={`${getMovementClass(movement.type)} px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2`}
                    >
                      {String(movement.type || '').toUpperCase() === 'OUTPUT' ? (
                        <ArrowDownCircle size={16} />
                      ) : (
                        <ArrowUpCircle size={16} />
                      )}
                      {getMovementLabel(movement.type)}
                    </span>
                  </td>

                  <td className="p-5 font-black text-yellow-400">
                    {movement.quantity}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {movement.note || '-'}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {formatDate(movement.createdAt)}
                  </td>
                </tr>
              ))}

              {filteredMovements.length === 0 && (
                <tr>
                  <td className="p-5 text-zinc-500" colSpan={5}>
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              Nova Movimentação
            </h2>

            <form onSubmit={saveMovement} className="space-y-4">
              <select
                name="productId"
                className={inputClass}
              >
                <option value="">Selecione um produto</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - estoque atual: {product.stock} {product.unit}
                  </option>
                ))}
              </select>

              <select
                name="type"
                className={inputClass}
              >
                <option value="ENTRY">Entrada de estoque</option>
                <option value="OUTPUT">Saída de estoque</option>
              </select>

              <input
                name="quantity"
                type="number"
                min="1"
                placeholder="Quantidade"
                className={inputClass}
              />

              <textarea
                name="note"
                placeholder="Observação. Ex: compra de fornecedor, perda, ajuste, venda avulsa..."
                className={`${inputClass} min-h-[110px]`}
              />

              <button
                disabled={loading}
                className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Movimentação'}
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full bg-zinc-800 rounded-2xl py-4 font-bold"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
