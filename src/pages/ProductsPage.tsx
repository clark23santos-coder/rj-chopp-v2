import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

function Field({ label, children }: any) {
  return (
    <div>
      <label className="block mb-2 text-sm font-bold text-zinc-300">
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
    const text = search.toLowerCase();

    return (
      product.name?.toLowerCase().includes(text) ||
      product.category?.toLowerCase().includes(text) ||
      product.brand?.toLowerCase().includes(text)
    );
  });

  return (
    <Layout>
      <PageHeader
        title="Produtos"
        description="Cadastro e controle de estoque"
      />

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          placeholder="Pesquisar produto, marca ou categoria..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
        />

        <button
          onClick={() => openNewProduct()}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
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
          className="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
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
          className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Cilindro
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[950px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
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
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-t border-zinc-800">
                <td className="p-5 font-bold">{product.name}</td>

                <td className="p-5 text-zinc-400">
                  {product.category || '-'}
                </td>

                <td className="p-5 text-zinc-400">
                  {product.brand || '-'}
                </td>

                <td className="p-5">
                  {product.stock} {product.unit}
                </td>

                <td className="p-5 text-zinc-400">
                  {formatMoney(product.costPrice)}
                </td>

                <td className="p-5 text-yellow-400 font-bold">
                  {formatMoney(product.salePrice)}
                </td>

                <td className="p-5">
                  {Number(product.stock || 0) <= Number(product.minimumStock || 0) ? (
                    <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                      Baixo
                    </span>
                  ) : (
                    <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                      OK
                    </span>
                  )}
                </td>

                <td className="p-5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditProduct(product)}
                      className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl"
                      title="Editar produto"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => deleteProduct(product)}
                      className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-3 rounded-xl"
                      title="Apagar produto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td className="p-5 text-zinc-500" colSpan={8}>
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            <form onSubmit={saveProduct} className="grid md:grid-cols-2 gap-4">
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
                className="md:col-span-2 bg-yellow-400 text-black rounded-2xl py-4 font-black disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Produto'}
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="md:col-span-2 bg-zinc-800 rounded-2xl py-4 font-bold"
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