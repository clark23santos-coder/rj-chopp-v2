import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  CalendarDays,
  Search,
  X,
  Truck,
  Phone,
  MapPin,
  Package,
  RotateCcw,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { addAuditLog } from '../services/audit';
import { addOfflineAction, isOnline } from '../services/offline';
import { api } from '../services/api';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

const STORAGE_KEY = 'rjchopp_withdrawals';

function normalizeText(value: any) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBarrelSize(value: any) {
  const text = normalizeText(value);
  const match = text.match(/(?:^|\s)(20|30|50)\s*l(?:\s|$)/i);
  return match ? `${match[1]}L` : '';
}

function isBarrelReturnItem(item: any) {
  const text = normalizeText(`${item?.name || ''} ${item?.category || ''}`);

  if (
    item?.kind === 'EQUIPMENT' ||
    text.includes('chopeira') ||
    text.includes('choperia') ||
    text.includes('cilindro')
  ) {
    return false;
  }

  return (
    item?.kind === 'BARREL' ||
    text.includes('barril') ||
    text.includes('chopp') ||
    text.includes('chope') ||
    text.includes('keg')
  );
}

function isEquipmentReturnItem(item: any) {
  const text = normalizeText(`${item?.name || ''} ${item?.category || ''}`);
  return (
    item?.kind === 'EQUIPMENT' ||
    text.includes('chopeira') ||
    text.includes('cilindro')
  );
}

function clampQuantity(value: any, max: any) {
  const quantity = Math.max(0, Math.floor(Number(value || 0)));
  const maximum = Math.max(0, Math.floor(Number(max || 0)));
  return Math.min(quantity, maximum);
}

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

  const date = new Date(`${value}T12:00:00`);

  return date.toLocaleDateString('pt-BR');
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function isLate(date: string, status: string) {
  if (!date || status === 'RETIRADO') {
    return false;
  }

  return date < getToday();
}

function isToday(date: string, status: string) {
  if (!date || status === 'RETIRADO') {
    return false;
  }

  return date === getToday();
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

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState<any>(null);
  const [returnRows, setReturnRows] = useState<any[]>([]);
  const [loadingReturn, setLoadingReturn] = useState(false);

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
      console.log('Erro ao carregar produtos nas retiradas:', error);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setWithdrawals(JSON.parse(saved));
      } catch {
        setWithdrawals([]);
      }
    }

    loadProducts();
  }, []);

  function saveToStorage(data: any[]) {
    setWithdrawals(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function saveWithdrawal(event: any) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const newWithdrawal = {
      id: String(Date.now()),
      client: String(form.get('client') || ''),
      phone: String(form.get('phone') || ''),
      address: String(form.get('address') || ''),
      item: String(form.get('item') || ''),
      deliveryDate: String(form.get('deliveryDate') || ''),
      pickupDate: String(form.get('pickupDate') || ''),
      observation: String(form.get('observation') || ''),
      status: 'PENDENTE',
      createdAt: new Date().toISOString(),
      finishedAt: null,
    };

    if (!newWithdrawal.client.trim()) {
      alert('Coloque o nome do cliente.');
      return;
    }

    if (!newWithdrawal.item.trim()) {
      alert('Coloque o item que precisa buscar.');
      return;
    }

    if (!newWithdrawal.pickupDate) {
      alert('Coloque a data para buscar de volta.');
      return;
    }

    saveToStorage([newWithdrawal, ...withdrawals]);

    if (!isOnline()) {
      addOfflineAction({
        type: 'CREATE_WITHDRAWAL',
        title: `Criar retirada offline: ${newWithdrawal.client}`,
        payload: newWithdrawal,
      });
    }

    addAuditLog({
      area: 'Retiradas',
      action: 'CREATE',
      title: `Retirada criada: ${newWithdrawal.client}`,
      description: `Buscar em: ${formatDate(newWithdrawal.pickupDate)}\nItens: ${newWithdrawal.item}\nEndereço: ${newWithdrawal.address || '-'}`,
    });

    setShowModal(false);
  }

  function confirmLegacyWithdrawal(id: string) {
    const confirmAction = window.confirm(
      'Confirmar que essa retirada já foi feita?'
    );

    if (!confirmAction) {
      return;
    }

    const currentWithdrawal = withdrawals.find((item) => item.id === id);

    const updated = withdrawals.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'RETIRADO',
            finishedAt: new Date().toISOString(),
          }
        : item
    );

    saveToStorage(updated);

    if (!isOnline() && currentWithdrawal) {
      addOfflineAction({
        type: 'WITHDRAWAL_OK',
        title: `Retirada OK offline: ${currentWithdrawal.client || 'Cliente não informado'}`,
        payload: {
          id,
          finishedAt: new Date().toISOString(),
        },
      });
    }

    addAuditLog({
      area: 'Retiradas',
      action: 'WITHDRAWAL_OK',
      title: `Retirada OK: ${currentWithdrawal?.client || 'Cliente não informado'}`,
      description: `Itens: ${currentWithdrawal?.item || '-'}\nBuscar: ${formatDate(currentWithdrawal?.pickupDate)}\nEndereço: ${currentWithdrawal?.address || '-'}`,
    });
  }

  function openReturnConfirmation(withdrawal: any) {
    const structuredItems = Array.isArray(withdrawal?.items)
      ? withdrawal.items
      : [];

    if (structuredItems.length === 0) {
      confirmLegacyWithdrawal(withdrawal.id);
      return;
    }

    const rows = structuredItems.map((item: any, index: number) => {
      const quantitySent = Math.max(0, Number(item.quantitySent || 0));
      const barrel = isBarrelReturnItem(item);
      const equipment = isEquipmentReturnItem(item);

      return {
        ...item,
        id: item.id || `${withdrawal.id}-${index}`,
        quantitySent,
        barrelSize: item.barrelSize || getBarrelSize(item.name),
        fullReturned: 0,
        emptyReturned: 0,
        returnedQty: equipment
          ? clampQuantity(item.expectedReturnQty || quantitySent, quantitySent)
          : 0,
        kind: barrel ? 'BARREL' : equipment ? 'EQUIPMENT' : item.kind || 'PRODUCT',
      };
    });

    setReturnRows(rows);
    setConfirmingWithdrawal(withdrawal);
  }

  function updateReturnRow(index: number, field: string, value: any) {
    setReturnRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        return {
          ...row,
          [field]: clampQuantity(value, row.quantitySent),
        };
      })
    );
  }

  async function ensureCascoProduct(row: any) {
    const size = String(row?.barrelSize || getBarrelSize(row?.name) || '').toUpperCase();
    const originalName = String(row?.name || 'Barril').trim();
    const cascoName = size
      ? `Casco ${size} - ${originalName}`
      : `Casco - ${originalName}`;
    const targetName = normalizeText(cascoName);

    const found = products.find((product) => {
      const productName = normalizeText(product?.name || '');
      const category = normalizeText(product?.category || '');
      return productName === targetName || (category.includes('casco') && productName === targetName);
    });

    if (found) {
      return found;
    }

    const response = await api.post(
      '/products',
      {
        name: cascoName,
        category: 'Casco',
        brand: row?.brand || 'RJ Chopp',
        unit: 'UNIDADE',
        stock: 0,
        minimumStock: 0,
        costPrice: 0,
        salePrice: 0,
      },
      authHeaders()
    );

    if (response.data?.id) {
      setProducts((current) => [response.data, ...current]);
      return response.data;
    }

    throw new Error(`Não foi possível criar o produto ${cascoName}.`);
  }

  async function addStockEntry(productId: string, quantity: number, note: string) {
    if (!productId || quantity <= 0) {
      return null;
    }

    await api.post(
      '/stock-movements',
      {
        productId,
        type: 'ENTRY',
        quantity,
        note,
      },
      authHeaders()
    );

    return {
      productId,
      quantity,
      note,
    };
  }

  function buildReturnedSummary(rows: any[]) {
    const lines: string[] = [];

    rows.forEach((row) => {
      if (isBarrelReturnItem(row)) {
        const full = Number(row.fullReturned || 0);
        const empty = Number(row.emptyReturned || 0);

        if (full > 0) {
          lines.push(`${full}x ${row.name} CHEIO`);
        }

        if (empty > 0) {
          const size = row.barrelSize || getBarrelSize(row.name);
          lines.push(`${empty}x Casco ${size || row.name}`);
        }

        return;
      }

      const returned = Number(row.returnedQty || 0);
      if (returned > 0) {
        lines.push(`${returned}x ${row.name}`);
      }
    });

    return lines.length > 0 ? lines.join(', ') : 'Nenhum item retornou';
  }

  async function confirmStructuredWithdrawal() {
    if (!confirmingWithdrawal) {
      return;
    }

    for (const row of returnRows) {
      const sent = Number(row.quantitySent || 0);

      if (isBarrelReturnItem(row)) {
        const full = Number(row.fullReturned || 0);
        const empty = Number(row.emptyReturned || 0);

        if (full + empty > sent) {
          alert(
            `${row.name}: a soma de cheio + casco não pode ser maior que a quantidade enviada (${sent}).`
          );
          return;
        }
      } else if (Number(row.returnedQty || 0) > sent) {
        alert(
          `${row.name}: a quantidade que voltou não pode ser maior que a quantidade enviada (${sent}).`
        );
        return;
      }
    }

    if (!isOnline()) {
      alert('Conecte à internet para confirmar o recolhimento e atualizar o estoque.');
      return;
    }

    const confirmAction = window.confirm(
      'Confirmar o recolhimento? As quantidades informadas serão devolvidas ao estoque.'
    );

    if (!confirmAction) {
      return;
    }

    try {
      setLoadingReturn(true);

      const stockAdjustments: any[] = [];

      for (const row of returnRows) {
        if (isBarrelReturnItem(row)) {
          const fullReturned = Number(row.fullReturned || 0);
          const emptyReturned = Number(row.emptyReturned || 0);

          if (fullReturned > 0 && row.productId) {
            const adjustment = await addStockEntry(
              row.productId,
              fullReturned,
              `Retorno CHEIO da retirada ${confirmingWithdrawal.id} - pedido ${confirmingWithdrawal.orderId || '-'}`
            );

            if (adjustment) {
              stockAdjustments.push({
                ...adjustment,
                label: `${row.name} cheio`,
              });
            }
          }

          if (emptyReturned > 0) {
            const cascoProduct = await ensureCascoProduct(row);

            const adjustment = await addStockEntry(
              cascoProduct.id,
              emptyReturned,
              `Entrada de casco da retirada ${confirmingWithdrawal.id} - pedido ${confirmingWithdrawal.orderId || '-'}`
            );

            if (adjustment) {
              stockAdjustments.push({
                ...adjustment,
                label: cascoProduct.name,
              });
            }
          }

          continue;
        }

        const returnedQty = Number(row.returnedQty || 0);

        if (returnedQty > 0 && row.productId) {
          const adjustment = await addStockEntry(
            row.productId,
            returnedQty,
            `Retorno da retirada ${confirmingWithdrawal.id} - pedido ${confirmingWithdrawal.orderId || '-'}`
          );

          if (adjustment) {
            stockAdjustments.push({
              ...adjustment,
              label: row.name,
            });
          }
        }
      }

      const returnedItems = buildReturnedSummary(returnRows);
      const finishedAt = new Date().toISOString();

      const updated = withdrawals.map((item) =>
        item.id === confirmingWithdrawal.id
          ? {
              ...item,
              status: 'RETIRADO',
              finishedAt,
              returnedItems,
              returnDetails: returnRows,
              stockReturned: true,
              stockAdjustments,
            }
          : item
      );

      saveToStorage(updated);
      await loadProducts();

      addAuditLog({
        area: 'Retiradas',
        action: 'WITHDRAWAL_OK',
        title: `Retirada OK: ${confirmingWithdrawal.client || 'Cliente não informado'}`,
        description: `Retorno real: ${returnedItems}\nBuscar: ${formatDate(confirmingWithdrawal.pickupDate)}\nEstoque atualizado automaticamente.`,
      });

      setConfirmingWithdrawal(null);
      setReturnRows([]);
      alert('Recolhimento confirmado e estoque atualizado.');
    } catch (error) {
      console.log('Erro ao confirmar recolhimento:', error);
      alert('Não foi possível confirmar o recolhimento ou atualizar o estoque.');
    } finally {
      setLoadingReturn(false);
    }
  }

  async function reopenWithdrawal(id: string) {
    const currentWithdrawal = withdrawals.find((item) => item.id === id);

    if (!currentWithdrawal) {
      return;
    }

    const stockAdjustments = Array.isArray(currentWithdrawal.stockAdjustments)
      ? currentWithdrawal.stockAdjustments
      : [];

    if (currentWithdrawal.stockReturned && stockAdjustments.length > 0 && !isOnline()) {
      alert('Conecte à internet para reabrir esta retirada e estornar o estoque.');
      return;
    }

    const message =
      currentWithdrawal.stockReturned && stockAdjustments.length > 0
        ? 'Deseja reabrir esta retirada? As entradas de estoque feitas no recolhimento serão estornadas.'
        : 'Deseja voltar essa retirada para pendente?';

    const confirmAction = window.confirm(message);

    if (!confirmAction) {
      return;
    }

    try {
      if (currentWithdrawal.stockReturned && stockAdjustments.length > 0) {
        for (const adjustment of stockAdjustments) {
          await api.post(
            '/stock-movements',
            {
              productId: adjustment.productId,
              type: 'OUTPUT',
              quantity: Number(adjustment.quantity || 0),
              note: `Estorno da reabertura da retirada ${currentWithdrawal.id}`,
            },
            authHeaders()
          );
        }
      }

      const updated = withdrawals.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'PENDENTE',
              finishedAt: null,
              returnedItems: '',
              returnDetails: null,
              stockReturned: false,
              stockAdjustments: [],
            }
          : item
      );

      saveToStorage(updated);
      await loadProducts();

      addAuditLog({
        area: 'Retiradas',
        action: 'UPDATE',
        title: `Retirada reaberta: ${currentWithdrawal.client || 'Cliente não informado'}`,
        description: `Itens: ${currentWithdrawal.item || '-'}\nBuscar: ${formatDate(currentWithdrawal.pickupDate)}`,
      });
    } catch (error) {
      console.log('Erro ao reabrir retirada:', error);
      alert('Não foi possível reabrir a retirada e estornar o estoque.');
    }
  }

  function deleteWithdrawal(id: string) {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja apagar essa retirada?\n\nEssa ação não tem como desfazer.'
    );

    if (!confirmDelete) {
      return;
    }

    const currentWithdrawal = withdrawals.find((item) => item.id === id);

    const updated = withdrawals.filter((item) => item.id !== id);
    saveToStorage(updated);

    addAuditLog({
      area: 'Retiradas',
      action: 'DELETE',
      title: `Retirada apagada: ${currentWithdrawal?.client || 'Cliente não informado'}`,
      description: `Itens: ${currentWithdrawal?.item || '-'}\nBuscar: ${formatDate(currentWithdrawal?.pickupDate)}`,
    });
  }

  const filteredWithdrawals = withdrawals.filter((item) => {
    const text = search.toLowerCase();

    const matchesSearch =
      item.client?.toLowerCase().includes(text) ||
      item.phone?.toLowerCase().includes(text) ||
      item.address?.toLowerCase().includes(text) ||
      item.item?.toLowerCase().includes(text) ||
      item.observation?.toLowerCase().includes(text);

    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'ATRASADO' && isLate(item.pickupDate, item.status)) ||
      (statusFilter === 'HOJE' && isToday(item.pickupDate, item.status)) ||
      (statusFilter === 'PENDENTE' && item.status !== 'RETIRADO') ||
      (statusFilter === 'RETIRADO' && item.status === 'RETIRADO');

    return matchesSearch && matchesStatus;
  });

  const pending = useMemo(() => {
    return withdrawals.filter((item) => item.status !== 'RETIRADO');
  }, [withdrawals]);

  const finished = useMemo(() => {
    return withdrawals.filter((item) => item.status === 'RETIRADO');
  }, [withdrawals]);

  const late = useMemo(() => {
    return withdrawals.filter((item) =>
      isLate(item.pickupDate, item.status)
    );
  }, [withdrawals]);

  const today = useMemo(() => {
    return withdrawals.filter((item) =>
      isToday(item.pickupDate, item.status)
    );
  }, [withdrawals]);

  return (
    <Layout>
      <PageHeader
        title="Retiradas"
        description="Controle de cascos, barris, cilindros e chopeiras para buscar."
      />

      {late.length > 0 && (
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-red-500/35 bg-red-500/12 p-6 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,.18),transparent_35%)]" />

          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-red-500 p-4 text-white shadow-[0_0_35px_rgba(239,68,68,.20)]">
                <AlertTriangle size={32} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-red-400">
                  {late.length} retirada(s) atrasada(s)
                </h2>

                <p className="font-bold text-zinc-300">
                  Priorize essas buscas antes das próximas entregas.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStatusFilter('ATRASADO')}
              className="rounded-2xl bg-red-500 px-6 py-3 font-black text-white transition hover:bg-red-400"
            >
              Ver atrasadas
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Pendentes" value={pending.length} />
        <Card title="Buscar hoje" value={today.length} />
        <Card title="Atrasadas" value={late.length} />
        <Card title="Retiradas feitas" value={finished.length} />
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
          />

          <input
            placeholder="Pesquisar por cliente, telefone, endereço ou item..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} pl-12`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={inputClass}
        >
          <option value="">Todas</option>
          <option value="ATRASADO">Atrasadas</option>
          <option value="HOJE">Buscar hoje</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="RETIRADO">Retiradas feitas</option>
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(250,204,21,.35)]"
        >
          <Plus size={20} />
          Nova Retirada
        </button>
      </div>

      <PremiumPanel>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
                <th className="p-5">Cliente</th>
                <th className="p-5">Telefone</th>
                <th className="p-5">Endereço</th>
                <th className="p-5">Item</th>
                <th className="p-5">Entrega</th>
                <th className="p-5">Buscar</th>
                <th className="p-5">Status</th>
                <th className="p-5">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredWithdrawals.map((item) => {
                const lateItem = isLate(item.pickupDate, item.status);
                const todayItem = isToday(item.pickupDate, item.status);

                return (
                  <tr
                    key={item.id}
                    className={`border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035] ${
                      lateItem ? 'bg-red-500/10' : ''
                    }`}
                  >
                    <td className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                          <Truck size={18} />
                        </div>

                        <div>
                          <p className="font-black text-white">
                            {item.client}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            ID: {String(item.id || '').slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-yellow-400" />
                        {item.phone || '-'}
                      </div>
                    </td>

                    <td className="p-5 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-yellow-400" />
                        {item.address || '-'}
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-start gap-2">
                        <Package size={17} className="mt-1 shrink-0 text-yellow-400" />

                        <div>
                          <p className="font-black text-zinc-200">
                            {item.item}
                          </p>

                          {item.observation && (
                            <p className="mt-1 text-xs text-zinc-500">
                              {item.observation}
                            </p>
                          )}

                          {item.status === 'RETIRADO' && item.returnedItems && (
                            <p className="mt-2 text-xs font-black text-green-400">
                              Voltou: {item.returnedItems}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-zinc-400">
                      {formatDate(item.deliveryDate)}
                    </td>

                    <td className="p-5 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={17} className="text-yellow-400" />
                        {formatDate(item.pickupDate)}
                      </div>
                    </td>

                    <td className="p-5">
                      {item.status === 'RETIRADO' ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/15 px-4 py-2 text-sm font-black text-green-400">
                          <CheckCircle size={16} />
                          Retirado
                        </span>
                      ) : lateItem ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/15 px-4 py-2 text-sm font-black text-red-400">
                          <AlertTriangle size={15} />
                          Atrasado
                        </span>
                      ) : todayItem ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/15 px-4 py-2 text-sm font-black text-yellow-400">
                          <CalendarDays size={15} />
                          Buscar hoje
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-zinc-500/20 bg-zinc-700/30 px-4 py-2 text-sm font-black text-zinc-300">
                          Pendente
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="flex gap-2">
                        {item.status === 'RETIRADO' ? (
                          <button
                            onClick={() => reopenWithdrawal(item.id)}
                            className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 font-black text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                          >
                            <RotateCcw size={18} />
                            Reabrir
                          </button>
                        ) : (
                          <button
                            onClick={() => openReturnConfirmation(item)}
                            className="flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/15 px-4 py-3 font-black text-green-400 transition hover:bg-green-500 hover:text-white"
                          >
                            <CheckCircle size={18} />
                            Retirado
                          </button>
                        )}

                        <button
                          onClick={() => deleteWithdrawal(item.id)}
                          className="rounded-xl border border-red-500/25 bg-red-500/15 p-3 text-red-400 transition hover:bg-red-500 hover:text-white"
                          title="Apagar retirada"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredWithdrawals.length === 0 && (
                <tr>
                  <td className="p-6 text-zinc-500" colSpan={8}>
                    Nenhuma retirada cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumPanel>

      {confirmingWithdrawal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/95 p-6 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar md:p-8">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Conferência do recolhimento
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    O que voltou de verdade?
                  </h2>

                  <p className="mt-2 text-sm font-medium text-zinc-400">
                    Cliente: <strong className="text-white">{confirmingWithdrawal.client}</strong>
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Informe as quantidades reais. O estoque será atualizado quando confirmar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmingWithdrawal(null);
                    setReturnRows([]);
                  }}
                  className="rounded-2xl border border-yellow-500/20 bg-black/45 p-3 text-zinc-300 transition hover:bg-yellow-400 hover:text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4">
                {returnRows.map((row, index) => {
                  const barrel = isBarrelReturnItem(row);
                  const equipment = isEquipmentReturnItem(row);

                  return (
                    <div
                      key={row.id || index}
                      className="rounded-2xl border border-yellow-500/15 bg-black/45 p-5"
                    >
                      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                        <div>
                          <p className="font-black text-white">{row.name}</p>
                          <p className="text-sm text-zinc-500">
                            Enviado: {row.quantitySent} {row.unit || 'un.'}
                          </p>
                        </div>

                        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
                          barrel
                            ? 'border-yellow-500/25 bg-yellow-500/10 text-yellow-400'
                            : equipment
                              ? 'border-blue-500/25 bg-blue-500/10 text-blue-400'
                              : 'border-zinc-500/20 bg-zinc-700/25 text-zinc-300'
                        }`}>
                          {barrel ? 'Barril / chopp' : equipment ? 'Equipamento' : 'Mercadoria'}
                        </span>
                      </div>

                      {barrel ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Voltou CHEIO">
                            <input
                              type="number"
                              min="0"
                              max={row.quantitySent}
                              value={row.fullReturned || 0}
                              onChange={(event) =>
                                updateReturnRow(index, 'fullReturned', event.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>

                          <Field label={`Voltou CASCO VAZIO${row.barrelSize ? ` (${row.barrelSize})` : ''}`}>
                            <input
                              type="number"
                              min="0"
                              max={row.quantitySent}
                              value={row.emptyReturned || 0}
                              onChange={(event) =>
                                updateReturnRow(index, 'emptyReturned', event.target.value)
                              }
                              className={inputClass}
                            />
                          </Field>

                          <p className="md:col-span-2 text-xs font-bold text-zinc-500">
                            Cheio + casco não pode passar de {row.quantitySent}.
                          </p>
                        </div>
                      ) : (
                        <Field label={equipment ? 'Quantidade recolhida' : 'Quantidade que voltou'}>
                          <input
                            type="number"
                            min="0"
                            max={row.quantitySent}
                            value={row.returnedQty || 0}
                            onChange={(event) =>
                              updateReturnRow(index, 'returnedQty', event.target.value)
                            }
                            className={inputClass}
                          />
                        </Field>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-sm font-black text-green-400">
                  Ao confirmar, barril cheio volta para o estoque do próprio produto; casco vazio entra no estoque de Casco pelo tamanho; chopeira, cilindro e outras mercadorias devolvidas voltam para seus respectivos estoques.
                </p>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  disabled={loadingReturn}
                  onClick={confirmStructuredWithdrawal}
                  className="rounded-2xl bg-gradient-to-r from-green-600 via-green-400 to-green-600 py-4 font-black text-black transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {loadingReturn ? 'Atualizando estoque...' : 'Confirmar recolhimento'}
                </button>

                <button
                  type="button"
                  disabled={loadingReturn}
                  onClick={() => {
                    setConfirmingWithdrawal(null);
                    setReturnRows([]);
                  }}
                  className="rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Retiradas
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    Nova Retirada
                  </h2>

                  <p className="mt-2 text-sm font-medium text-zinc-400">
                    Cadastre manualmente uma retirada para o entregador buscar.
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

              <form onSubmit={saveWithdrawal} className="space-y-4">
                <Field label="Nome do cliente">
                  <input
                    name="client"
                    placeholder="Nome do cliente"
                    className={inputClass}
                  />
                </Field>

                <Field label="Telefone">
                  <input
                    name="phone"
                    placeholder="Telefone do cliente"
                    className={inputClass}
                  />
                </Field>

                <Field label="Endereço">
                  <input
                    name="address"
                    placeholder="Endereço para buscar"
                    className={inputClass}
                  />
                </Field>

                <Field label="Itens para buscar">
                  <input
                    name="item"
                    placeholder="Ex: 1 chopeira, 2 barris, cascos..."
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Data da entrega">
                    <input
                      name="deliveryDate"
                      type="date"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Data para buscar de volta">
                    <input
                      name="pickupDate"
                      type="date"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Observação">
                  <textarea
                    name="observation"
                    placeholder="Ex: buscar depois das 18h, cliente pediu para ligar antes..."
                    className={`${inputClass} min-h-[110px] resize-none`}
                  />
                </Field>

                <button className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01]">
                  Salvar Retirada
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