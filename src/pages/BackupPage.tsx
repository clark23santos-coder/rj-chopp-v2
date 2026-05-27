import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Database,
  Trash2,
  HardDrive,
  FileJson,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { addAuditLog } from '../services/audit';

const BACKUP_KEYS = [
  'rjchopp_company_settings',
  'rjchopp_withdrawals',
  'rjchopp_order_meta',
  'rjchopp_audit_logs',
];

function getTodayFileName() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `backup-rjchopp-${year}-${month}-${day}-${hour}-${minute}.json`;
}

function safeJsonParse(value: any, fallback: any) {
  try {
    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function PremiumPanel({ title, description, icon: Icon, children }: any) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/50 p-8 shadow-[0_0_38px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.05),transparent_38%,rgba(250,204,21,.035))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative">
        <div className="mb-7 flex items-start gap-4">
          {Icon && (
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-yellow-400 shadow-[0_0_25px_rgba(250,204,21,.12)]">
              <Icon size={30} />
            </div>
          )}

          <div>
            <h2 className="text-3xl font-black text-yellow-400">
              {title}
            </h2>

            {description && (
              <p className="mt-2 font-medium text-zinc-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, variant = 'yellow', onClick }: any) {
  const variantClass =
    variant === 'yellow'
      ? 'border-yellow-500/25 bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_0_35px_rgba(250,204,21,.18)]'
      : 'border-yellow-500/15 bg-black/45 text-white hover:border-yellow-400/35 hover:text-yellow-400';

  const iconClass =
    variant === 'yellow'
      ? 'text-black'
      : 'text-yellow-400';

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[2rem] border p-6 text-left font-black transition duration-300 hover:-translate-y-1 ${variantClass}`}
    >
      <div
        className={`absolute inset-0 ${
          variant === 'yellow'
            ? 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.30),transparent_34%)]'
            : 'bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.12),transparent_34%)]'
        }`}
      />

      <div className="relative">
        <Icon size={34} className={`mb-5 ${iconClass}`} />

        <p className="text-2xl">
          {title}
        </p>

        <p className={`mt-2 font-bold ${variant === 'yellow' ? 'text-black/70' : 'text-zinc-400'}`}>
          {description}
        </p>
      </div>
    </button>
  );
}

function InfoLine({ icon: Icon, children, tone = 'green' }: any) {
  const toneClass =
    tone === 'yellow'
      ? 'text-yellow-400'
      : tone === 'red'
        ? 'text-red-400'
        : 'text-green-400';

  return (
    <p className="flex items-start gap-3 text-zinc-300">
      <Icon size={20} className={`${toneClass} mt-1 shrink-0`} />
      <span>{children}</span>
    </p>
  );
}

export default function BackupPage() {
  const fileInputRef = useRef<any>(null);
  const [lastMessage, setLastMessage] = useState('');

  function exportBackup() {
    const localStorageData: any = {};

    BACKUP_KEYS.forEach((key) => {
      localStorageData[key] = safeJsonParse(localStorage.getItem(key), null);
    });

    const fileName = getTodayFileName();

    const backup = {
      app: 'RJ Chopp SGE',
      version: '1.0',
      createdAt: new Date().toISOString(),
      warning:
        'Este backup salva as configurações locais do navegador, retiradas e dados auxiliares. Produtos, clientes, pedidos e financeiro ficam no banco de dados do backend.',
      localStorageData,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);

    addAuditLog({
      area: 'Backup',
      action: 'BACKUP',
      title: 'Backup baixado',
      description: `Arquivo gerado: ${fileName}`,
    });

    setLastMessage('Backup baixado com sucesso.');
  }

  function openFileSelector() {
    fileInputRef.current?.click();
  }

  async function importBackup(event: any) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup || !backup.localStorageData) {
        alert('Arquivo de backup inválido.');
        return;
      }

      const confirmImport = window.confirm(
        'Tem certeza que deseja restaurar esse backup?\n\nIsso vai substituir as configurações locais, retiradas e dados auxiliares deste navegador.'
      );

      if (!confirmImport) {
        return;
      }

      BACKUP_KEYS.forEach((key) => {
        const value = backup.localStorageData[key];

        if (value === null || value === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      addAuditLog({
        area: 'Backup',
        action: 'RESTORE',
        title: 'Backup restaurado',
        description: `Arquivo importado: ${file.name}`,
      });

      setLastMessage('Backup restaurado com sucesso. Atualize o sistema com Ctrl + F5.');
      alert('Backup restaurado com sucesso. Atualize o sistema com Ctrl + F5.');
    } catch (error) {
      console.log('Erro ao restaurar backup:', error);
      alert('Não foi possível restaurar esse backup.');
    } finally {
      event.target.value = '';
    }
  }

  function clearLocalData() {
    const confirmClear = window.confirm(
      'Tem certeza que deseja apagar os dados locais deste navegador?\n\nIsso apaga Configurações, Retiradas e dados auxiliares locais. Não apaga produtos, clientes, pedidos nem financeiro do banco.'
    );

    if (!confirmClear) {
      return;
    }

    BACKUP_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });

    addAuditLog({
      area: 'Backup',
      action: 'DELETE',
      title: 'Dados locais apagados',
      description: 'Configurações locais, retiradas e dados auxiliares locais foram apagados deste navegador.',
    });

    setLastMessage('Dados locais apagados. Atualize o sistema com Ctrl + F5.');
    alert('Dados locais apagados. Atualize o sistema com Ctrl + F5.');
  }

  return (
    <Layout>
      <PageHeader
        title="Backup"
        description="Backup e restauração dos dados locais do sistema."
      />

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <PremiumPanel
          title="Backup local"
          description="Use essa tela para baixar ou restaurar as informações salvas no navegador."
          icon={Database}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <ActionCard
              icon={Download}
              title="Baixar Backup"
              description="Gera um arquivo .json com os dados locais."
              variant="yellow"
              onClick={exportBackup}
            />

            <ActionCard
              icon={Upload}
              title="Restaurar Backup"
              description="Importa um arquivo de backup salvo antes."
              onClick={openFileSelector}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={importBackup}
            className="hidden"
          />

          <div className="mt-8 rounded-[2rem] border border-yellow-500/15 bg-black/45 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
                <FileJson size={24} />
              </div>

              <h3 className="text-xl font-black text-yellow-400">
                O que este backup salva?
              </h3>
            </div>

            <div className="space-y-3">
              <InfoLine icon={ShieldCheck}>
                Configurações da empresa.
              </InfoLine>

              <InfoLine icon={ShieldCheck}>
                Retiradas salvas no navegador.
              </InfoLine>

              <InfoLine icon={ShieldCheck}>
                Datas de entrega, datas de busca e observações auxiliares dos pedidos.
              </InfoLine>

              <InfoLine icon={AlertTriangle} tone="yellow">
                Produtos, clientes, pedidos e financeiro ficam no banco do backend.
                Depois podemos criar um backup completo do banco também.
              </InfoLine>
            </div>
          </div>

          {lastMessage && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/15 p-4 font-black text-green-400">
              <CheckCircle size={22} />
              {lastMessage}
            </div>
          )}
        </PremiumPanel>

        <PremiumPanel
          title="Segurança"
          description="Cuidados importantes antes de apagar, importar ou guardar backups."
          icon={HardDrive}
        >
          <div className="space-y-4 text-zinc-300">
            <p>
              Guarde o arquivo de backup em um lugar seguro, como Google Drive, pendrive ou pasta separada.
            </p>

            <p>
              Faça backup sempre antes de grandes alterações no sistema.
            </p>

            <p>
              Esse backup é local. Se você trocar de computador ou navegador, precisa importar o arquivo novamente.
            </p>
          </div>

          <div className="mt-7 rounded-2xl border border-red-500/25 bg-red-500/10 p-5">
            <div className="mb-3 flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-400" />

              <h3 className="text-xl font-black text-red-400">
                Área de risco
              </h3>
            </div>

            <p className="mb-5 text-sm font-medium text-zinc-400">
              Essa opção apaga apenas dados locais deste navegador.
              Não apaga produtos, clientes, pedidos nem financeiro do banco.
            </p>

            <button
              onClick={clearLocalData}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/15 py-4 font-black text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              <Trash2 size={20} />
              Apagar dados locais deste navegador
            </button>
          </div>

          <button
            onClick={openFileSelector}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
          >
            <RotateCcw size={20} />
            Restaurar backup salvo
          </button>
        </PremiumPanel>
      </div>
    </Layout>
  );
}