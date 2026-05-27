import { useMemo, useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  ShieldCheck,
  Clock,
  RefreshCcw,
  User,
  Filter,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import {
  clearAuditLogs,
  getAuditLogs,
} from '../services/audit';
import type { AuditLog } from '../services/audit';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

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
    LOGIN: 'Entrou',
    LOGOUT: 'Saiu',
    BACKUP: 'Backup',
    RESTORE: 'Restaurou',
    SETTINGS: 'Configuração',
    WITHDRAWAL_OK: 'Retirada OK',
  };

  return labels[action] || action;
}

function getActionClass(action: string) {
  if (action === 'DELETE' || action === 'CANCELLED') {
    return 'border-red-500/25 bg-red-500/15 text-red-400';
  }

  if (action === 'CREATE' || action === 'WITHDRAWAL_OK' || action === 'DELIVERED') {
    return 'border-green-500/25 bg-green-500/15 text-green-400';
  }

  if (action === 'UPDATE' || action === 'SETTINGS') {
    return 'border-yellow-500/25 bg-yellow-500/15 text-yellow-400';
  }

  return 'border-blue-500/25 bg-blue-500/15 text-blue-400';
}

function StatCard({ title, value, icon: Icon, tone = 'yellow' }: any) {
  const toneClass =
    tone === 'green'
      ? 'border-green-500/25 bg-green-500/15 text-green-400'
      : tone === 'blue'
        ? 'border-blue-500/25 bg-blue-500/15 text-blue-400'
        : 'border-yellow-500/25 bg-yellow-500/15 text-yellow-400';

  return (
    <div className="group relative min-h-[145px] overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400/35 hover:shadow-[0_0_50px_rgba(245,158,11,.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-black text-zinc-300 md:text-base">
            {title}
          </p>

          <div className={`rounded-2xl border p-3 ${toneClass}`}>
            <Icon size={22} />
          </div>
        </div>

        <p className="mt-6 break-words text-2xl font-black leading-tight text-white md:text-4xl">
          {value}
        </p>
      </div>
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
        description="Registro de alterações feitas no sistema, ações dos usuários e auditoria local."
      />

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <StatCard
          title="Registros"
          value={logs.length}
          icon={History}
        />

        <StatCard
          title="Usuários"
          value={Array.from(new Set(logs.map((log) => log.userName))).length}
          icon={ShieldCheck}
          tone="green"
        />

        <StatCard
          title="Último registro"
          value={logs[0] ? formatDateTime(logs[0].createdAt) : '-'}
          icon={Clock}
          tone="blue"
        />
      </div>

      <PremiumPanel>
        <div className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
              <Filter size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-yellow-400">
                Filtros do histórico
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Busque por usuário, ação, área ou detalhe da alteração.
              </p>
            </div>
          </div>

          <div className="mb-4 grid gap-4 md:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
              />

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

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              onClick={refreshLogs}
              className="flex items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 px-5 py-3 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
            >
              <RefreshCcw size={18} />
              Atualizar
            </button>

            <button
              onClick={exportLogs}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-5 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01]"
            >
              <Download size={18} />
              Baixar histórico
            </button>

            <button
              onClick={deleteLogs}
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/15 px-5 py-3 font-black text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              <Trash2 size={18} />
              Limpar histórico
            </button>
          </div>
        </div>
      </PremiumPanel>

      <div className="mt-8">
        <PremiumPanel>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-yellow-500/15 bg-black/45 text-left text-sm font-black uppercase tracking-wide text-zinc-400">
                  <th className="p-5">Data/Hora</th>
                  <th className="p-5">Usuário</th>
                  <th className="p-5">Área</th>
                  <th className="p-5">Ação</th>
                  <th className="p-5">Descrição</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-yellow-500/10 transition hover:bg-yellow-400/[0.035]"
                  >
                    <td className="p-5 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-yellow-400" />
                        {formatDateTime(log.createdAt)}
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-400">
                          <User size={18} />
                        </div>

                        <div>
                          <p className="font-black text-white">
                            {log.userName}
                          </p>

                          <p className="text-xs text-zinc-500">
                            {log.userRoleLabel}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 font-black text-zinc-300">
                      {log.area}
                    </td>

                    <td className="p-5">
                      <span className={`${getActionClass(log.action)} inline-flex rounded-full border px-4 py-2 text-sm font-black`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>

                    <td className="p-5">
                      <p className="font-black text-white">
                        {log.title}
                      </p>

                      {log.description && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-500">
                          {log.description}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td className="p-6 text-zinc-500" colSpan={5}>
                      Nenhum histórico encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PremiumPanel>
      </div>

      <p className="mt-5 rounded-2xl border border-yellow-500/15 bg-black/45 p-4 text-sm font-medium text-zinc-500">
        Esse histórico fica salvo neste navegador. Quando o sistema estiver online com login real,
        dá para salvar o histórico no banco de dados também.
      </p>
    </Layout>
  );
}