import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Navigation,
  Copy,
  Search,
  RefreshCcw,
  ClipboardList,
  Truck,
  Route,
  X,
  AlertTriangle,
  CheckCircle,
  FileText,
  CalendarDays,
  Phone,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';
import {
  CACHE_ORDERS_KEY,
  addOfflineAction,
  cacheItems,
  getCachedItems,
  isOnline,
} from '../services/offline';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

const WITHDRAWALS_STORAGE_KEY = 'rjchopp_withdrawals';
const ORDER_META_STORAGE_KEY = 'rjchopp_order_meta';

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

function getCurrentUser() {
  try {
    const saved = localStorage.getItem('rjchopp_user');

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getDateKey(value: any) {
  if (!value) {
    return '';
  }

  if (String(value).includes('T')) {
    return String(value).split('T')[0];
  }

  if (String(value).match(/^\d{4}-\d{2}-\d{2}$/)) {
    return String(value);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
}

function getNoteField(note: any, label: string) {
  const lines = String(note || '').split('\n');
  const found = lines.find((line) =>
    line.toLowerCase().startsWith(label.toLowerCase())
  );

  if (!found) {
    return '';
  }

  const value = found.slice(label.length).trim();

  return value === '-' ? '' : value;
}

function parseOrderNote(note: any) {
  return {
    deliveryDate: getNoteField(note, 'Data de entrega:'),
    deliveryTime: getNoteField(note, 'Horário de entrega:'),
    deliveryAddress: getNoteField(note, 'Endereço da entrega:'),
    pickupDate: getNoteField(note, 'Data para buscar de volta:'),
    returnItems: getNoteField(note, 'Itens para buscar:'),
    observation: getNoteField(note, 'Observação:'),
  };
}

function getOrderMeta(orderId: string, order: any = null) {
  const meta = readStorage(ORDER_META_STORAGE_KEY, {});
  const noteMeta = parseOrderNote(order?.note || '');

  return {
    ...noteMeta,
    ...(meta[orderId] || {}),
  };
}

function getFullAddress(item: any) {
  const noteMeta = parseOrderNote(item?.note || '');

  return String(
    item.deliveryAddress ||
      noteMeta.deliveryAddress ||
      item.address ||
      item.client?.address ||
      ''
  ).trim();
}

function getDeliveryTime(item: any) {
  const noteMeta = parseOrderNote(item?.note || '');

  return String(item.deliveryTime || noteMeta.deliveryTime || '').trim();
}

function getMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function getWazeUrl(address: string) {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

function getEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function getGoogleRouteUrl(locations: any[]) {
  const addresses = locations
    .map((location) => String(location.address || '').trim())
    .filter(Boolean);

  if (addresses.length === 0) {
    return '';
  }

  if (addresses.length === 1) {
    return getMapsUrl(addresses[0]);
  }

  const origin = addresses[0];
  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(1, -1);

  const params = new URLSearchParams();

  params.set('api', '1');
  params.set('origin', origin);
  params.set('destination', destination);
  params.set('travelmode', 'driving');

  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getTypeConfig(type: string) {
  if (type === 'ORDER') {
    return {
      label: 'Pedido',
      icon: ClipboardList,
      className: 'border-yellow-500/25 bg-yellow-500/15 text-yellow-400',
    };
  }

  return {
    label: 'Retirada',
    icon: Truck,
    className: 'border-green-500/25 bg-green-500/15 text-green-400',
  };
}

function isLateOrder(order: any) {
  const status = String(order.status || '').toUpperCase();
  const meta = getOrderMeta(order.id, order);
  const deliveryDate =
    getDateKey(meta.deliveryDate) ||
    getDateKey(order.deliveryDate) ||
    getDateKey(order.createdAt);

  if (!deliveryDate) {
    return false;
  }

  if (status !== 'PENDING' && status !== '' && status !== 'PENDENTE') {
    return false;
  }

  return deliveryDate < getToday();
}

function isOpenOrder(order: any) {
  const status = String(order.status || '').toUpperCase();

  return (
    status === 'PENDING' ||
    status === '' ||
    status === 'PENDENTE'
  );
}

function isLateWithdrawal(withdrawal: any) {
  const status = String(withdrawal.status || '').toUpperCase();

  if (!withdrawal.pickupDate || status === 'RETIRADO') {
    return false;
  }

  return getDateKey(withdrawal.pickupDate) < getToday();
}

function isOpenWithdrawal(withdrawal: any) {
  const status = String(withdrawal.status || '').toUpperCase();

  return (
    status !== 'FINALIZADO' &&
    status !== 'FINALIZADA' &&
    status !== 'RETIRADO' &&
    status !== 'CONCLUIDO' &&
    status !== 'CONCLUÍDO'
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

function StatCard({ title, value, icon: Icon, tone = 'yellow' }: any) {
  const toneClass =
    tone === 'red'
      ? 'border-red-500/25 bg-red-500/15 text-red-400'
      : tone === 'green'
        ? 'border-green-500/25 bg-green-500/15 text-green-400'
        : 'border-yellow-500/25 bg-yellow-500/15 text-yellow-400';

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.13),transparent_35%)]" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="font-black text-zinc-300">
            {title}
          </p>

          <p className="mt-5 text-4xl font-black text-white">
            {value}
          </p>
        </div>

        <div className={`rounded-2xl border p-3 ${toneClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);

  const today = getToday();
  const user = getCurrentUser();

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
    const withdrawalsData = readStorage(WITHDRAWALS_STORAGE_KEY, []);

    try {
      const ordersResponse = await api.get('/orders', authHeaders());
      const onlineOrders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];

      cacheItems(CACHE_ORDERS_KEY, onlineOrders);

      setOrders(onlineOrders);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (error) {
      console.log('Erro ao carregar mapa:', error);

      setOrders(getCachedItems(CACHE_ORDERS_KEY));
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const locations = useMemo(() => {
    const orderLocations = orders
      .filter((order) => {
        const meta = getOrderMeta(order.id, order);
        const address = getFullAddress(order);

        if (!address) {
          return false;
        }

        if (!isOpenOrder(order)) {
          return false;
        }

        const deliveryDate =
          getDateKey(meta.deliveryDate) ||
          getDateKey(order.deliveryDate) ||
          getDateKey(order.createdAt);

        return deliveryDate === today || deliveryDate < today;
      })
      .map((order) => {
        const meta = getOrderMeta(order.id, order);

        return {
          id: `order-${order.id}`,
          type: 'ORDER',
          title: order.client?.name || 'Cliente do pedido',
          subtitle: `Pedido ${String(order.id || '').slice(0, 8).toUpperCase()}`,
          address: getFullAddress(order),
          phone: order.client?.phone || '',
          status: order.status || 'Pendente',
          date: meta.deliveryDate || getDateKey(order.createdAt),
          deliveryTime: meta.deliveryTime || getDeliveryTime(order),
          item: '',
          isLate: isLateOrder(order),
        };
      });

    const withdrawalLocations = withdrawals
      .filter((withdrawal) => {
        const address = getFullAddress(withdrawal);

        if (!address) {
          return false;
        }

        if (!isOpenWithdrawal(withdrawal)) {
          return false;
        }

        const pickupDate = getDateKey(withdrawal.pickupDate);

        return pickupDate === today || pickupDate < today;
      })
      .map((withdrawal) => ({
        id: `withdrawal-${withdrawal.id}`,
        originalId: withdrawal.id,
        orderId: withdrawal.orderId || '',
        type: 'WITHDRAWAL',
        title: withdrawal.client || 'Cliente da retirada',
        subtitle: withdrawal.phone || 'Sem telefone',
        address: getFullAddress(withdrawal),
        phone: withdrawal.phone || '',
        status: withdrawal.status || 'PENDENTE',
        pickupDate: withdrawal.pickupDate || '',
        item: withdrawal.item || '',
        observation: withdrawal.observation || '',
        isLate: isLateWithdrawal(withdrawal),
      }));

    return [
      ...withdrawalLocations,
      ...orderLocations,
    ];
  }, [orders, withdrawals, today]);

  const filteredLocations = locations.filter((location) => {
    const text = search.toLowerCase();

    const matchesSearch =
      !text ||
      location.title.toLowerCase().includes(text) ||
      location.subtitle.toLowerCase().includes(text) ||
      location.address.toLowerCase().includes(text) ||
      location.deliveryTime?.toLowerCase().includes(text) ||
      location.phone.toLowerCase().includes(text) ||
      location.status.toLowerCase().includes(text) ||
      location.item?.toLowerCase().includes(text);

    const matchesType =
      !typeFilter ||
      location.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const selectedRouteLocations = selectedRouteIds
    .map((id) => locations.find((location) => location.id === id))
    .filter(Boolean);

  useEffect(() => {
    if (filteredLocations.length === 0) {
      setSelectedLocation(null);
      return;
    }

    if (!selectedLocation) {
      setSelectedLocation(filteredLocations[0]);
      return;
    }

    const stillExists = filteredLocations.some(
      (location) => location.id === selectedLocation.id
    );

    if (!stillExists) {
      setSelectedLocation(filteredLocations[0]);
    }
  }, [filteredLocations, selectedLocation]);

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      alert('Endereço copiado.');
    } catch {
      alert(address);
    }
  }

  function toggleRouteSelection(location: any) {
    const alreadySelected = selectedRouteIds.includes(location.id);

    if (alreadySelected) {
      setSelectedRouteIds((current) =>
        current.filter((id) => id !== location.id)
      );
      return;
    }

    if (selectedRouteIds.length >= 10) {
      alert('O limite é de 10 paradas por rota.');
      return;
    }

    setSelectedRouteIds((current) => [...current, location.id]);
  }

  function openSelectedRoute() {
    if (selectedRouteLocations.length === 0) {
      alert('Selecione pelo menos uma parada.');
      return;
    }

    const url = getGoogleRouteUrl(selectedRouteLocations);

    if (!url) {
      alert('Não foi possível criar a rota.');
      return;
    }

    addAuditLog({
      area: 'Mapa',
      action: 'CREATE',
      title: `Rota criada com ${selectedRouteLocations.length} parada(s)`,
      description: selectedRouteLocations
        .map((location: any, index: number) => `${index + 1}. ${location.title} - ${location.address}`)
        .join('\n'),
    });

    window.open(url, '_blank');
  }

  function clearRouteSelection() {
    setSelectedRouteIds([]);
  }

  function confirmWithdrawalFromMap(location: any) {
    if (!location?.originalId) {
      alert('Essa retirada não foi encontrada.');
      return;
    }

    const confirmAction = window.confirm(
      'Confirmar que essa retirada já foi feita?'
    );

    if (!confirmAction) {
      return;
    }

    const updatedWithdrawals = withdrawals.map((item) =>
      item.id === location.originalId
        ? {
            ...item,
            status: 'RETIRADO',
            finishedAt: new Date().toISOString(),
          }
        : item
    );

    setWithdrawals(updatedWithdrawals);
    writeStorage(WITHDRAWALS_STORAGE_KEY, updatedWithdrawals);
    setSelectedRouteIds((current) => current.filter((id) => id !== location.id));
    setSelectedLocation(null);

    if (!isOnline()) {
      addOfflineAction({
        type: 'WITHDRAWAL_OK',
        title: `Retirada OK offline pelo mapa: ${location.title || 'Cliente não informado'}`,
        payload: {
          id: location.originalId,
          finishedAt: new Date().toISOString(),
        },
      });
    }

    addAuditLog({
      area: 'Mapa',
      action: 'WITHDRAWAL_OK',
      title: `Retirada OK pelo mapa: ${location.title || 'Cliente não informado'}`,
      description: `Buscar: ${location.item || '-'}\nEndereço: ${location.address || '-'}\nData: ${formatDate(location.pickupDate)}`,
    });

    alert('Retirada marcada como OK.');
  }

  function openWithdrawalNote(location: any) {
    const message = [
      `Cliente: ${location.title || '-'}`,
      `Telefone: ${location.phone || '-'}`,
      `Endereço: ${location.address || '-'}`,
      `Buscar: ${location.item || '-'}`,
      `Data: ${formatDate(location.pickupDate)}`,
      `Observação: ${location.observation || '-'}`,
    ].join('\n');

    addAuditLog({
      area: 'Mapa',
      action: 'UPDATE',
      title: `Nota de retirada aberta: ${location.title || 'Cliente não informado'}`,
      description: message,
    });

    alert(message);
  }

  const lateOrdersCount = locations.filter(
    (location) => location.type === 'ORDER' && location.isLate
  ).length;

  const lateWithdrawalsCount = locations.filter(
    (location) => location.type === 'WITHDRAWAL' && location.isLate
  ).length;

  const orderCount = locations.filter((location) => location.type === 'ORDER').length;
  const withdrawalCount = locations.filter((location) => location.type === 'WITHDRAWAL').length;

  const activeAddress = selectedLocation?.address || '';

  return (
    <Layout>
      <PageHeader
        title="Mapa"
        description="Rotas de hoje, pedidos atrasados, retiradas pendentes e rota com múltiplas paradas."
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Rotas listadas" value={filteredLocations.length} icon={MapPin} />
        <StatCard title="Pedidos" value={orderCount} icon={ClipboardList} />
        <StatCard title="Retiradas" value={withdrawalCount} icon={Truck} tone="green" />
        <StatCard title="Atrasados" value={lateOrdersCount + lateWithdrawalsCount} icon={AlertTriangle} tone={(lateOrdersCount + lateWithdrawalsCount) > 0 ? 'red' : 'yellow'} />
      </div>

      {lateOrdersCount > 0 && (
        <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-red-500/35 bg-red-500/12 p-5 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,.18),transparent_35%)]" />

          <div className="relative flex items-center gap-3">
            <div className="rounded-2xl bg-red-500 p-3 text-white">
              <AlertTriangle size={26} />
            </div>

            <p className="font-black text-red-400">
              {lateOrdersCount} pedido(s) atrasado(s) aparecem no mapa para priorizar a entrega.
            </p>
          </div>
        </div>
      )}

      {lateWithdrawalsCount > 0 && (
        <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-red-500/35 bg-red-500/12 p-5 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,.18),transparent_35%)]" />

          <div className="relative flex items-center gap-3">
            <div className="rounded-2xl bg-red-500 p-3 text-white">
              <AlertTriangle size={26} />
            </div>

            <p className="font-black text-red-400">
              {lateWithdrawalsCount} retirada(s) atrasada(s) aparecem no mapa para priorizar a rota.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <div className="space-y-5">
          <PremiumPanel>
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                  <Search size={20} />
                </div>

                <h2 className="text-xl font-black text-yellow-400">
                  Rotas de hoje
                </h2>
              </div>

              <div className="mb-4 rounded-2xl border border-yellow-500/15 bg-black/45 p-4">
                <p className="font-bold text-zinc-400">
                  Hoje
                </p>

                <p className="text-2xl font-black text-yellow-400">
                  {new Date(`${today}T12:00:00`).toLocaleDateString('pt-BR')}
                </p>

                {user?.role === 'DELIVERY' && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Você está vendo entregas de hoje/atrasadas e retiradas de hoje/atrasadas.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por cliente, telefone ou endereço..."
                    className={`${inputClass} pl-12`}
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Pedidos e retiradas</option>
                  <option value="ORDER">Somente pedidos</option>
                  <option value="WITHDRAWAL">Somente retiradas</option>
                </select>

                <button
                  onClick={loadData}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                >
                  <RefreshCcw size={18} />
                  Atualizar mapa
                </button>
              </div>
            </div>
          </PremiumPanel>

          <PremiumPanel>
            <div className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                  <Route size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-yellow-400">
                    Rota com paradas
                  </h2>

                  <p className="text-sm font-bold text-zinc-500">
                    {selectedRouteIds.length}/10 paradas selecionadas
                  </p>
                </div>
              </div>

              {selectedRouteLocations.length > 0 ? (
                <div className="mb-4 space-y-2">
                  {selectedRouteLocations.map((location: any, index: number) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-yellow-500/10 bg-black/45 p-3"
                    >
                      <div>
                        <p className="text-sm font-black text-white">
                          {index + 1}. {location.title}
                        </p>

                        <p className="text-xs text-zinc-500">
                          {location.address}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleRouteSelection(location)}
                        className="rounded-xl border border-red-500/25 bg-red-500/15 p-2 text-red-400 transition hover:bg-red-500 hover:text-white"
                        title="Remover da rota"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-zinc-500">
                  Marque os quadradinhos nos pedidos/retiradas para montar uma rota.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openSelectedRoute}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-4 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] disabled:opacity-50"
                  disabled={selectedRouteLocations.length === 0}
                >
                  <Navigation size={18} />
                  Criar rota
                </button>

                <button
                  onClick={clearRouteSelection}
                  className="rounded-2xl border border-yellow-500/15 bg-black/45 px-4 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                >
                  Limpar
                </button>
              </div>
            </div>
          </PremiumPanel>

          <PremiumPanel>
            <div className="border-b border-yellow-500/15 p-5">
              <p className="font-bold text-zinc-400">
                {filteredLocations.length} rota(s) de hoje
              </p>
            </div>

            <div className="max-h-[540px] overflow-y-auto custom-scrollbar">
              {filteredLocations.map((location) => {
                const config = getTypeConfig(location.type);
                const Icon = config.icon;
                const active = selectedLocation?.id === location.id;
                const selectedInRoute = selectedRouteIds.includes(location.id);

                return (
                  <div
                    key={location.id}
                    className={`w-full border-b border-yellow-500/10 p-5 text-left transition ${
                      active
                        ? 'bg-yellow-400 text-black'
                        : 'hover:bg-yellow-400/[0.035]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleRouteSelection(location);
                        }}
                        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 font-black ${
                          selectedInRoute
                            ? active
                              ? 'border-black bg-black text-yellow-400'
                              : 'border-yellow-400 bg-yellow-400 text-black'
                            : active
                              ? 'border-black text-transparent'
                              : 'border-zinc-600 text-transparent'
                        }`}
                        title="Selecionar para rota"
                      >
                        ✓
                      </button>

                      <button
                        onClick={() => setSelectedLocation(location)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black">
                              {location.title}
                            </p>

                            <p className={active ? 'text-black/70' : 'text-zinc-400'}>
                              {location.subtitle}
                            </p>
                          </div>

                          <span
                            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${
                              active
                                ? 'border-black/15 bg-black/15 text-black'
                                : config.className
                            }`}
                          >
                            <Icon size={14} />
                            {config.label}
                          </span>
                        </div>

                        <p className={`mt-3 text-sm ${active ? 'text-black/80' : 'text-zinc-500'}`}>
                          {location.address}
                        </p>

                        {location.type === 'ORDER' && location.deliveryTime && (
                          <p className={`mt-2 text-sm font-black ${active ? 'text-black' : 'text-yellow-400'}`}>
                            Entregar às {location.deliveryTime}
                          </p>
                        )}

                        {location.type === 'ORDER' && location.isLate && (
                          <p className={`mt-2 text-sm font-black ${active ? 'text-black' : 'text-red-400'}`}>
                            ⚠ Pedido atrasado desde {formatDate(location.date)}
                          </p>
                        )}

                        {location.type === 'WITHDRAWAL' && location.item && (
                          <p className={`mt-2 text-sm font-bold ${active ? 'text-black' : 'text-green-400'}`}>
                            Buscar: {location.item}
                          </p>
                        )}

                        {location.type === 'WITHDRAWAL' && location.isLate && (
                          <p className={`mt-2 text-sm font-black ${active ? 'text-black' : 'text-red-400'}`}>
                            ⚠ Retirada atrasada desde {formatDate(location.pickupDate)}
                          </p>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredLocations.length === 0 && (
                <div className="p-5 text-zinc-500">
                  Nenhum pedido ou retirada para hoje.
                </div>
              )}
            </div>
          </PremiumPanel>
        </div>

        <PremiumPanel>
          <div className="min-h-[720px] overflow-hidden">
            {selectedLocation ? (
              <>
                <div className="border-b border-yellow-500/15 p-6">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin size={24} className="text-yellow-400" />

                        <h2 className="text-2xl font-black text-white">
                          {selectedLocation.title}
                        </h2>
                      </div>

                      <p className="font-bold text-zinc-400">
                        {selectedLocation.address}
                      </p>

                      {selectedLocation.phone && (
                        <p className="mt-1 flex items-center gap-2 text-zinc-500">
                          <Phone size={16} className="text-yellow-400" />
                          {selectedLocation.phone}
                        </p>
                      )}

                      {selectedLocation.type === 'ORDER' && selectedLocation.deliveryTime && (
                        <p className="mt-2 flex items-center gap-2 font-black text-yellow-400">
                          <CalendarDays size={18} />
                          Entregar às {selectedLocation.deliveryTime}
                        </p>
                      )}

                      {selectedLocation.type === 'ORDER' && selectedLocation.isLate && (
                        <p className="mt-2 flex items-center gap-2 font-black text-red-400">
                          <AlertTriangle size={18} />
                          Pedido atrasado desde {formatDate(selectedLocation.date)}
                        </p>
                      )}

                      {selectedLocation.item && (
                        <p className="mt-2 font-bold text-green-400">
                          Buscar: {selectedLocation.item}
                        </p>
                      )}

                      {selectedLocation.type === 'WITHDRAWAL' && selectedLocation.isLate && (
                        <p className="mt-2 flex items-center gap-2 font-black text-red-400">
                          <AlertTriangle size={18} />
                          Retirada atrasada desde {formatDate(selectedLocation.pickupDate)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={getMapsUrl(activeAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-5 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)]"
                      >
                        <Navigation size={18} />
                        Google Maps
                      </a>

                      <a
                        href={getWazeUrl(activeAddress)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white transition hover:bg-blue-400"
                      >
                        <Navigation size={18} />
                        Waze
                      </a>

                      <button
                        onClick={() => copyAddress(activeAddress)}
                        className="flex items-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                      >
                        <Copy size={18} />
                        Copiar
                      </button>

                      {selectedLocation.type === 'WITHDRAWAL' && (
                        <button
                          onClick={() => openWithdrawalNote(selectedLocation)}
                          className="flex items-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
                        >
                          <FileText size={18} />
                          Nota
                        </button>
                      )}

                      {selectedLocation.type === 'WITHDRAWAL' && (
                        <button
                          onClick={() => confirmWithdrawalFromMap(selectedLocation)}
                          className="flex items-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/15 px-5 py-3 font-black text-green-400 transition hover:bg-green-500 hover:text-white"
                        >
                          <CheckCircle size={18} />
                          OK Retirada
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <iframe
                  title="Mapa RJ Chopp"
                  src={getEmbedUrl(activeAddress)}
                  className="h-[620px] w-full bg-zinc-950"
                  loading="lazy"
                />
              </>
            ) : (
              <div className="flex min-h-[720px] items-center justify-center text-zinc-500">
                Nenhuma rota de hoje encontrada.
              </div>
            )}
          </div>
        </PremiumPanel>
      </div>
    </Layout>
  );
}