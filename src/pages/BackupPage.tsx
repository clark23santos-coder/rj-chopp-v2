import { useRef, useState } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle, Database } from 'lucide-react';

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

export default function BackupPage() {
  const fileInputRef = useRef<any>(null);
  const [lastMessage, setLastMessage] = useState('');

  function exportBackup() {
    const localStorageData: any = {};

    BACKUP_KEYS.forEach((key) => {
      localStorageData[key] = safeJsonParse(localStorage.getItem(key), null);
    });

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
    link.download = getTodayFileName();
    link.click();

    URL.revokeObjectURL(url);

    addAuditLog({
      area: 'Backup',
      action: 'BACKUP',
      title: 'Backup baixado',
      description: `Arquivo gerado: ${getTodayFileName()}`,
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
        description="Backup e restauração dos dados locais do sistema"
      />

      <div className="grid lg:grid-cols-[1fr_420px] gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="bg-yellow-400 text-black rounded-2xl p-4">
              <Database size={32} />
            </div>

            <div>
              <h2 className="text-3xl font-black text-yellow-400">
                Backup local
              </h2>

              <p className="text-zinc-400 mt-2">
                Use essa tela para baixar ou restaurar as informações salvas no navegador.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <button
              onClick={exportBackup}
              className="bg-yellow-400 text-black rounded-3xl p-6 font-black text-left hover:bg-yellow-500 transition"
            >
              <Download size={32} className="mb-4" />

              <p className="text-2xl">
                Baixar Backup
              </p>

              <p className="text-black/70 mt-2 font-bold">
                Gera um arquivo .json com os dados locais.
              </p>
            </button>

            <button
              onClick={openFileSelector}
              className="bg-zinc-800 text-white rounded-3xl p-6 font-black text-left hover:bg-zinc-700 transition"
            >
              <Upload size={32} className="mb-4 text-yellow-400" />

              <p className="text-2xl">
                Restaurar Backup
              </p>

              <p className="text-zinc-400 mt-2 font-bold">
                Importa um arquivo de backup salvo antes.
              </p>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={importBackup}
            className="hidden"
          />

          <div className="mt-8 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-xl font-black text-yellow-400 mb-3">
              O que este backup salva?
            </h3>

            <div className="space-y-3 text-zinc-300">
              <p className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-green-400 shrink-0 mt-1" />
                Configurações da empresa.
              </p>

              <p className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-green-400 shrink-0 mt-1" />
                Retiradas salvas no navegador.
              </p>

              <p className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-green-400 shrink-0 mt-1" />
                Datas de entrega, datas de busca e observações auxiliares dos pedidos.
              </p>

              <p className="flex items-start gap-3 text-yellow-400">
                <AlertTriangle size={20} className="shrink-0 mt-1" />
                Produtos, clientes, pedidos e financeiro ficam no banco do backend. Depois podemos criar um backup completo do banco também.
              </p>
            </div>
          </div>

          {lastMessage && (
            <div className="mt-6 bg-green-500/20 border border-green-500/30 text-green-400 rounded-2xl p-4 font-bold">
              {lastMessage}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-fit">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Segurança
          </h2>

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

          <button
            onClick={clearLocalData}
            className="mt-8 w-full bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-2xl py-4 font-black"
          >
            Apagar dados locais deste navegador
          </button>
        </div>
      </div>
    </Layout>
  );
}
