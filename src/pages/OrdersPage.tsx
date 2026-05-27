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
  Search,
  RefreshCcw,
  CalendarDays,
  User,
  Phone,
  MapPin,
  Wallet,
  Package,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';
import {
  addOfflineAction,
  getOfflineOrders,
  isOnline,
  saveOfflineOrder,
} from '../services/offline';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

const WITHDRAWALS_STORAGE_KEY = 'rjchopp_withdrawals';
const ORDER_META_STORAGE_KEY = 'rjchopp_order_meta';
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

function getCompanySettings() {
  return {
    ...defaultCompanySettings,
    ...readStorage(COMPANY_SETTINGS_STORAGE_KEY, {}),
  };
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
    return 'border-green-500/25 bg-green-500/15 text-green-400';
  }

  if (value === 'APPROVED') {
    return 'border-blue-500/25 bg-blue-500/15 text-blue-400';
  }

  if (value === 'CANCELLED' || value === 'CANCELED') {
    return 'border-red-500/25 bg-red-500/15 text-red-400';
  }

  return 'border-yellow-500/25 bg-yellow-500/15 text-yellow-400';
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

function isAccessoryProduct(product: any) {
  const text = `${product?.name || ''} ${product?.category || ''} ${product?.brand || ''}`.toLowerCase();

  return (
    text.includes('chopeira') ||
    text.includes('chopera') ||
    text.includes('cilindro')
  );
}

function getProductsForOrderSelect(products: any[], selectedProductId: string) {
  return products.filter((product) => {
    if (product.id === selectedProductId) {
      return true;
    }

    return !isAccessoryProduct(product);
  });
}

function getProductSearchText(product: any) {
  return [
    product?.name,
    product?.brand,
    product?.category,
    product?.unit,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isChoppOrBarrelProduct(product: any) {
  const text = getProductSearchText(product);

  return (
    text.includes('chopp') ||
    text.includes('chope') ||
    text.includes('barril') ||
    text.includes('keg')
  );
}

function isChopeiraProduct(product: any) {
  const text = getProductSearchText(product);

  return (
    text.includes('chopeira') ||
    text.includes('choperia')
  );
}

function isCilindroProduct(product: any) {
  const text = getProductSearchText(product);

  return text.includes('cilindro');
}

function hasStockAlreadyDiscounted(order: any, meta: any) {
  if (meta.stockDiscounted === true) {
    return true;
  }

  if (order?.stockDiscounted === true) {
    return true;
  }

  return false;
}

function isFutureScheduledOrder(order: any, meta: any, today: string) {
  const status = String(order.status || '').toUpperCase();
  const deliveryDate = String(meta.deliveryDate || '');

  if (!deliveryDate) {
    return false;
  }

  if (status !== 'PENDING') {
    return false;
  }

  if (hasStockAlreadyDiscounted(order, meta)) {
    return false;
  }

  return deliveryDate > today;
}

function isScheduledForToday(order: any, meta: any, today: string) {
  const status = String(order.status || '').toUpperCase();
  const deliveryDate = String(meta.deliveryDate || '');

  if (!deliveryDate) {
    return false;
  }

  if (status !== 'PENDING') {
    return false;
  }

  if (hasStockAlreadyDiscounted(order, meta)) {
    return false;
  }

  return deliveryDate === today;
}

function isLateScheduledOrder(order: any, meta: any, today: string) {
  const status = String(order.status || '').toUpperCase();
  const deliveryDate = String(meta.deliveryDate || '');

  if (!deliveryDate) {
    return false;
  }

  if (status !== 'PENDING') {
    return false;
  }

  return deliveryDate < today;
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

      const onlineOrders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      const offlineOrders = getOfflineOrders();

      setOrders([
        ...offlineOrders,
        ...onlineOrders,
      ]);

      setClients(Array.isArray(clientsResponse.data) ? clientsResponse.data : []);
      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
    } catch (error) {
      console.log('Erro ao carregar pedidos:', error);
      setOrders(getOfflineOrders());
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
    const futureScheduledOrder = isFutureScheduledOrder(order, meta, today);
    const scheduledForToday = isScheduledForToday(order, meta, today);
    const lateScheduledOrder = isLateScheduledOrder(order, meta, today);

    if (statusFilter === 'AGENDADO') {
      const matchesPayment =
        !paymentFilter ||
        String(order.paymentMethod || '').toUpperCase() === paymentFilter;

      return matchesSearch && matchesPayment && futureScheduledOrder;
    }

    if (statusFilter === 'ATRASADO') {
      const matchesPayment =
        !paymentFilter ||
        String(order.paymentMethod || '').toUpperCase() === paymentFilter;

      return matchesSearch && matchesPayment && lateScheduledOrder;
    }

    const shouldHideDeliveredFromOrders =
      !statusFilter &&
      !returnFilter &&
      !text &&
      deliveredAndWaitingPickup;

    if (shouldHideDeliveredFromOrders) {
      return false;
    }

    const shouldHideFutureScheduledFromOpenOrders =
      !statusFilter &&
      !returnFilter &&
      !text &&
      futureScheduledOrder;

    if (shouldHideFutureScheduledFromOpenOrders) {
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

    if (!statusFilter && (scheduledForToday || lateScheduledOrder)) {
      return matchesSearch && matchesPayment && matchesReturn;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesReturn;
  });

  const orderStats = useMemo(() => {
    const open = filteredOrders.filter((order) => {
      const status = String(order.status || '').toUpperCase();
      return status === 'PENDING' || !status;
    }).length;

    const delivered = filteredOrders.filter((order) => {
      const status = String(order.status || '').toUpperCase();
      return status === 'APPROVED';
    }).length;

    const late = filteredOrders.filter((order) => {
      const meta = getOrderMeta(order.id);
      return isLateScheduledOrder(order, meta, today);
    }).length;

    const total = filteredOrders.reduce((sum, order) => {
      return sum + Number(order.total || 0);
    }, 0);

    return {
      open,
      delivered,
      late,
      total,
    };
  }, [filteredOrders, today]);

  function findChopeiraProduct() {
    return products.find((product) => isChopeiraProduct(product));
  }

  function findCilindroProduct() {
    return products.find((product) => isCilindroProduct(product));
  }

  function addAutomaticChoppAccessories(items: any[]) {
    const selectedProducts = items
      .map((item) =>
        products.find((product) => product.id === item.productId)
      )
      .filter(Boolean);

    const hasChoppOrBarrel = selectedProducts.some((product) =>
      isChoppOrBarrelProduct(product)
    );

    if (!hasChoppOrBarrel) {
      return items;
    }

    const chopeira = findChopeiraProduct();
    const cilindro = findCilindroProduct();

    const alreadyHasChopeira = items.some((item) => {
      const product = products.find(
        (productItem) => productItem.id === item.productId
      );

      return isChopeiraProduct(product);
    });

    const alreadyHasCilindro = items.some((item) => {
      const product = products.find(
        (productItem) => productItem.id === item.productId
      );

      return isCilindroProduct(product);
    });

    const updated = [...items];

    if (chopeira && !alreadyHasChopeira) {
      updated.push({
        productId: chopeira.id,
        quantity: 1,
      });
    }

    if (cilindro && !alreadyHasCilindro) {
      updated.push({
        productId: cilindro.id,
        quantity: 1,
      });
    }

    return updated;
  }

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

    if (field === 'productId') {
      setOrderItems(addAutomaticChoppAccessories(updated));
      return;
    }

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

  function createOfflineOrder(data: any, metaData: any) {
    const client = clients.find((clientItem) => clientItem.id === data.clientId);

    const offlineItems = data.items.map((item: any) => {
      const product = products.find(
        (productItem) => productItem.id === item.productId
      );

      return {
        id: `${Date.now()}-${item.productId}`,
        productId: item.productId,
        product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      };
    });

    return {
      id: `offline-${Date.now()}`,
      clientId: data.clientId,
      client,
      status: data.status || 'PENDING',
      total: data.total,
      paymentMethod: data.paymentMethod,
      note: data.note,
      items: offlineItems,
      stockDiscounted: data.discountStockNow,
      createdAt: new Date().toISOString(),
      offlinePending: true,
      metaData,
    };
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
      const discountStockNowValue = String(form.get('discountStockNow') || 'SIM');
      const discountStockNow = discountStockNowValue === 'SIM';

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
        discountStockNow: editingOrder
          ? hasStockAlreadyDiscounted(editingOrder, getOrderMeta(editingOrder.id))
          : discountStockNow,
      };

      console.log('Descontar estoque agora?', data.discountStockNow);

      if (!isOnline() && !editingOrder) {
        const offlineOrder = createOfflineOrder(data, {
          deliveryDate,
          observation,
          pickupDate: '',
          returnItems: '',
          stockDiscounted: discountStockNow,
        });

        saveOfflineOrder(offlineOrder);

        saveOrderMeta(offlineOrder.id, {
          deliveryDate,
          observation,
          pickupDate: '',
          returnItems: '',
          stockDiscounted: discountStockNow,
        });

        addOfflineAction({
          type: 'CREATE_ORDER',
          title: 'Criar pedido offline',
          payload: {
            tempOrderId: offlineOrder.id,
            data,
            meta: {
              deliveryDate,
              observation,
              pickupDate: '',
              returnItems: '',
              stockDiscounted: discountStockNow,
            },
            config: authHeaders(),
          },
        });

        addAuditLog({
          area: 'Pedidos',
          action: 'CREATE',
          title: `Pedido criado offline: ${offlineOrder.client?.name || 'Cliente não informado'}`,
          description: `Total: ${formatMoney(total)}\nEntrega: ${formatDate(deliveryDate)}\nEsse pedido será sincronizado quando a internet voltar.`,
        });

        setOrders([offlineOrder, ...orders]);
        setShowModal(false);
        setEditingOrder(null);
        setOrderItems([
          {
            productId: '',
            quantity: 1,
          },
        ]);

        alert('Pedido salvo offline. Quando a internet voltar, o sistema vai sincronizar.');
        return;
      }

      if (!isOnline() && editingOrder) {
        alert('Editar pedido offline ainda não está liberado. Conecte na internet para editar.');
        return;
      }

      if (editingOrder) {
        await api.put(
          `/orders/${editingOrder.id}`,
          data,
          authHeaders()
        );

        saveOrderMeta(editingOrder.id, {
          deliveryDate,
          observation,
          stockDiscounted: hasStockAlreadyDiscounted(editingOrder, getOrderMeta(editingOrder.id)),
        });

        addAuditLog({
          area: 'Pedidos',
          action: 'UPDATE',
          title: `Pedido editado: ${editingOrder.client?.name || 'Cliente não informado'}`,
          description: `Total: ${formatMoney(total)}\nEntrega: ${formatDate(deliveryDate)}\nPagamento: ${paymentMethod || '-'}`,
        });
      } else {
        const response = await api.post('/orders', data, authHeaders());

        if (response.data?.id) {
          saveOrderMeta(response.data.id, {
            deliveryDate,
            observation,
            pickupDate: '',
            returnItems: '',
            stockDiscounted: discountStockNow,
          });

          const client = clients.find((clientItem) => clientItem.id === clientId);

          addAuditLog({
            area: 'Pedidos',
            action: 'CREATE',
            title: `Pedido criado: ${client?.name || 'Cliente não informado'}`,
            description: `Total: ${formatMoney(total)}\nEntrega: ${formatDate(deliveryDate)}\nPagamento: ${paymentMethod || '-'}\nEstoque: ${discountStockNow ? 'Baixado agora' : 'Agendado sem baixar estoque'}`,
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
        discountStockNow: extra.discountStockNow === true,
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

      const stockWasAlreadyDiscounted = hasStockAlreadyDiscounted(
        deliveryOrder,
        getOrderMeta(deliveryOrder.id)
      );

      await updateOrderStatus(deliveryOrder, 'APPROVED', {
        pickupDate,
        returnItems,
        observation,
        discountStockNow: !stockWasAlreadyDiscounted,
      });

      saveOrderMeta(deliveryOrder.id, {
        pickupDate,
        returnItems,
        observation,
        deliveredAt: new Date().toISOString(),
        stockDiscounted: true,
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

      addAuditLog({
        area: 'Pedidos',
        action: 'DELIVERED',
        title: `Pedido entregue: ${deliveryOrder.client?.name || 'Cliente não informado'}`,
        description: `Retirada agendada para ${formatDate(pickupDate)}\nItens para buscar: ${returnItems}`,
      });

      addAuditLog({
        area: 'Retiradas',
        action: 'CREATE',
        title: `Retirada criada pelo pedido: ${deliveryOrder.client?.name || 'Cliente não informado'}`,
        description: `Buscar em: ${formatDate(pickupDate)}\nItens: ${returnItems}`,
      });

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

      await updateOrderStatus(order, 'FINISHED');

      await loadData();

      addAuditLog({
        area: 'Pedidos',
        action: 'FINISHED',
        title: `Pedido finalizado: ${order.client?.name || 'Cliente não informado'}`,
        description: `Pedido #${getShortId(order.id)} finalizado.`,
      });

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

      await updateOrderStatus(order, 'CANCELLED');

      await loadData();

      addAuditLog({
        area: 'Pedidos',
        action: 'CANCELLED',
        title: `Pedido cancelado: ${order.client?.name || 'Cliente não informado'}`,
        description: `Pedido #${getShortId(order.id)} cancelado.`,
      });

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
      `Tem certeza que deseja apagar esse pedido?\n\nSe o estoque já tiver sido descontado, ele será devolvido. A entrada financeira automática será apagada.`
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

      addAuditLog({
        area: 'Pedidos',
        action: 'DELETE',
        title: `Pedido apagado: ${order.client?.name || 'Cliente não informado'}`,
        description: `Pedido #${getShortId(order.id)} apagado. Total: ${formatMoney(order.total)}`,
      });

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
          description="Controle de pedidos, entregas, estoque agendado, notas e retiradas automáticas."
        />

        <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_36%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-zinc-300">Pedidos listados</p>
                <p className="mt-6 text-4xl font-black text-white">{filteredOrders.length}</p>
              </div>
              <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                <ClipboardList size={22} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_36%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-zinc-300">Pendentes</p>
                <p className="mt-6 text-4xl font-black text-white">{orderStats.open}</p>
              </div>
              <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                <CalendarDays size={22} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-blue-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(59,130,246,.08)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.14),transparent_36%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-zinc-300">Em retirada</p>
                <p className="mt-6 text-4xl font-black text-white">{orderStats.delivered}</p>
              </div>
              <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-3 text-blue-400">
                <Truck size={22} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-red-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(239,68,68,.08)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,.14),transparent_36%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-zinc-300">Total filtrado</p>
                <p className="mt-6 text-3xl font-black text-white">{formatMoney(orderStats.total)}</p>
              </div>
              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-red-400">
                <Wallet size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
            />

            <input
              placeholder="Pesquisar por cliente, telefone, endereço, pagamento ou retirada..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClass} pl-12`}
            />
          </div>

          <button
            onClick={openNewOrder}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(250,204,21,.35)]"
          >
            <Plus size={20} />
            Novo Pedido
          </button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Pedidos em aberto</option>
            <option value="AGENDADO">Pedidos agendados</option>
            <option value="ATRASADO">Pedidos atrasados</option>
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
            className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-6 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
          >
            <RefreshCcw size={18} />
            Atualizar
          </button>
        </div>

        <PremiumPanel>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1250px]">
              <thead>
                <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
                  <th className="p-5">Cliente</th>
                  <th className="p-5">Telefone</th>
                  <th className="p-5">Entrega</th>
                  <th className="p-5">Buscar volta</th>
                  <th className="p-5">Itens</th>
                  <th className="p-5">Pagamento</th>
                  <th className="p-5">Total</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Estoque</th>
                  <th className="p-5">Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const meta = getOrderMeta(order.id);
                  const status = String(order.status || '').toUpperCase();
                  const lateScheduledOrder = isLateScheduledOrder(order, meta, today);

                  return (
                    <tr
                      key={order.id}
                      className={`border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035] ${
                        lateScheduledOrder ? 'bg-red-500/10' : ''
                      }`}
                    >
                      <td className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                            <User size={18} />
                          </div>

                          <div>
                            <p className="font-black text-white">
                              {order.client?.name || 'Cliente não informado'}
                            </p>

                            {order.offlinePending && (
                              <p className="mt-1 text-xs font-black text-yellow-400">
                                Pendente de sincronizar
                              </p>
                            )}

                            <p className="mt-1 text-xs text-zinc-500">
                              {order.client?.address || 'Sem endereço'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-yellow-400" />
                          {order.client?.phone || '-'}
                        </div>
                      </td>

                      <td className="p-5 text-zinc-400">
                        <div>
                          <p>{formatDate(meta.deliveryDate)}</p>

                          {lateScheduledOrder && (
                            <p className="mt-1 text-xs font-black text-red-400">
                              Pedido atrasado
                            </p>
                          )}

                          {isFutureScheduledOrder(order, meta, today) && (
                            <p className="mt-1 text-xs font-bold text-blue-400">
                              Pedido agendado
                            </p>
                          )}

                          {isScheduledForToday(order, meta, today) && (
                            <p className="mt-1 text-xs font-bold text-yellow-400">
                              Entrega hoje
                            </p>
                          )}
                        </div>
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

                      <td className="p-5 font-black text-yellow-400">
                        {formatMoney(order.total)}
                      </td>

                      <td className="p-5">
                        {lateScheduledOrder ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/15 px-4 py-2 text-sm font-black text-red-400">
                            <AlertTriangle size={16} />
                            Pedido atrasado
                          </span>
                        ) : (
                          <span
                            className={`${getStatusClass(order.status)} inline-flex rounded-full border px-4 py-2 text-sm font-black`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        )}
                      </td>

                      <td className="p-5">
                        {hasStockAlreadyDiscounted(order, meta) ? (
                          <span className="inline-flex rounded-full border border-green-500/25 bg-green-500/15 px-4 py-2 text-sm font-black text-green-400">
                            Baixado
                          </span>
                        ) : lateScheduledOrder ? (
                          <span className="inline-flex rounded-full border border-red-500/25 bg-red-500/15 px-4 py-2 text-sm font-black text-red-400">
                            Atrasado
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-blue-500/25 bg-blue-500/15 px-4 py-2 text-sm font-black text-blue-400">
                            Agendado
                          </span>
                        )}
                      </td>

                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                          >
                            <FileText size={17} />
                            Nota
                          </button>

                          <button
                            disabled={order.offlinePending}
                            onClick={() => openEditOrder(order)}
                            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-black/45 px-3 py-2 text-sm font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400 disabled:opacity-50"
                          >
                            <Pencil size={17} />
                            Editar
                          </button>

                          {status !== 'APPROVED' && status !== 'FINISHED' && (
                            <button
                              disabled={order.offlinePending}
                              onClick={() => openDeliveryModal(order)}
                              className="flex items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/15 px-3 py-2 text-sm font-black text-blue-400 transition hover:bg-blue-500 hover:text-white disabled:opacity-50"
                            >
                              <Truck size={17} />
                              Foi entregue
                            </button>
                          )}

                          {status === 'APPROVED' && (
                            <button
                              onClick={() => finalizeOrder(order)}
                              className="flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/15 px-3 py-2 text-sm font-black text-green-400 transition hover:bg-green-500 hover:text-white"
                            >
                              <PackageCheck size={17} />
                              Finalizar
                            </button>
                          )}

                          {status !== 'FINISHED' && (
                            <button
                              onClick={() => cancelOrder(order)}
                              className="flex items-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/15 px-3 py-2 text-sm font-black text-orange-400 transition hover:bg-orange-500 hover:text-white"
                            >
                              <X size={17} />
                              Cancelar
                            </button>
                          )}

                          <button
                            onClick={() => deleteOrder(order)}
                            className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/15 px-3 py-2 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
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
                    <td className="p-6 text-zinc-500" colSpan={10}>
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PremiumPanel>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm no-print">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Pedidos
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    {editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
                  }}
                  className="rounded-2xl border border-yellow-500/20 bg-black/45 p-3 text-zinc-300 transition hover:bg-yellow-400 hover:text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={saveOrder} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Cliente">
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
                  </Field>

                  <Field label="Forma de pagamento">
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
                  </Field>

                  <Field label="Data da entrega">
                    <input
                      name="deliveryDate"
                      type="date"
                      defaultValue={
                        editingOrder ? getOrderMeta(editingOrder.id)?.deliveryDate || '' : ''
                      }
                      className={inputClass}
                    />
                  </Field>

                  {!editingOrder && (
                    <Field label="Descontar estoque agora?">
                      <select
                        name="discountStockNow"
                        defaultValue="SIM"
                        className={inputClass}
                      >
                        <option value="SIM">
                          Sim, baixar estoque agora
                        </option>

                        <option value="NAO">
                          Não, deixar pedido agendado
                        </option>
                      </select>
                    </Field>
                  )}
                </div>

                {!editingOrder && (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-blue-300">
                    <p className="font-bold">
                      Escolha “Não” para pedido futuro. Nesse caso o estoque só baixa quando clicar em “Foi entregue”.
                    </p>
                  </div>
                )}

                {editingOrder && (
                  <div className="rounded-2xl border border-yellow-500/15 bg-black/45 p-5">
                    <p className="mb-2 text-sm font-black text-zinc-300">
                      Situação do estoque
                    </p>

                    {hasStockAlreadyDiscounted(editingOrder, getOrderMeta(editingOrder.id)) ? (
                      <p className="font-black text-green-400">
                        Estoque já foi descontado
                      </p>
                    ) : (
                      <p className="font-black text-blue-400">
                        Pedido agendado sem descontar estoque
                      </p>
                    )}
                  </div>
                )}

                <Field label="Observação">
                  <textarea
                    name="observation"
                    placeholder="Observação do pedido. Ex: entregar depois das 18h..."
                    defaultValue={
                      editingOrder ? getOrderMeta(editingOrder.id)?.observation || '' : ''
                    }
                    className={`${inputClass} min-h-[110px] resize-none`}
                  />
                </Field>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-400">
                      <Package size={22} />
                    </div>

                    <h3 className="text-xl font-black text-yellow-400">
                      Produtos
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-yellow-500/15 bg-black/45 p-4">
                    <p className="text-sm text-zinc-400">
                      Ao adicionar um produto de chopp/barril, o sistema sugere automaticamente
                      <span className="font-bold text-yellow-400"> 1 chopeira </span>
                      e
                      <span className="font-bold text-yellow-400"> 1 cilindro</span>.
                      Você pode editar a quantidade ou remover na hora.
                    </p>
                  </div>

                  {orderItems.map((item, index) => {
                    const product = products.find(
                      (productItem) => productItem.id === item.productId
                    );

                    const isAutomaticAccessory =
                      isChopeiraProduct(product) || isCilindroProduct(product);

                    return (
                      <div
                        key={index}
                        className="rounded-2xl border border-yellow-500/10 bg-black/45 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
                          <select
                            value={item.productId}
                            onChange={(event) =>
                              updateItem(index, 'productId', event.target.value)
                            }
                            className={inputClass}
                          >
                            <option value="">Selecione um produto</option>

                            {getProductsForOrderSelect(products, item.productId).map((productItem) => (
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
                            className="rounded-2xl border border-red-500/25 bg-red-500/15 font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                          >
                            Remover
                          </button>
                        </div>

                        {product && (
                          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
                            <p className="text-sm text-zinc-500">
                              Estoque atual: {product.stock} {product.unit}
                            </p>

                            {isAutomaticAccessory && (
                              <span className="w-fit rounded-full border border-yellow-500/25 bg-yellow-500/15 px-3 py-1 text-xs font-black text-yellow-400">
                                Sugestão automática editável
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addItem}
                    className="rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                  >
                    Adicionar Produto
                  </button>
                </div>

                <div className="rounded-2xl border border-yellow-500/15 bg-black/45 p-5">
                  <p className="font-bold text-zinc-400">
                    Total do pedido
                  </p>

                  <p className="text-3xl font-black text-yellow-400">
                    {formatMoney(calculateTotal())}
                  </p>
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Pedido'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
                  }}
                  className="w-full rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {deliveryOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm no-print">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                  Entrega
                </p>

                <h2 className="text-3xl font-black text-white">
                  Pedido entregue
                </h2>

                <p className="mt-2 text-zinc-400">
                  Agora informe quando e o que precisa buscar de volta.
                </p>
              </div>

              <form onSubmit={confirmDelivered} className="space-y-4">
                <div className="rounded-2xl border border-yellow-500/15 bg-black/45 p-4">
                  <p className="text-sm font-bold text-zinc-500">
                    Cliente
                  </p>

                  <p className="text-xl font-black text-white">
                    {deliveryOrder.client?.name || 'Cliente não informado'}
                  </p>

                  <p className="text-zinc-400">
                    {deliveryOrder.client?.address || 'Sem endereço'}
                  </p>
                </div>

                <Field label="Data para buscar de volta">
                  <input
                    name="pickupDate"
                    type="date"
                    defaultValue={getOrderMeta(deliveryOrder.id)?.pickupDate || ''}
                    className={inputClass}
                  />
                </Field>

                <Field label="Itens para buscar">
                  <textarea
                    name="returnItems"
                    placeholder="O que precisa buscar? Ex: 1 chopeira, 2 barris, cascos..."
                    defaultValue={getOrderMeta(deliveryOrder.id)?.returnItems || ''}
                    className={`${inputClass} min-h-[100px] resize-none`}
                  />
                </Field>

                <Field label="Observação">
                  <textarea
                    name="observation"
                    placeholder="Observação. Ex: ligar antes, buscar depois das 18h..."
                    defaultValue={getOrderMeta(deliveryOrder.id)?.observation || ''}
                    className={`${inputClass} min-h-[100px] resize-none`}
                  />
                </Field>

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Confirmar entrega e agendar retirada'}
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryOrder(null)}
                  className="w-full rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          id="delivery-note-print-wrapper"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
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
                      {companySettings.companyName || 'RJ CHOPP'}
                    </h1>

                    <p className="text-lg font-black text-zinc-700">
                      Ficha de entrega e retirada
                    </p>

                    <p className="text-zinc-600">
                      {companySettings.city || 'Loanda - Paraná'}
                      {companySettings.phone ? ` | ${companySettings.phone}` : ''}
                    </p>

                    {companySettings.address && (
                      <p className="text-zinc-600">
                        {companySettings.address}
                      </p>
                    )}

                    {companySettings.document && (
                      <p className="text-zinc-600">
                        {companySettings.document}
                      </p>
                    )}
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
                        Estoque
                      </p>

                      <p className="font-bold">
                        {hasStockAlreadyDiscounted(selectedOrder, getOrderMeta(selectedOrder.id))
                          ? 'Baixado'
                          : 'Agendado'}
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

              {companySettings.noteMessage && (
                <div className="border border-zinc-300 rounded-2xl p-4 mt-8 text-center">
                  <p className="font-bold">
                    {companySettings.noteMessage}
                  </p>
                </div>
              )}

              <div className="border-t border-zinc-300 mt-8 pt-3 text-xs text-zinc-500 text-center">
                {companySettings.reportFooter || 'RJ Chopp SGE • Documento gerado automaticamente pelo sistema'}
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