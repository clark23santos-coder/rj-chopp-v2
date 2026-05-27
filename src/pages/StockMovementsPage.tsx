import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCcw,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Boxes,
  Package,
  AlertTriangle,
  History,
  X,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { api } from '../services/api';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

function Field({ label, children }: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-yellow-200">
        {label}
      </label>

      {children}
    </div>
  );
}

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
    return 'border-red-500/25 bg-red-500/15 text-red-400';
  }

  return 'border-green-500/25 bg-green-500/15 text-green-400';
}

function PremiumPanel({ title, icon: Icon, children }: any) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/50 shadow-[0_0_38px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.05),transparent_38%,rgba(250,204,21,.035))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative">
        <div className="border-b border-yellow-500/15 p-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                <Icon size={24} />
              </div>
            )}

            <h2 className="text-2xl font-black text-yellow-400">
              {title}
            </h2>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
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
        description="Entrada, saída, consulta de estoque atual e histórico de movimentações."
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Produtos" value={totals.products} />
        <Card title="Estoque baixo" value={totals.lowStock} />
        <Card title="Entradas" value={totals.entries} />
        <Card title="Saídas" value={totals.outputs} />
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_220px_auto_auto]">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
          />

          <input
            placeholder="Pesquisar por produto, observação ou tipo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} pl-12`}
          />
        </div>

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
          className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-6 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
        >
          <RefreshCcw size={18} />
          Atualizar
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(250,204,21,.35)]"
        >
          <Plus size={20} />
          Nova Movimentação
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <PremiumPanel title="Estoque atual" icon={Boxes}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
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
                    <tr
                      key={product.id}
                      className="border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035]"
                    >
                      <td className="p-5">
                        <p className="font-black text-white">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs font-medium text-zinc-500">
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
        </PremiumPanel>

        <PremiumPanel title="Histórico de movimentações" icon={History}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
                  <th className="p-5">Produto</th>
                  <th className="p-5">Tipo</th>
                  <th className="p-5">Quantidade</th>
                  <th className="p-5">Observação</th>
                  <th className="p-5">Data</th>
                </tr>
              </thead>

              <tbody>
                {filteredMovements.map((movement) => {
                  const product =
                    movement.product ||
                    products.find((productItem) => productItem.id === movement.productId);

                  const isOutput =
                    String(movement.type || '').toUpperCase() === 'OUTPUT';

                  return (
                    <tr
                      key={movement.id}
                      className="border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035]"
                    >
                      <td className="p-5">
                        <p className="font-black text-white">
                          {product?.name || 'Produto não informado'}
                        </p>

                        <p className="mt-1 text-xs font-medium text-zinc-500">
                          {product?.brand || product?.category || '-'}
                        </p>
                      </td>

                      <td className="p-5">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${getMovementClass(movement.type)}`}>
                          {isOutput ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                          {getMovementLabel(movement.type)}
                        </span>
                      </td>

                      <td className={`p-5 font-black ${isOutput ? 'text-red-400' : 'text-green-400'}`}>
                        {isOutput ? '-' : '+'}
                        {movement.quantity}
                      </td>

                      <td className="p-5 text-zinc-400">
                        {movement.note || '-'}
                      </td>

                      <td className="p-5 text-zinc-400">
                        {formatDate(movement.createdAt)}
                      </td>
                    </tr>
                  );
                })}

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
        </PremiumPanel>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Estoque
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    Nova Movimentação
                  </h2>

                  <p className="mt-2 text-sm font-medium text-zinc-400">
                    Registre entrada ou saída manual de produto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border border-yellow-500/20 bg-black/45 p-3 text-zinc-300 transition hover:bg-yellow-400 hover:text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={saveMovement} className="space-y-4">
                <Field label="Produto">
                  <select
                    name="productId"
                    className={inputClass}
                    defaultValue=""
                  >
                    <option value="">Selecione um produto</option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - Estoque: {product.stock} {product.unit}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Tipo de movimentação">
                  <select
                    name="type"
                    className={inputClass}
                    defaultValue="ENTRY"
                  >
                    <option value="ENTRY">Entrada</option>
                    <option value="OUTPUT">Saída</option>
                  </select>
                </Field>

                <Field label="Quantidade">
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Quantidade"
                    defaultValue={1}
                    className={inputClass}
                  />
                </Field>

                <Field label="Observação">
                  <textarea
                    name="note"
                    placeholder="Ex: compra, perda, ajuste de estoque..."
                    className={`${inputClass} min-h-[120px] resize-none`}
                  />
                </Field>

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Movimentação'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}