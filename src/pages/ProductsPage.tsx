import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Boxes,
  AlertTriangle,
  CheckCircle,
  Beer,
  Search,
  X,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';

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

function formatMoney(value: any) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function normalizeText(value: any) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductSearchText(product: any) {
  const salePrice = Number(product.salePrice || 0);
  const costPrice = Number(product.costPrice || 0);

  const fullText = [
    product.name,
    product.category,
    product.brand,
    product.unit,
    product.stock,
    product.minimumStock,
    product.costPrice,
    product.salePrice,
    formatMoney(costPrice),
    formatMoney(salePrice),
    salePrice.toFixed(2),
    salePrice.toFixed(2).replace('.', ','),
    costPrice.toFixed(2),
    costPrice.toFixed(2).replace('.', ','),
  ]
    .filter((item) => item !== null && item !== undefined && item !== '')
    .join(' ');

  return normalizeText(fullText);
}

function productMatchesSearch(product: any, search: string) {
  const normalizedSearch = normalizeText(search);

  if (!normalizedSearch) {
    return true;
  }

  const productText = getProductSearchText(product);

  const searchWords = normalizedSearch
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);

  return searchWords.every((word) => productText.includes(word));
}

function PremiumCard({ title, value, icon: Icon, tone = 'yellow' }: any) {
  const toneClass =
    tone === 'red'
      ? 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/25'
      : tone === 'green'
        ? 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/25'
        : 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/25';

  return (
    <div className="group relative min-h-[140px] overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400/35 hover:shadow-[0_0_50px_rgba(245,158,11,.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-black text-zinc-300 md:text-base">
            {title}
          </p>

          <div className={`rounded-2xl border bg-gradient-to-br p-3 ${toneClass}`}>
            <Icon size={22} />
          </div>
        </div>

        <p className="mt-6 text-4xl font-black leading-none text-white md:text-5xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function PremiumPanel({ children }: any) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/50 shadow-[0_0_38px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.05),transparent_38%,rgba(250,204,21,.035))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [quickProductDefaults, setQuickProductDefaults] = useState<any>(null);
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

  async function loadProducts() {
    try {
      const response = await api.get('/products', authHeaders());
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log('Erro ao carregar produtos:', error);
      setProducts([]);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openNewProduct(defaults: any = null) {
    setEditingProduct(null);
    setQuickProductDefaults(defaults);
    setShowModal(true);
  }

  function openEditProduct(product: any) {
    setEditingProduct(product);
    setQuickProductDefaults(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setQuickProductDefaults(null);
  }

  async function saveProduct(event: any) {
    event.preventDefault();

    try {
      setLoading(true);

      const form = new FormData(event.currentTarget);

      const data = {
        name: String(form.get('name') || ''),
        category: String(form.get('category') || ''),
        brand: String(form.get('brand') || ''),
        unit: String(form.get('unit') || ''),
        stock: Number(form.get('stock') || 0),
        minimumStock: Number(form.get('minimumStock') || 0),
        costPrice: Number(form.get('costPrice') || 0),
        salePrice: Number(form.get('salePrice') || 0),
      };

      if (!data.name.trim()) {
        alert('Coloque o nome do produto.');
        return;
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data, authHeaders());

        addAuditLog({
          area: 'Produtos',
          action: 'UPDATE',
          title: `Produto editado: ${data.name}`,
          description: `Categoria: ${data.category || '-'}\nMarca: ${data.brand || '-'}\nEstoque: ${data.stock} ${data.unit || ''}\nVenda: ${formatMoney(data.salePrice)}`,
        });
      } else {
        await api.post('/products', data, authHeaders());

        addAuditLog({
          area: 'Produtos',
          action: 'CREATE',
          title: `Produto criado: ${data.name}`,
          description: `Categoria: ${data.category || '-'}\nMarca: ${data.brand || '-'}\nEstoque: ${data.stock} ${data.unit || ''}\nVenda: ${formatMoney(data.salePrice)}`,
        });
      }

      closeModal();
      await loadProducts();
    } catch (error) {
      console.log('Erro ao salvar produto:', error);
      alert('Não foi possível salvar o produto.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(product: any) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja apagar o produto "${product.name}"?\n\nEssa ação não tem como desfazer.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      await api.delete(`/products/${product.id}`, authHeaders());

      await loadProducts();

      addAuditLog({
        area: 'Produtos',
        action: 'DELETE',
        title: `Produto apagado: ${product.name || 'Produto'}`,
        description: `Categoria: ${product.category || '-'}\nMarca: ${product.brand || '-'}\nEstoque anterior: ${product.stock || 0} ${product.unit || ''}`,
      });

      alert('Produto apagado com sucesso.');
    } catch (error) {
      console.log('Erro ao apagar produto:', error);
      alert(
        'Não foi possível apagar esse produto. Se ele estiver dentro de algum pedido, primeiro apague o pedido ou deixe esse produto sem apagar.'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((product) => {
    return productMatchesSearch(product, search);
  });

  const totals = useMemo(() => {
    const lowStock = products.filter((product) => {
      return Number(product.stock || 0) <= Number(product.minimumStock || 0);
    }).length;

    const totalStock = products.reduce((total, product) => {
      return total + Number(product.stock || 0);
    }, 0);

    const equipment = products.filter((product) => {
      const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();

      return (
        text.includes('chopeira') ||
        text.includes('cilindro') ||
        text.includes('equipamento')
      );
    }).length;

    return {
      products: products.length,
      lowStock,
      totalStock,
      equipment,
    };
  }, [products]);

  return (
    <Layout>
      <PageHeader
        title="Produtos"
        description="Cadastro, consulta e controle de produtos, equipamentos e estoque da RJ Chopp."
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumCard title="Produtos cadastrados" value={totals.products} icon={Package} />
        <PremiumCard title="Estoque total" value={totals.totalStock} icon={Boxes} tone="green" />
        <PremiumCard title="Estoque baixo" value={totals.lowStock} icon={AlertTriangle} tone={totals.lowStock > 0 ? 'red' : 'yellow'} />
        <PremiumCard title="Equipamentos" value={totals.equipment} icon={Beer} />
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
          />

          <input
            placeholder="Busca inteligente: agua garoto com gas, coca zero, heineken lata..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} pl-12`}
          />
        </div>

        <button
          onClick={() => openNewProduct()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(250,204,21,.35)]"
        >
          <Plus size={20} />
          Novo Produto
        </button>

        <button
          onClick={() =>
            openNewProduct({
              name: 'Chopeira',
              brand: 'RJ Chopp',
              category: 'Equipamento',
              unit: 'UNIDADE',
              stock: 1,
              minimumStock: 0,
              costPrice: 0,
              salePrice: 0,
            })
          }
          className="flex items-center justify-center gap-2 rounded-2xl border border-blue-500/25 bg-blue-500/15 px-6 py-3 font-black text-blue-300 transition hover:bg-blue-500 hover:text-white"
        >
          <Plus size={20} />
          Chopeira
        </button>

        <button
          onClick={() =>
            openNewProduct({
              name: 'Cilindro',
              brand: 'RJ Chopp',
              category: 'Equipamento',
              unit: 'UNIDADE',
              stock: 1,
              minimumStock: 0,
              costPrice: 0,
              salePrice: 0,
            })
          }
          className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/15 px-6 py-3 font-black text-green-300 transition hover:bg-green-500 hover:text-white"
        >
          <Plus size={20} />
          Cilindro
        </button>
      </div>

      <PremiumPanel>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
                <th className="p-5">Produto</th>
                <th className="p-5">Categoria</th>
                <th className="p-5">Marca</th>
                <th className="p-5">Estoque</th>
                <th className="p-5">Custo</th>
                <th className="p-5">Venda</th>
                <th className="p-5">Status</th>
                <th className="p-5">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const lowStock =
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
                        ID: {String(product.id || '').slice(0, 8)}
                      </p>
                    </td>

                    <td className="p-5 text-zinc-400">
                      {product.category || '-'}
                    </td>

                    <td className="p-5 text-zinc-400">
                      {product.brand || '-'}
                    </td>

                    <td className={`p-5 font-black ${lowStock ? 'text-red-400' : 'text-green-400'}`}>
                      {product.stock} {product.unit}
                    </td>

                    <td className="p-5 text-zinc-400">
                      {formatMoney(product.costPrice)}
                    </td>

                    <td className="p-5 font-black text-yellow-400">
                      {formatMoney(product.salePrice)}
                    </td>

                    <td className="p-5">
                      {lowStock ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/15 px-4 py-2 text-sm font-black text-red-400">
                          <AlertTriangle size={16} />
                          Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/15 px-4 py-2 text-sm font-black text-green-400">
                          <CheckCircle size={16} />
                          OK
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                          title="Editar produto"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => deleteProduct(product)}
                          className="rounded-xl border border-red-500/25 bg-red-500/15 p-3 text-red-400 transition hover:bg-red-500 hover:text-white"
                          title="Apagar produto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td className="p-6 text-zinc-500" colSpan={8}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumPanel>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Produtos
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-yellow-500/20 bg-black/45 p-3 text-zinc-300 transition hover:bg-yellow-400 hover:text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do produto">
                  <input
                    name="name"
                    placeholder="Nome do produto"
                    defaultValue={editingProduct?.name || quickProductDefaults?.name || ''}
                    className={inputClass}
                  />
                </Field>

                <Field label="Marca">
                  <input
                    name="brand"
                    placeholder="Marca"
                    defaultValue={editingProduct?.brand || quickProductDefaults?.brand || ''}
                    className={inputClass}
                  />
                </Field>

                <Field label="Unidade">
                  <input
                    name="unit"
                    placeholder="Unidade"
                    defaultValue={editingProduct?.unit || quickProductDefaults?.unit || 'UNIDADE'}
                    className={inputClass}
                  />
                </Field>

                <Field label="Categoria">
                  <input
                    name="category"
                    placeholder="Categoria"
                    defaultValue={editingProduct?.category || quickProductDefaults?.category || ''}
                    className={inputClass}
                  />
                </Field>

                <Field label="Estoque atual">
                  <input
                    name="stock"
                    type="number"
                    placeholder="Estoque atual"
                    defaultValue={editingProduct?.stock ?? quickProductDefaults?.stock ?? 0}
                    className={inputClass}
                  />
                </Field>

                <Field label="Estoque mínimo">
                  <input
                    name="minimumStock"
                    type="number"
                    placeholder="Estoque mínimo"
                    defaultValue={editingProduct?.minimumStock ?? quickProductDefaults?.minimumStock ?? 0}
                    className={inputClass}
                  />
                </Field>

                <Field label="Valor de compra / custo">
                  <input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    placeholder="Valor de compra / custo"
                    defaultValue={editingProduct?.costPrice ?? quickProductDefaults?.costPrice ?? 0}
                    className={inputClass}
                  />
                </Field>

                <Field label="Valor de venda">
                  <input
                    name="salePrice"
                    type="number"
                    step="0.01"
                    placeholder="Valor de venda"
                    defaultValue={editingProduct?.salePrice ?? quickProductDefaults?.salePrice ?? 0}
                    className={inputClass}
                  />
                </Field>

                <button
                  disabled={loading}
                  className="mt-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01] disabled:opacity-50 md:col-span-2"
                >
                  {loading ? 'Salvando...' : 'Salvar Produto'}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400 md:col-span-2"
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