import { useEffect, useState } from 'react';
import { Plus, FileText, Pencil } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [returnFilter, setReturnFilter] = useState('');

  const [orderItems, setOrderItems] = useState([
    {
      productId: '',
      quantity: 1,
    },
  ]);

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
    const [ordersResponse, clientsResponse, productsResponse] =
      await Promise.all([
        api.get('/orders', authHeaders()),
        api.get('/clients', authHeaders()),
        api.get('/products', authHeaders()),
      ]);

    setOrders(ordersResponse.data);
    setClients(clientsResponse.data);
    setProducts(productsResponse.data);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openNewOrder() {
    setEditingOrder(null);
    setOrderItems([
      {
        productId: '',
        quantity: 1,
      },
    ]);
    setShowModal(true);
  }

  function openEditOrder(order: any) {
    setEditingOrder(order);

    const items =
      order.items?.length > 0
        ? order.items.map((item: any) => ({
            productId: item.productId || item.product?.id || '',
            quantity: Number(item.quantity || 1),
          }))
        : [
            {
              productId: '',
              quantity: 1,
            },
          ];

    setOrderItems(items);
    setShowModal(true);
  }

  const today = new Date().toISOString().split('T')[0];

  const filteredOrders = orders.filter((order) => {
    const text = search.toLowerCase();

    const matchesSearch =
      !text ||
      order.client?.name?.toLowerCase().includes(text) ||
      order.client?.phone?.toLowerCase().includes(text) ||
      order.client?.address?.toLowerCase().includes(text) ||
      order.paymentMethod?.toLowerCase().includes(text) ||
      order.status?.toLowerCase().includes(text) ||
      order.returnItems?.toLowerCase().includes(text);

    const matchesStatus =
      !statusFilter ||
      String(order.status || '').toUpperCase() === statusFilter;

    const matchesPayment =
      !paymentFilter ||
      String(order.paymentMethod || '').toUpperCase() === paymentFilter;

    const matchesReturn =
      !returnFilter ||
      (returnFilter === 'HOJE' && order.returnDate === today) ||
      (returnFilter === 'ATRASADO' &&
        order.returnDate &&
        order.returnDate < today &&
        order.status !== 'FINALIZADO' &&
        order.status !== 'RETIRADO') ||
      (returnFilter === 'AGENDADO' &&
        order.returnDate &&
        order.returnDate > today);

    return matchesSearch && matchesStatus && matchesPayment && matchesReturn;
  });

  function addItem() {
    setOrderItems([
      ...orderItems,
      {
        productId: '',
        quantity: 1,
      },
    ]);
  }

  function updateItem(index: number, field: string, value: any) {
    const updated = [...orderItems];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setOrderItems(updated);
  }

  function calculateTotal() {
    return orderItems.reduce((total, item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      return (
        total +
        Number(product?.salePrice || 0) *
          Number(item.quantity || 0)
      );
    }, 0);
  }

  function getOrderItems(order: any) {
    if (order.items && order.items.length > 0) {
      return order.items;
    }

    return [];
  }

  function getProductName(item: any) {
    return (
      item.product?.name ||
      products.find((product) => product.id === item.productId)?.name ||
      'Produto'
    );
  }

  function getStatusLabel(status: string) {
    const value = String(status || '').toUpperCase();

    if (value === 'EM_ENTREGA') return 'Em entrega';
    if (value === 'ENTREGUE') return 'Entregue';
    if (value === 'AGUARDANDO_RETIRADA') return 'Aguardando retirada';
    if (value === 'RETIRADO') return 'Retirado';
    if (value === 'FINALIZADO') return 'Finalizado';
    if (value === 'CANCELADO') return 'Cancelado';
    if (value === 'PAGO') return 'Pago';

    return 'Pendente';
  }

  function getStatusClass(status: string) {
    const value = String(status || '').toUpperCase();

    if (value === 'FINALIZADO' || value === 'PAGO' || value === 'RETIRADO') {
      return 'bg-green-500/20 text-green-400';
    }

    if (value === 'CANCELADO') {
      return 'bg-red-500/20 text-red-400';
    }

    if (value === 'AGUARDANDO_RETIRADA') {
      return 'bg-orange-500/20 text-orange-400';
    }

    if (value === 'EM_ENTREGA' || value === 'ENTREGUE') {
      return 'bg-blue-500/20 text-blue-400';
    }

    return 'bg-yellow-500/20 text-yellow-400';
  }

  async function changeOrderStatus(orderId: string, status: string) {
    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { status },
        authHeaders()
      );
    } catch {
      console.log('Backend ainda não possui rota de status, atualizando só na tela');
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  }

  function printDeliveryNote() {
    window.print();
  }

  async function saveOrder(event: any) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const validItems = orderItems.filter(
      (item) => item.productId && Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      alert('Adicione pelo menos um produto ao pedido');
      return;
    }

    const items = validItems.map((item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      return {
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(product?.salePrice || 0),
      };
    });

    const data = {
      clientId: String(form.get('clientId')),
      paymentMethod: String(form.get('paymentMethod')),
      deliveryDate: String(form.get('deliveryDate')),
      returnDate: String(form.get('returnDate')),
      returnItems: String(form.get('returnItems')),
      status: 'PENDENTE',
      items,
    };

    if (editingOrder) {
      try {
        await api.put(
          `/orders/${editingOrder.id}`,
          data,
          authHeaders()
        );
      } catch {
        console.log('Backend ainda não possui edição completa de pedido, atualizando só na tela');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === editingOrder.id
            ? {
                ...order,
                ...data,
                items,
                total: calculateTotal(),
              }
            : order
        )
      );

      setShowModal(false);
      setEditingOrder(null);

      setOrderItems([
        {
          productId: '',
          quantity: 1,
        },
      ]);

      return;
    }

    await api.post('/orders', data, authHeaders());

    for (const item of validItems) {
      const product = products.find(
        (product) => product.id === item.productId
      );

      if (!product) continue;

      await api.put(
        `/products/${product.id}`,
        {
          name: product.name,
          category: product.category,
          brand: product.brand,
          unit: product.unit,
          stock:
            Number(product.stock || 0) -
            Number(item.quantity || 0),
          minimumStock: product.minimumStock,
          costPrice: product.costPrice,
          salePrice: product.salePrice,
        },
        authHeaders()
      );
    }

    setShowModal(false);
    setEditingOrder(null);

    setOrderItems([
      {
        productId: '',
        quantity: 1,
      },
    ]);

    loadData();
  }

  return (
    <Layout>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body {
              background: white !important;
            }

            aside,
            .no-print,
            button {
              display: none !important;
            }

            main {
              background: white !important;
              color: black !important;
              display: block !important;
              min-height: auto !important;
            }

            #delivery-note-print {
              display: block !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              font-size: 12px !important;
            }

            #delivery-note-print table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            #delivery-note-print th,
            #delivery-note-print td {
              border: 1px solid #999 !important;
              padding: 6px !important;
            }
          }
        `}
      </style>

      <div className="no-print">
        <PageHeader
          title="Pedidos"
          description="Controle de pedidos, entregas e retiradas"
        />

        <div className="flex justify-end mb-8">
          <button
            onClick={openNewOrder}
            className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Pedido
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              placeholder="Pesquisar pedido, cliente, telefone, endereço..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={inputClass}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ENTREGA">Em entrega</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="AGUARDANDO_RETIRADA">Aguardando retirada</option>
              <option value="RETIRADO">Retirado</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="PAGO">Pago</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">Todos pagamentos</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO">Cartão</option>
              <option value="FIADO">Fiado</option>
            </select>

            <select
              value={returnFilter}
              onChange={(event) => setReturnFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">Todas retiradas</option>
              <option value="HOJE">Buscar hoje</option>
              <option value="ATRASADO">Atrasados</option>
              <option value="AGENDADO">Agendados</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p className="text-zinc-400">
              Mostrando <strong className="text-yellow-400">{filteredOrders.length}</strong> de {orders.length} pedidos
            </p>

            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPaymentFilter('');
                setReturnFilter('');
              }}
              className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead className="bg-black">
              <tr className="text-left text-zinc-400">
                <th className="p-5">Cliente</th>
                <th className="p-5">Pagamento</th>
                <th className="p-5">Entrega</th>
                <th className="p-5">Buscar volta</th>
                <th className="p-5">Status</th>
                <th className="p-5">Total</th>
                <th className="p-5">Nota</th>
                <th className="p-5">Editar</th>
                <th className="p-5">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-zinc-800">
                  <td className="p-5 font-bold">
                    {order.client?.name || 'Cliente'}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {order.paymentMethod}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {order.deliveryDate || '-'}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {order.returnDate || '-'}
                  </td>

                  <td className="p-5">
                    <span className={`${getStatusClass(order.status)} px-4 py-2 rounded-full text-sm font-bold`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>

                  <td className="p-5 text-yellow-400 font-black">
                    R$ {order.total}
                  </td>

                  <td className="p-5">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-yellow-400 text-black rounded-xl px-4 py-3 font-bold flex items-center gap-2"
                    >
                      <FileText size={18} />
                      Ver Nota
                    </button>
                  </td>

                  <td className="p-5">
                    <button
                      onClick={() => openEditOrder(order)}
                      className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-3 font-bold flex items-center gap-2"
                    >
                      <Pencil size={18} />
                      Editar
                    </button>
                  </td>

                  <td className="p-5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => changeOrderStatus(order.id, 'EM_ENTREGA')}
                        className="bg-blue-500/20 text-blue-400 rounded-xl px-3 py-2 text-sm font-bold"
                      >
                        Em entrega
                      </button>

                      <button
                        onClick={() => changeOrderStatus(order.id, 'AGUARDANDO_RETIRADA')}
                        className="bg-orange-500/20 text-orange-400 rounded-xl px-3 py-2 text-sm font-bold"
                      >
                        Buscar volta
                      </button>

                      <button
                        onClick={() => changeOrderStatus(order.id, 'FINALIZADO')}
                        className="bg-green-500/20 text-green-400 rounded-xl px-3 py-2 text-sm font-bold"
                      >
                        Finalizar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td className="p-5 text-zinc-500" colSpan={9}>
                    Nenhum pedido encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              {editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
            </h2>

            <form onSubmit={saveOrder} className="space-y-6">
              <select
                name="clientId"
                defaultValue={editingOrder?.clientId || editingOrder?.client?.id || ''}
                className={inputClass}
              >
                <option value="">Selecione um cliente</option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-bold text-zinc-300">
                    Data da entrega
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-bold text-zinc-300">
                    Data para buscar de volta
                  </label>
                  <input
                    type="date"
                    name="returnDate"
                    defaultValue={editingOrder?.returnDate || ''}
                    className={inputClass}
                  />
                </div>
              </div>

              <input
                name="returnItems"
                placeholder="Itens para buscar depois: ex: 1 chopeira, 2 barris, cascos..."
                defaultValue={editingOrder?.returnItems || ''}
                className={inputClass}
              />

              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="grid md:grid-cols-2 gap-4">
                    <select
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(index, 'productId', event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Selecione um produto</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} — Estoque: {product.stock} — R$ {product.salePrice}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, 'quantity', Number(event.target.value))
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold"
              >
                Adicionar Produto
              </button>

              <select
                name="paymentMethod"
                defaultValue={editingOrder?.paymentMethod || 'PIX'}
                className={inputClass}
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO">Cartão</option>
                <option value="FIADO">Fiado</option>
              </select>

              <div className="bg-black rounded-3xl p-6 border border-zinc-800">
                <p className="text-zinc-400 font-bold">
                  Total do Pedido
                </p>

                <p className="text-yellow-400 text-5xl font-black mt-4">
                  R$ {calculateTotal()}
                </p>
              </div>

              <button className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black">
                {editingOrder ? 'Salvar Alterações' : 'Salvar Pedido'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="w-full bg-zinc-800 rounded-2xl py-4 font-bold"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <div id="delivery-note-print" className="bg-white text-black rounded-2xl p-8">
              <div className="border-b border-zinc-300 pb-4 mb-6">
                <h1 className="text-4xl font-black">
                  RJ CHOPP
                </h1>
                <p className="text-zinc-600 font-bold">
                  Ficha de entrega e retirada
                </p>
                <p className="text-zinc-600">
                  Loanda - Paraná | (44) 99958-8160
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-zinc-500 font-bold">Cliente</p>
                  <p className="text-xl font-black">
                    {selectedOrder.client?.name || 'Cliente'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 font-bold">Telefone</p>
                  <p className="text-xl font-black">
                    {selectedOrder.client?.phone || '-'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-zinc-500 font-bold">Endereço</p>
                  <p className="text-xl font-black">
                    {selectedOrder.client?.address || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 font-bold">Entrega</p>
                  <p className="text-xl font-black">
                    {selectedOrder.deliveryDate || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 font-bold">Buscar volta</p>
                  <p className="text-xl font-black">
                    {selectedOrder.returnDate || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 font-bold">Pagamento</p>
                  <p className="text-xl font-black">
                    {selectedOrder.paymentMethod || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 font-bold">Status</p>
                  <p className="text-xl font-black">
                    {getStatusLabel(selectedOrder.status)}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-zinc-500 font-bold">Itens para buscar depois</p>
                  <p className="text-xl font-black">
                    {selectedOrder.returnItems || '-'}
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-black mb-3">
                Pedido
              </h2>

              <table className="w-full border border-zinc-300 mb-6">
                <thead>
                  <tr className="bg-zinc-100 text-left">
                    <th className="p-3 border border-zinc-300">Produto</th>
                    <th className="p-3 border border-zinc-300">Qtd</th>
                    <th className="p-3 border border-zinc-300">Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {getOrderItems(selectedOrder).length > 0 ? (
                    getOrderItems(selectedOrder).map((item: any, index: number) => (
                      <tr key={item.id || index}>
                        <td className="p-3 border border-zinc-300">
                          {getProductName(item)}
                        </td>

                        <td className="p-3 border border-zinc-300">
                          {item.quantity}
                        </td>

                        <td className="p-3 border border-zinc-300">
                          R$ {item.total || item.unitPrice || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 border border-zinc-300" colSpan={3}>
                        Itens do pedido não carregados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-between items-center border-t border-zinc-300 pt-4">
                <p className="text-zinc-600 font-bold">
                  Entregar junto com a mercadoria
                </p>

                <p className="text-3xl font-black">
                  Total: R$ {selectedOrder.total}
                </p>
              </div>

              <div className="mt-10 border-t border-zinc-300 pt-6">
                <p className="text-sm text-zinc-500">
                  Assinatura do cliente:
                </p>

                <div className="h-16 border-b border-black mt-4" />
              </div>
            </div>

            <button
              onClick={printDeliveryNote}
              className="mt-6 w-full bg-yellow-400 text-black rounded-2xl py-4 font-black"
            >
              Imprimir Ficha
            </button>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="mt-4 w-full bg-zinc-800 rounded-2xl py-4 font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
