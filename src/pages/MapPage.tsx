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
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

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

function getOrderMeta(orderId: string) {
  const meta = readStorage(ORDER_META_STORAGE_KEY, {});
  return meta[orderId] || {};
}

function getFullAddress(item: any) {
  return String(item.address || item.client?.address || '').trim();
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
      className: 'bg-yellow-400/20 text-yellow-400',
    };
  }

  return {
    label: 'Retirada',
    icon: Truck,
    className: 'bg-green-500/20 text-green-400',
  };
}

function isLateOrder(order: any) {
  const status = String(order.status || '').toUpperCase();
  const meta = getOrderMeta(order.id);
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
    try {
      const ordersResponse = await api.get('/orders', authHeaders());
      const withdrawalsData = readStorage(WITHDRAWALS_STORAGE_KEY, []);

      setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (error) {
      console.log('Erro ao carregar mapa:', error);
      setOrders([]);
      setWithdrawals([]);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const locations = useMemo(() => {
    const orderLocations = orders
      .filter((order) => {
        const meta = getOrderMeta(order.id);
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
        const meta = getOrderMeta(order.id);

        return {
          id: `order-${order.id}`,
          type: 'ORDER',
          title: order.client?.name || 'Cliente do pedido',
          subtitle: `Pedido ${String(order.id || '').slice(0, 8).toUpperCase()}`,
          address: getFullAddress(order),
          phone: order.client?.phone || '',
          status: order.status || 'Pendente',
          date: meta.deliveryDate || getDateKey(order.createdAt),
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

    alert(message);
  }

  const lateOrdersCount = locations.filter(
    (location) => location.type === 'ORDER' && location.isLate
  ).length;

  const lateWithdrawalsCount = locations.filter(
    (location) => location.type === 'WITHDRAWAL' && location.isLate
  ).length;

  const activeAddress = selectedLocation?.address || '';

  return (
    <Layout>
      <PageHeader
        title="Mapa"
        description="Rotas de hoje e retiradas atrasadas"
      />

      {lateOrdersCount > 0 && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={26} className="text-red-400" />
            <p className="font-black text-red-400">
              {lateOrdersCount} pedido(s) atrasado(s) aparecem no mapa para priorizar a entrega.
            </p>
          </div>
        </div>
      )}

      {lateWithdrawalsCount > 0 && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={26} className="text-red-400" />
            <p className="font-black text-red-400">
              {lateWithdrawalsCount} retirada(s) atrasada(s) aparecem no mapa para priorizar a rota.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[450px_1fr] gap-6">
        <div className="space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Search size={20} className="text-yellow-400" />

              <h2 className="text-xl font-black text-yellow-400">
                Rotas de hoje
              </h2>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-4">
              <p className="text-zinc-400 font-bold">
                Hoje
              </p>

              <p className="text-2xl font-black text-yellow-400">
                {new Date(`${today}T12:00:00`).toLocaleDateString('pt-BR')}
              </p>

              {user?.role === 'DELIVERY' && (
                <p className="text-sm text-zinc-500 mt-2">
                  Você está vendo entregas de hoje/atrasadas e retiradas de hoje/atrasadas.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cliente, telefone ou endereço..."
                className={inputClass}
              />

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
                className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} />
                Atualizar mapa
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Route size={22} className="text-yellow-400" />

              <div>
                <h2 className="text-xl font-black text-yellow-400">
                  Rota com paradas
                </h2>

                <p className="text-zinc-500 text-sm font-bold">
                  {selectedRouteIds.length}/10 paradas selecionadas
                </p>
              </div>
            </div>

            {selectedRouteLocations.length > 0 ? (
              <div className="space-y-2 mb-4">
                {selectedRouteLocations.map((location: any, index: number) => (
                  <div
                    key={location.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-black">
                        {index + 1}. {location.title}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {location.address}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleRouteSelection(location)}
                      className="bg-red-500/20 text-red-400 rounded-xl p-2"
                      title="Remover da rota"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm mb-4">
                Marque os quadradinhos nos pedidos/retiradas para montar uma rota.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={openSelectedRoute}
                className="bg-yellow-400 text-black rounded-2xl px-4 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={selectedRouteLocations.length === 0}
              >
                <Navigation size={18} />
                Criar rota
              </button>

              <button
                onClick={clearRouteSelection}
                className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-4 py-3 font-bold"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800">
              <p className="text-zinc-400 font-bold">
                {filteredLocations.length} rota(s) de hoje
              </p>
            </div>

            <div className="max-h-[540px] overflow-y-auto">
              {filteredLocations.map((location) => {
                const config = getTypeConfig(location.type);
                const Icon = config.icon;
                const active = selectedLocation?.id === location.id;
                const selectedInRoute = selectedRouteIds.includes(location.id);

                return (
                  <div
                    key={location.id}
                    className={`w-full text-left p-5 border-b border-zinc-800 transition ${
                      active
                        ? 'bg-yellow-400 text-black'
                        : 'hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleRouteSelection(location);
                        }}
                        className={`mt-1 w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                          selectedInRoute
                            ? active
                              ? 'bg-black border-black text-yellow-400'
                              : 'bg-yellow-400 border-yellow-400 text-black'
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
                            <p className="font-black text-lg">
                              {location.title}
                            </p>

                            <p className={active ? 'text-black/70' : 'text-zinc-400'}>
                              {location.subtitle}
                            </p>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                              active
                                ? 'bg-black/20 text-black'
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
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden min-h-[720px]">
          {selectedLocation ? (
            <>
              <div className="p-6 border-b border-zinc-800">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={24} className="text-yellow-400" />

                      <h2 className="text-2xl font-black">
                        {selectedLocation.title}
                      </h2>
                    </div>

                    <p className="text-zinc-400 font-bold">
                      {selectedLocation.address}
                    </p>

                    {selectedLocation.phone && (
                      <p className="text-zinc-500 mt-1">
                        Telefone: {selectedLocation.phone}
                      </p>
                    )}

                    {selectedLocation.type === 'ORDER' && selectedLocation.isLate && (
                      <p className="text-red-400 font-black mt-2 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Pedido atrasado desde {formatDate(selectedLocation.date)}
                      </p>
                    )}

                    {selectedLocation.item && (
                      <p className="text-green-400 font-bold mt-2">
                        Buscar: {selectedLocation.item}
                      </p>
                    )}

                    {selectedLocation.isLate && (
                      <p className="text-red-400 font-black mt-2 flex items-center gap-2">
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
                      className="bg-yellow-400 text-black rounded-2xl px-5 py-3 font-black flex items-center gap-2"
                    >
                      <Navigation size={18} />
                      Google Maps
                    </a>

                    <a
                      href={getWazeUrl(activeAddress)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-500 text-white rounded-2xl px-5 py-3 font-black flex items-center gap-2"
                    >
                      <Navigation size={18} />
                      Waze
                    </a>

                    <button
                      onClick={() => copyAddress(activeAddress)}
                      className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold flex items-center gap-2"
                    >
                      <Copy size={18} />
                      Copiar
                    </button>

                    {selectedLocation.type === 'WITHDRAWAL' && (
                      <button
                        onClick={() => openWithdrawalNote(selectedLocation)}
                        className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold flex items-center gap-2"
                      >
                        <FileText size={18} />
                        Nota
                      </button>
                    )}

                    {selectedLocation.type === 'WITHDRAWAL' && (
                      <button
                        onClick={() => confirmWithdrawalFromMap(selectedLocation)}
                        className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-2xl px-5 py-3 font-black flex items-center gap-2"
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
                className="w-full h-[620px] bg-zinc-950"
                loading="lazy"
              />
            </>
          ) : (
            <div className="h-full min-h-[720px] flex items-center justify-center text-zinc-500">
              Nenhuma rota de hoje encontrada.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
