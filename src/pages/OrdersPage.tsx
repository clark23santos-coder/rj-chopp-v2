import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  CheckCircle,
  Truck,
  PackageCheck,
  X,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

const WITHDRAWALS_STORAGE_KEY = 'rjchopp_withdrawals';
const ORDER_META_STORAGE_KEY = 'rjchopp_order_meta';

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

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('pt-BR');
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

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

function writeStorage(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStatusLabel(status: string) {
  const value = String(status || '').toUpperCase();

  if (value === 'APPROVED') return 'Entregue';
  if (value === 'FINISHED') return 'Finalizado';
  if (value === 'CANCELLED') return 'Cancelado';
  if (value === 'CANCELED') return 'Cancelado';
  if (value === 'PAGO') return 'Pago';

  return 'Pendente';
}

function getStatusClass(status: string) {
  const value = String(status || '').toUpperCase();

  if (value === 'FINISHED' || value === 'PAGO') {
    return 'bg-green-500/20 text-green-400';
  }

  if (value === 'APPROVED') {
    return 'bg-blue-500/20 text-blue-400';
  }

  if (value === 'CANCELLED' || value === 'CANCELED') {
    return 'bg-red-500/20 text-red-400';
  }

  return 'bg-yellow-500/20 text-yellow-400';
}

function buildOrderNote(data: any) {
  const deliveryDate = data.deliveryDate || '';
  const pickupDate = data.pickupDate || '';
  const returnItems = data.returnItems || '';
  const observation = data.observation || '';

  return [
    `Data de entrega: ${deliveryDate || '-'}`,
    `Data para buscar de volta: ${pickupDate || '-'}`,
    `Itens para buscar: ${returnItems || '-'}`,
    `Observação: ${observation || '-'}`,
  ].join('\n');
}

function getShortId(id: any) {
  return String(id || '').slice(0, 8).toUpperCase();
}

function getItemUnitPrice(item: any) {
  const quantity = Number(item.quantity || 0);
  const total = Number(item.total || 0);

  if (item.unitPrice !== undefined) {
    return Number(item.unitPrice || 0);
  }

  if (quantity > 0 && total > 0) {
    return total / quantity;
  }

  return 0;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deliveryOrder, setDeliveryOrder] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [returnFilter, setReturnFilter] = useState('');

  const [loading, setLoading] = useState(false);

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

  function getOrderMeta(orderId: string) {
    const meta = readStorage(ORDER_META_STORAGE_KEY, {});
    return meta[orderId] || {};
  }

  function saveOrderMeta(orderId: string, data: any) {
    const meta = readStorage(ORDER_META_STORAGE_KEY, {});

    meta[orderId] = {
      ...(meta[orderId] || {}),
      ...data,
    };

    writeStorage(ORDER_META_STORAGE_KEY, meta);
  }

  function removeOrderMeta(orderId: string) {
    const meta = readStorage(ORDER_META_STORAGE_KEY, {});
    delete meta[orderId];
    writeStorage(ORDER_META_STORAGE_KEY, meta);
  }

  async function loadData() {
    try {
      const [ordersResponse, clientsResponse, productsResponse] =
        await Promise.all([
          api.get('/orders', authHeaders()),
          api.get('/clients', authHeaders()),
          api.get('/products', authHeaders()),
        ]);

      setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
      setClients(Array.isArray(clientsResponse.data) ? clientsResponse.data : []);
      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
    } catch (error) {
      console.log('Erro ao carregar pedidos:', error);
      setOrders([]);
      setClients([]);
      setProducts([]);
    }
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

  const today = getToday();

  const filteredOrders = orders.filter((order) => {
    const meta = getOrderMeta(order.id);
    const text = search.toLowerCase();
    const orderStatus = String(order.status || '').toUpperCase();

    const matchesSearch =
      !text ||
      order.client?.name?.toLowerCase().includes(text) ||
      order.client?.phone?.toLowerCase().includes(text) ||
      order.client?.address?.toLowerCase().includes(text) ||
      order.paymentMethod?.toLowerCase().includes(text) ||
      order.status?.toLowerCase().includes(text) ||
      meta.returnItems?.toLowerCase().includes(text);

    const deliveredAndWaitingPickup = orderStatus === 'APPROVED';

    const shouldHideDeliveredFromOrders =
      !statusFilter &&
      !returnFilter &&
      !text &&
      deliveredAndWaitingPickup;

    if (shouldHideDeliveredFromOrders) {
      return false;
    }

    const matchesStatus =
      !statusFilter ||
      orderStatus === statusFilter;

    const matchesPayment =
      !paymentFilter ||
      String(order.paymentMethod || '').toUpperCase() === paymentFilter;

    const matchesReturn =
      !returnFilter ||
      (returnFilter === 'HOJE' && meta.pickupDate === today) ||
      (returnFilter === 'ATRASADO' &&
        meta.pickupDate &&
        meta.pickupDate < today &&
        orderStatus !== 'FINISHED') ||
      (returnFilter === 'AGENDADO' &&
        meta.pickupDate &&
        meta.pickupDate > today);

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

  function removeItem(index: number) {
    if (orderItems.length === 1) {
      setOrderItems([
        {
          productId: '',
          quantity: 1,
        },
      ]);

      return;
    }

    setOrderItems(orderItems.filter((_, itemIndex) => itemIndex !== index));
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
        (productItem) => productItem.id === item.productId
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
    const product =
      item.product ||
      products.find((productItem) => productItem.id === item.productId);

    return getProductDisplayName(product);
  }

  async function saveOrder(event: any) {
    event.preventDefault();

    try {
      setLoading(true);

      const form = new FormData(event.currentTarget);

      const clientId = String(form.get('clientId') || '');
      const paymentMethod = String(form.get('paymentMethod') || '');
      const deliveryDate = String(form.get('deliveryDate') || '');
      const observation = String(form.get('observation') || '');

      if (!clientId) {
        alert('Selecione um cliente.');
        return;
      }

      const validItems = orderItems.filter(
        (item) => item.productId && Number(item.quantity) > 0
      );

      if (validItems.length === 0) {
        alert('Adicione pelo menos um produto ao pedido.');
        return;
      }

      const items = validItems.map((item) => {
        const product = products.find(
          (productItem) => productItem.id === item.productId
        );

        const quantity = Number(item.quantity || 1);
        const unitPrice = Number(product?.salePrice || 0);

        return {
          productId: item.productId,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      });

      const total = calculateTotal();

      const data = {
        clientId,
        paymentMethod,
        status: editingOrder ? editingOrder.status || 'PENDING' : 'PENDING',
        total,
        note: buildOrderNote({
          deliveryDate,
          pickupDate: getOrderMeta(editingOrder?.id || '')?.pickupDate || '',
          returnItems: getOrderMeta(editingOrder?.id || '')?.returnItems || '',
          observation,
        }),
        items,
      };

      if (editingOrder) {
        await api.put(
          `/orders/${editingOrder.id}`,
          data,
          authHeaders()
        );

        saveOrderMeta(editingOrder.id, {
          deliveryDate,
          observation,
        });
      } else {
        const response = await api.post('/orders', data, authHeaders());

        if (response.data?.id) {
          saveOrderMeta(response.data.id, {
            deliveryDate,
            observation,
            pickupDate: '',
            returnItems: '',
          });
        }
      }

      setShowModal(false);
      setEditingOrder(null);

      setOrderItems([
        {
          productId: '',
          quantity: 1,
        },
      ]);

      await loadData();
    } catch (error) {
      console.log('Erro ao salvar pedido:', error);
      alert('Não foi possível salvar o pedido.');
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(order: any, status: string, extra: any = {}) {
    await api.put(
      `/orders/${order.id}`,
      {
        status,
        paymentMethod: order.paymentMethod || '',
        total: Number(order.total || 0),
        note: buildOrderNote({
          deliveryDate: getOrderMeta(order.id)?.deliveryDate || '',
          pickupDate: extra.pickupDate || getOrderMeta(order.id)?.pickupDate || '',
          returnItems: extra.returnItems || getOrderMeta(order.id)?.returnItems || '',
          observation: extra.observation || getOrderMeta(order.id)?.observation || '',
        }),
      },
      authHeaders()
    );
  }

  function openDeliveryModal(order: any) {
    setDeliveryOrder(order);
  }

  async function confirmDelivered(event: any) {
    event.preventDefault();

    if (!deliveryOrder) {
      return;
    }

    try {
      setLoading(true);

      const form = new FormData(event.currentTarget);

      const pickupDate = String(form.get('pickupDate') || '');
      const returnItems = String(form.get('returnItems') || '');
      const observation = String(form.get('observation') || '');

      if (!pickupDate) {
        alert('Coloque a data para buscar de volta.');
        return;
      }

      if (!returnItems.trim()) {
        alert('Coloque o que precisa buscar de volta.');
        return;
      }

      await updateOrderStatus(deliveryOrder, 'entregue', {
        pickupDate,
        returnItems,
        observation,
      });

      saveOrderMeta(deliveryOrder.id, {
        pickupDate,
        returnItems,
        observation,
        deliveredAt: new Date().toISOString(),
      });

      const withdrawals = readStorage(WITHDRAWALS_STORAGE_KEY, []);

      const withdrawalFromOrder = {
        id: `order-${deliveryOrder.id}`,
        orderId: deliveryOrder.id,
        client: deliveryOrder.client?.name || 'Cliente não informado',
        phone: deliveryOrder.client?.phone || '',
        address: deliveryOrder.client?.address || '',
        item: returnItems,
        deliveryDate: getOrderMeta(deliveryOrder.id)?.deliveryDate || '',
        pickupDate,
        observation:
          observation ||
          `Retirada criada automaticamente pelo pedido ${deliveryOrder.id}`,
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
        finishedAt: null,
      };

      const withoutOldSameOrder = withdrawals.filter(
        (item: any) => item.orderId !== deliveryOrder.id
      );

      writeStorage(WITHDRAWALS_STORAGE_KEY, [
        withdrawalFromOrder,
        ...withoutOldSameOrder,
      ]);

      setDeliveryOrder(null);

      await loadData();

      alert('Pedido marcado como entregue e retirada agendada.');
    } catch (error) {
      console.log('Erro ao confirmar entrega:', error);
      alert('Não foi possível confirmar a entrega.');
    } finally {
      setLoading(false);
    }
  }

  async function finalizeOrder(order: any) {
    const confirmFinish = window.confirm(
      'Tem certeza que deseja finalizar esse pedido?'
    );

    if (!confirmFinish) {
      return;
    }

    try {
      setLoading(true);

      await updateOrderStatus(order, 'finalizado');

      await loadData();

      alert('Pedido finalizado.');
    } catch (error) {
      console.log('Erro ao finalizar pedido:', error);
      alert('Não foi possível finalizar o pedido.');
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(order: any) {
    const confirmCancel = window.confirm(
      'Tem certeza que deseja cancelar esse pedido?'
    );

    if (!confirmCancel) {
      return;
    }

    try {
      setLoading(true);

      await updateOrderStatus(order, 'cancelado');

      await loadData();

      alert('Pedido cancelado.');
    } catch (error) {
      console.log('Erro ao cancelar pedido:', error);
      alert('Não foi possível cancelar o pedido.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(order: any) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja apagar esse pedido?\n\nO estoque será devolvido e a entrada financeira automática será apagada.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      await api.delete(`/orders/${order.id}`, authHeaders());

      removeOrderMeta(order.id);

      const withdrawals = readStorage(WITHDRAWALS_STORAGE_KEY, []);
      const updatedWithdrawals = withdrawals.filter(
        (item: any) => item.orderId !== order.id
      );

      writeStorage(WITHDRAWALS_STORAGE_KEY, updatedWithdrawals);

      await loadData();

      alert('Pedido apagado com sucesso.');
    } catch (error) {
      console.log('Erro ao apagar pedido:', error);
      alert('Não foi possível apagar o pedido.');
    } finally {
      setLoading(false);
    }
  }

  function printDeliveryNote() {
    window.print();
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

            body * {
              visibility: hidden !important;
            }

            #delivery-note-print-wrapper,
            #delivery-note-print-wrapper *,
            #delivery-note-print-card,
            #delivery-note-print-card *,
            #delivery-note-print,
            #delivery-note-print * {
              visibility: visible !important;
            }

            #delivery-note-print-wrapper {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              min-height: auto !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
            }

            #delivery-note-print-card {
              position: static !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              border: none !important;
              display: block !important;
            }

            #delivery-note-print {
              display: block !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              font-size: 11px !important;
              line-height: 1.25 !important;
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

            #delivery-note-print h1 {
              font-size: 30px !important;
              margin: 0 0 3px 0 !important;
            }

            #delivery-note-print h2 {
              font-size: 15px !important;
              margin: 0 0 6px 0 !important;
            }

            #delivery-note-print p {
              margin: 0 !important;
            }

            .no-print,
            .no-print * {
              display: none !important;
              visibility: hidden !important;
            }
          }
        `}
      </style>

      <div className="no-print">
        <PageHeader
          title="Pedidos"
          description="Pedidos em aberto. Depois de entregue, o pedido vai para Retiradas"
        />

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            placeholder="Pesquisar por cliente, telefone, endereço, pagamento ou retirada..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={inputClass}
          />

          <button
            onClick={openNewOrder}
            className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Pedido
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Pedidos em aberto</option>
            <option value="PENDING">Pendente</option>
            <option value="APPROVED">Entregue / em retirada</option>
            <option value="FINISHED">Finalizado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Todos os pagamentos</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CARTAO">Cartão</option>
            <option value="FIADO">Fiado</option>
            <option value="PAGO">Pago</option>
          </select>

          <select
            value={returnFilter}
            onChange={(event) => setReturnFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Todas as retiradas</option>
            <option value="HOJE">Buscar hoje</option>
            <option value="ATRASADO">Atrasadas</option>
            <option value="AGENDADO">Agendadas</option>
          </select>

          <button
            onClick={loadData}
            className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-6 py-3 font-bold"
          >
            Atualizar
          </button>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead className="bg-black">
              <tr className="text-left text-zinc-400">
                <th className="p-5">Cliente</th>
                <th className="p-5">Telefone</th>
                <th className="p-5">Entrega</th>
                <th className="p-5">Buscar volta</th>
                <th className="p-5">Itens</th>
                <th className="p-5">Pagamento</th>
                <th className="p-5">Total</th>
                <th className="p-5">Status</th>
                <th className="p-5">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => {
                const meta = getOrderMeta(order.id);
                const status = String(order.status || '').toUpperCase();

                return (
                  <tr key={order.id} className="border-t border-zinc-800">
                    <td className="p-5 font-bold">
                      {order.client?.name || 'Cliente não informado'}
                      <p className="text-xs text-zinc-500 mt-1">
                        {order.client?.address || 'Sem endereço'}
                      </p>
                    </td>

                    <td className="p-5 text-zinc-400">
                      {order.client?.phone || '-'}
                    </td>

                    <td className="p-5 text-zinc-400">
                      {formatDate(meta.deliveryDate)}
                    </td>

                    <td className="p-5 text-zinc-400">
                      {meta.pickupDate ? (
                        <div>
                          <p className="font-bold text-yellow-400">
                            {formatDate(meta.pickupDate)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {meta.returnItems || 'Sem itens informados'}
                          </p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="p-5 text-zinc-400">
                      <div className="space-y-1">
                        {getOrderItems(order).map((item: any) => (
                          <p key={item.id || `${item.productId}-${item.quantity}`}>
                            {item.quantity}x {getProductName(item)}
                          </p>
                        ))}
                      </div>
                    </td>

                    <td className="p-5 text-zinc-400">
                      {order.paymentMethod || '-'}
                    </td>

                    <td className="p-5 text-yellow-400 font-black">
                      {formatMoney(order.total)}
                    </td>

                    <td className="p-5">
                      <span
                        className={`${getStatusClass(order.status)} px-4 py-2 rounded-full text-sm font-bold`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-2"
                        >
                          <FileText size={17} />
                          Nota
                        </button>

                        <button
                          onClick={() => openEditOrder(order)}
                          className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-2"
                        >
                          <Pencil size={17} />
                          Editar
                        </button>

                        {status !== 'APPROVED' && status !== 'FINISHED' && (
                          <button
                            onClick={() => openDeliveryModal(order)}
                            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-2"
                          >
                            <Truck size={17} />
                            Foi entregue
                          </button>
                        )}

                        {status === 'APPROVED' && (
                          <button
                            onClick={() => finalizeOrder(order)}
                            className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-2"
                          >
                            <PackageCheck size={17} />
                            Finalizar
                          </button>
                        )}

                        {status !== 'FINISHED' && (
                          <button
                            onClick={() => cancelOrder(order)}
                            className="bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-2"
                          >
                            <X size={17} />
                            Cancelar
                          </button>
                        )}

                        <button
                          onClick={() => deleteOrder(order)}
                          className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-2"
                        >
                          <Trash2 size={17} />
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td className="p-5 text-zinc-500" colSpan={9}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 no-print">
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
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>

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

              <div>
                <label className="block mb-2 text-sm font-bold text-zinc-300">
                  Data da entrega
                </label>

                <input
                  name="deliveryDate"
                  type="date"
                  defaultValue={
                    editingOrder ? getOrderMeta(editingOrder.id)?.deliveryDate || '' : ''
                  }
                  className={inputClass}
                />
              </div>

              <textarea
                name="observation"
                placeholder="Observação do pedido. Ex: entregar depois das 18h..."
                defaultValue={
                  editingOrder ? getOrderMeta(editingOrder.id)?.observation || '' : ''
                }
                className={`${inputClass} min-h-[100px]`}
              />

              <div className="space-y-4">
                <h3 className="text-xl font-black text-yellow-400">
                  Produtos
                </h3>

                {orderItems.map((item, index) => {
                  const product = products.find(
                    (productItem) => productItem.id === item.productId
                  );

                  return (
                    <div
                      key={index}
                      className="grid md:grid-cols-[1fr_120px_120px] gap-3"
                    >
                      <select
                        value={item.productId}
                        onChange={(event) =>
                          updateItem(index, 'productId', event.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Selecione um produto</option>

                        {products.map((productItem) => (
                          <option key={productItem.id} value={productItem.id}>
                            {getProductDisplayName(productItem)} - {formatMoney(productItem.salePrice)}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, 'quantity', event.target.value)
                        }
                        className={inputClass}
                      />

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="bg-red-500/20 text-red-400 rounded-2xl font-bold"
                      >
                        Remover
                      </button>

                      {product && (
                        <p className="md:col-span-3 text-sm text-zinc-500">
                          Estoque atual: {product.stock} {product.unit}
                        </p>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addItem}
                  className="bg-zinc-800 rounded-2xl px-5 py-3 font-bold"
                >
                  Adicionar Produto
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                <p className="text-zinc-400 font-bold">
                  Total do pedido
                </p>

                <p className="text-3xl font-black text-yellow-400">
                  {formatMoney(calculateTotal())}
                </p>
              </div>

              <button
                disabled={loading}
                className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Pedido'}
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

      {deliveryOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 no-print">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-2">
              Pedido entregue
            </h2>

            <p className="text-zinc-400 mb-6">
              Agora informe quando e o que precisa buscar de volta.
            </p>

            <form onSubmit={confirmDelivered} className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm font-bold">
                  Cliente
                </p>

                <p className="text-xl font-black">
                  {deliveryOrder.client?.name || 'Cliente não informado'}
                </p>

                <p className="text-zinc-400">
                  {deliveryOrder.client?.address || 'Sem endereço'}
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-zinc-300">
                  Data para buscar de volta
                </label>

                <input
                  name="pickupDate"
                  type="date"
                  defaultValue={getOrderMeta(deliveryOrder.id)?.pickupDate || ''}
                  className={inputClass}
                />
              </div>

              <textarea
                name="returnItems"
                placeholder="O que precisa buscar? Ex: 1 chopeira, 2 barris, cascos..."
                defaultValue={getOrderMeta(deliveryOrder.id)?.returnItems || ''}
                className={`${inputClass} min-h-[100px]`}
              />

              <textarea
                name="observation"
                placeholder="Observação. Ex: ligar antes, buscar depois das 18h..."
                defaultValue={getOrderMeta(deliveryOrder.id)?.observation || ''}
                className={`${inputClass} min-h-[100px]`}
              />

              <button
                disabled={loading}
                className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Confirmar entrega e agendar retirada'}
              </button>

              <button
                type="button"
                onClick={() => setDeliveryOrder(null)}
                className="w-full bg-zinc-800 rounded-2xl py-4 font-bold"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          id="delivery-note-print-wrapper"
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
        >
          <div
            id="delivery-note-print-card"
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white text-black rounded-3xl p-8"
          >
            <div id="delivery-note-print">
              <div className="border-b-4 border-black pb-5 mb-5">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h1 className="text-5xl font-black tracking-tight">
                      RJ CHOPP
                    </h1>

                    <p className="text-lg font-black text-zinc-700">
                      Ficha de entrega e retirada
                    </p>

                    <p className="text-zinc-600">
                      Loanda - Paraná | (44) 99958-8160
                    </p>
                  </div>

                  <div className="text-right border-2 border-black rounded-2xl p-4 min-w-[190px]">
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Pedido
                    </p>

                    <p className="text-2xl font-black">
                      #{getShortId(selectedOrder.id)}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      Emitido em {new Date().toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="border border-zinc-300 rounded-2xl p-4">
                  <h2 className="text-lg font-black mb-3">
                    Dados do cliente
                  </h2>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Cliente
                      </p>
                      <p className="font-black">
                        {selectedOrder.client?.name || 'Cliente não informado'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Telefone
                      </p>
                      <p>
                        {selectedOrder.client?.phone || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Endereço
                      </p>
                      <p>
                        {selectedOrder.client?.address || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-zinc-300 rounded-2xl p-4">
                  <h2 className="text-lg font-black mb-3">
                    Dados do pedido
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Pagamento
                      </p>
                      <p className="font-bold">
                        {selectedOrder.paymentMethod || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Status
                      </p>
                      <p className="font-bold">
                        {getStatusLabel(selectedOrder.status)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Entrega
                      </p>
                      <p className="font-bold">
                        {formatDate(getOrderMeta(selectedOrder.id)?.deliveryDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Buscar de volta
                      </p>
                      <p className="font-bold">
                        {formatDate(getOrderMeta(selectedOrder.id)?.pickupDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-black mb-3">
                  Produtos do pedido
                </h2>

                <table className="w-full border border-zinc-400">
                  <thead>
                    <tr className="bg-zinc-100 text-left">
                      <th className="p-3 border border-zinc-400">Produto</th>
                      <th className="p-3 border border-zinc-400 w-[110px]">Qtd</th>
                      <th className="p-3 border border-zinc-400 w-[150px]">Valor unit.</th>
                      <th className="p-3 border border-zinc-400 w-[150px]">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {getOrderItems(selectedOrder).map((item: any) => (
                      <tr key={item.id || `${item.productId}-${item.quantity}`}>
                        <td className="p-3 border border-zinc-400 font-bold">
                          {getProductName(item)}
                        </td>

                        <td className="p-3 border border-zinc-400">
                          {item.quantity}
                        </td>

                        <td className="p-3 border border-zinc-400">
                          {formatMoney(getItemUnitPrice(item))}
                        </td>

                        <td className="p-3 border border-zinc-400 font-black">
                          {formatMoney(item.total)}
                        </td>
                      </tr>
                    ))}

                    {getOrderItems(selectedOrder).length === 0 && (
                      <tr>
                        <td className="p-3 border border-zinc-400" colSpan={4}>
                          Nenhum produto encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="border border-zinc-300 rounded-2xl p-4 min-h-[120px]">
                  <h2 className="text-lg font-black mb-2">
                    Itens para buscar de volta
                  </h2>

                  <p className="whitespace-pre-wrap">
                    {getOrderMeta(selectedOrder.id)?.returnItems || '-'}
                  </p>
                </div>

                <div className="border border-zinc-300 rounded-2xl p-4 min-h-[120px]">
                  <h2 className="text-lg font-black mb-2">
                    Observação
                  </h2>

                  <p className="whitespace-pre-wrap">
                    {getOrderMeta(selectedOrder.id)?.observation || selectedOrder.note || '-'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mb-8">
                <div className="border-2 border-black rounded-2xl p-5 min-w-[260px] text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase">
                    Total do pedido
                  </p>

                  <p className="text-3xl font-black">
                    {formatMoney(selectedOrder.total)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 mt-12">
                <div>
                  <p className="text-sm text-zinc-500 mb-10">
                    Assinatura do cliente
                  </p>

                  <div className="border-b-2 border-black" />

                  <p className="text-xs text-zinc-500 mt-2">
                    Confirmo o recebimento dos produtos acima.
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 mb-10">
                    Assinatura do entregador
                  </p>

                  <div className="border-b-2 border-black" />

                  <p className="text-xs text-zinc-500 mt-2">
                    Responsável pela entrega/retirada.
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-300 mt-8 pt-3 text-xs text-zinc-500 text-center">
                RJ Chopp SGE • Documento gerado automaticamente pelo sistema
              </div>
            </div>

            <div className="flex gap-3 mt-6 no-print">
              <button
                onClick={printDeliveryNote}
                className="flex-1 bg-yellow-400 text-black rounded-2xl py-4 font-black"
              >
                Imprimir
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-zinc-800 text-white rounded-2xl py-4 font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
