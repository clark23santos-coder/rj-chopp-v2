import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, CheckCircle, AlertTriangle, CalendarDays } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

const STORAGE_KEY = 'rjchopp_withdrawals';

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

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
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
    setShowModal(false);
  }

  function confirmWithdrawal(id: string) {
    const confirmAction = window.confirm(
      'Confirmar que essa retirada já foi feita?'
    );

    if (!confirmAction) {
      return;
    }

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
  }

  function reopenWithdrawal(id: string) {
    const confirmAction = window.confirm(
      'Deseja voltar essa retirada para pendente?'
    );

    if (!confirmAction) {
      return;
    }

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
  }

  function deleteWithdrawal(id: string) {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja apagar essa retirada?\n\nEssa ação não tem como desfazer.'
    );

    if (!confirmDelete) {
      return;
    }

    const updated = withdrawals.filter((item) => item.id !== id);
    saveToStorage(updated);
  }

  const filteredWithdrawals = withdrawals.filter((item) => {
    const text = search.toLowerCase();

    return (
      item.client?.toLowerCase().includes(text) ||
      item.phone?.toLowerCase().includes(text) ||
      item.address?.toLowerCase().includes(text) ||
      item.item?.toLowerCase().includes(text) ||
      item.observation?.toLowerCase().includes(text)
    );
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
        description="Controle de cascos, barris e chopeiras para buscar"
      />

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card title="Pendentes" value={pending.length} />
        <Card title="Buscar hoje" value={today.length} />
        <Card title="Atrasadas" value={late.length} />
        <Card title="Retiradas feitas" value={finished.length} />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          placeholder="Pesquisar por cliente, telefone, endereço ou item..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
        />

        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nova Retirada
        </button>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-black">
            <tr className="text-left text-zinc-400">
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
            {filteredWithdrawals.map((item) => (
              <tr key={item.id} className="border-t border-zinc-800">
                <td className="p-5 font-bold">
                  {item.client}
                </td>

                <td className="p-5 text-zinc-400">
                  {item.phone || '-'}
                </td>

                <td className="p-5 text-zinc-400">
                  {item.address || '-'}
                </td>

                <td className="p-5 text-zinc-300 font-bold">
                  {item.item}
                  {item.observation && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {item.observation}
                    </p>
                  )}
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
                    <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                      Retirado
                    </span>
                  ) : isLate(item.pickupDate, item.status) ? (
                    <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2">
                      <AlertTriangle size={15} />
                      Atrasado
                    </span>
                  ) : isToday(item.pickupDate, item.status) ? (
                    <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold">
                      Buscar hoje
                    </span>
                  ) : (
                    <span className="bg-zinc-700/60 text-zinc-300 px-4 py-2 rounded-full text-sm font-bold">
                      Pendente
                    </span>
                  )}
                </td>

                <td className="p-5">
                  <div className="flex gap-2">
                    {item.status === 'RETIRADO' ? (
                      <button
                        onClick={() => reopenWithdrawal(item.id)}
                        className="bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-3 font-bold"
                      >
                        Reabrir
                      </button>
                    ) : (
                      <button
                        onClick={() => confirmWithdrawal(item.id)}
                        className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-xl px-4 py-3 font-bold flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Retirado
                      </button>
                    )}

                    <button
                      onClick={() => deleteWithdrawal(item.id)}
                      className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-3 rounded-xl"
                      title="Apagar retirada"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredWithdrawals.length === 0 && (
              <tr>
                <td className="p-5 text-zinc-500" colSpan={8}>
                  Nenhuma retirada cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              Nova Retirada
            </h2>

            <form onSubmit={saveWithdrawal} className="space-y-4">
              <input
                name="client"
                placeholder="Nome do cliente"
                className={inputClass}
              />

              <input
                name="phone"
                placeholder="Telefone do cliente"
                className={inputClass}
              />

              <input
                name="address"
                placeholder="Endereço para buscar"
                className={inputClass}
              />

              <input
                name="item"
                placeholder="O que precisa buscar? Ex: 1 chopeira, 2 barris, cascos..."
                className={inputClass}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-bold text-zinc-300">
                    Data da entrega
                  </label>

                  <input
                    name="deliveryDate"
                    type="date"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-bold text-zinc-300">
                    Data para buscar de volta
                  </label>

                  <input
                    name="pickupDate"
                    type="date"
                    className={inputClass}
                  />
                </div>
              </div>

              <textarea
                name="observation"
                placeholder="Observação. Ex: buscar depois das 18h, cliente pediu para ligar antes..."
                className={`${inputClass} min-h-[110px]`}
              />

              <button className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black">
                Salvar Retirada
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full bg-zinc-800 rounded-2xl py-4 font-bold"
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