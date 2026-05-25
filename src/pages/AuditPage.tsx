import { useMemo, useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  ShieldCheck,
  Clock,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import {
  clearAuditLogs,
  getAuditLogs,
} from '../services/audit';
import type { AuditLog } from '../services/audit';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

function formatDateTime(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('pt-BR');
}

function getActionLabel(action: string) {
  const labels: any = {
    CREATE: 'Criou',
    UPDATE: 'Editou',
    DELETE: 'Apagou',
    DELIVERED: 'Entregou',
    FINISHED: 'Finalizou',
    CANCELLED: 'Cancelou',
    WITHDRAWAL_OK: 'Retirada OK',
    LOGIN: 'Entrou',
    LOGOUT: 'Saiu',
    BACKUP: 'Backup',
    RESTORE: 'Restaurou',
    SETTINGS: 'Configuração',
  };

  return labels[action] || action;
}

function getActionClass(action: string) {
  if (action === 'DELETE' || action === 'CANCELLED') {
    return 'bg-red-500/20 text-red-400';
  }

  if (action === 'CREATE' || action === 'WITHDRAWAL_OK' || action === 'DELIVERED') {
    return 'bg-green-500/20 text-green-400';
  }

  if (action === 'UPDATE' || action === 'SETTINGS') {
    return 'bg-yellow-400/20 text-yellow-400';
  }

  return 'bg-blue-500/20 text-blue-400';
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(getAuditLogs());
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const areas = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.area))).filter(Boolean);
  }, [logs]);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action))).filter(Boolean);
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const text = search.toLowerCase();

    const matchesSearch =
      !text ||
      String(log.title || '').toLowerCase().includes(text) ||
      String(log.description || '').toLowerCase().includes(text) ||
      String(log.userName || '').toLowerCase().includes(text) ||
      String(log.userRoleLabel || '').toLowerCase().includes(text) ||
      String(log.area || '').toLowerCase().includes(text) ||
      getActionLabel(log.action).toLowerCase().includes(text);

    const matchesArea =
      !areaFilter ||
      log.area === areaFilter;

    const matchesAction =
      !actionFilter ||
      log.action === actionFilter;

    return matchesSearch && matchesArea && matchesAction;
  });

  function refreshLogs() {
    setLogs(getAuditLogs());
  }

  function deleteLogs() {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja limpar todo o histórico deste navegador?'
    );

    if (!confirmDelete) {
      return;
    }

    clearAuditLogs();
    setLogs([]);
  }

  function exportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `historico-rjchopp-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      <PageHeader
        title="Histórico"
        description="Registro de alterações feitas no sistema"
      />

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <History size={26} className="text-yellow-400" />

            <p className="text-zinc-400 font-bold">
              Registros
            </p>
          </div>

          <p className="text-4xl font-black">
            {logs.length}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck size={26} className="text-green-400" />

            <p className="text-zinc-400 font-bold">
              Usuários
            </p>
          </div>

          <p className="text-4xl font-black">
            {Array.from(new Set(logs.map((log) => log.userName))).length}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={26} className="text-blue-400" />

            <p className="text-zinc-400 font-bold">
              Último registro
            </p>
          </div>

          <p className="text-lg font-black text-yellow-400">
            {logs[0] ? formatDateTime(logs[0].createdAt) : '-'}
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
        <div className="grid md:grid-cols-[1fr_220px_220px] gap-4 mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ação, usuário, área ou detalhe..."
              className={`${inputClass} pl-12`}
            />
          </div>

          <select
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Todas as áreas</option>

            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Todas as ações</option>

            {actions.map((action) => (
              <option key={action} value={action}>
                {getActionLabel(action)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={refreshLogs}
            className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl px-5 py-3 font-bold"
          >
            Atualizar
          </button>

          <button
            onClick={exportLogs}
            className="bg-yellow-400 text-black rounded-2xl px-5 py-3 font-black flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Baixar histórico
          </button>

          <button
            onClick={deleteLogs}
            className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl px-5 py-3 font-bold flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Limpar histórico
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-black">
              <tr className="text-left text-zinc-400">
                <th className="p-5">Data/Hora</th>
                <th className="p-5">Usuário</th>
                <th className="p-5">Área</th>
                <th className="p-5">Ação</th>
                <th className="p-5">Descrição</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-zinc-800">
                  <td className="p-5 text-zinc-400">
                    {formatDateTime(log.createdAt)}
                  </td>

                  <td className="p-5">
                    <p className="font-black">
                      {log.userName}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {log.userRoleLabel}
                    </p>
                  </td>

                  <td className="p-5 text-zinc-300 font-bold">
                    {log.area}
                  </td>

                  <td className="p-5">
                    <span className={`${getActionClass(log.action)} px-4 py-2 rounded-full text-sm font-black`}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>

                  <td className="p-5">
                    <p className="font-bold">
                      {log.title}
                    </p>

                    {log.description && (
                      <p className="text-sm text-zinc-500 mt-1 whitespace-pre-wrap">
                        {log.description}
                      </p>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td className="p-5 text-zinc-500" colSpan={5}>
                    Nenhum histórico encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-zinc-500 text-sm mt-5">
        Esse histórico fica salvo neste navegador. Quando o sistema estiver online com login real, dá para salvar o histórico no banco de dados também.
      </p>
    </Layout>
  );
}
