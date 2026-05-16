import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

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
    const response = await api.get('/products', authHeaders());
    setProducts(response.data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function saveProduct(event: any) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const data = {
      name: String(form.get('name')),
      category: String(form.get('category')),
      brand: String(form.get('brand')),
      unit: String(form.get('unit')),
      stock: Number(form.get('stock')),
      minimumStock: Number(form.get('minimumStock')),
      costPrice: Number(form.get('costPrice')),
      salePrice: Number(form.get('salePrice')),
    };

    if (editingProduct) {
      await api.put(`/products/${editingProduct.id}`, data, authHeaders());
    } else {
      await api.post('/products', data, authHeaders());
    }

    setShowModal(false);
    setEditingProduct(null);
    loadProducts();
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
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
        />

        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
              <th className="p-5">Produto</th>
              <th className="p-5">Categoria</th>
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
                <td className="p-5 text-zinc-400">{product.category}</td>
                <td className="p-5">
                  {product.stock} {product.unit}
                </td>
                <td className="p-5 text-zinc-400">R$ {product.costPrice}</td>
                <td className="p-5 text-yellow-400 font-bold">
                  R$ {product.salePrice}
                </td>
                <td className="p-5">
                  {product.stock <= product.minimumStock ? (
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
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setShowModal(true);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl"
                  >
                    <Pencil size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td className="p-5 text-zinc-500" colSpan={7}>
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            <form onSubmit={saveProduct} className="grid md:grid-cols-2 gap-4">
              <input name="name" placeholder="Nome" defaultValue={editingProduct?.name || ''} className={inputClass} />
              <input name="category" placeholder="Categoria" defaultValue={editingProduct?.category || ''} className={inputClass} />
              <input name="brand" placeholder="Marca" defaultValue={editingProduct?.brand || ''} className={inputClass} />
              <input name="unit" placeholder="Unidade" defaultValue={editingProduct?.unit || 'UNIDADE'} className={inputClass} />
              <input name="stock" type="number" placeholder="Estoque" defaultValue={editingProduct?.stock || 0} className={inputClass} />
              <input name="minimumStock" type="number" placeholder="Estoque mínimo" defaultValue={editingProduct?.minimumStock || 0} className={inputClass} />
              <input name="costPrice" type="number" placeholder="Preço de custo" defaultValue={editingProduct?.costPrice || 0} className={inputClass} />
              <input name="salePrice" type="number" placeholder="Preço de venda" defaultValue={editingProduct?.salePrice || 0} className={inputClass} />

              <button className="md:col-span-2 bg-yellow-400 text-black rounded-2xl py-4 font-black">
                Salvar Produto
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
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