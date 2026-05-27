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

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

const STORAGE_KEY = 'rjchopp_withdrawals';

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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setWithdrawals(JSON.parse(saved));
      } catch {
        setWithdrawals([]);
      }
    }
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

  function confirmWithdrawal(id: string) {
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

  function reopenWithdrawal(id: string) {
    const confirmAction = window.confirm(
      'Deseja voltar essa retirada para pendente?'
    );

    if (!confirmAction) {
      return;
    }

    const currentWithdrawal = withdrawals.find((item) => item.id === id);

    const updated = withdrawals.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'PENDENTE',
            finishedAt: null,
          }
        : item
    );

    saveToStorage(updated);

    addAuditLog({
      area: 'Retiradas',
      action: 'UPDATE',
      title: `Retirada reaberta: ${currentWithdrawal?.client || 'Cliente não informado'}`,
      description: `Itens: ${currentWithdrawal?.item || '-'}\nBuscar: ${formatDate(currentWithdrawal?.pickupDate)}`,
    });
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
                            onClick={() => confirmWithdrawal(item.id)}
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