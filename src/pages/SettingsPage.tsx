import { useEffect, useState } from 'react';
import {
  Save,
  Building2,
  Phone,
  MapPin,
  FileText,
  RotateCcw,
  Eye,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { addAuditLog } from '../services/audit';

const STORAGE_KEY = 'rjchopp_company_settings';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

const defaultSettings = {
  companyName: 'RJ CHOPP',
  phone: '(44) 99958-8160',
  city: 'Loanda - Paraná',
  address: '',
  document: '',
  noteMessage: 'Obrigado pela preferência.',
  reportFooter: 'Relatório gerado pelo sistema RJ Chopp SGE',
};

function getSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    };
  } catch {
    return defaultSettings;
  }
}

function Field({ label, icon: Icon, children }: any) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-black text-yellow-200">
        {Icon && <Icon size={18} className="text-yellow-400" />}
        {label}
      </label>

      {children}
    </div>
  );
}

function PremiumPanel({ title, description, icon: Icon, children }: any) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/50 p-8 shadow-[0_0_38px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.05),transparent_38%,rgba(250,204,21,.035))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      <div className="relative">
        <div className="mb-7 flex items-start gap-3">
          {Icon && (
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-3 text-yellow-400">
              <Icon size={24} />
            </div>
          )}

          <div>
            <h2 className="text-2xl font-black text-yellow-400">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm font-medium text-zinc-500">
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

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function updateField(field: string, value: string) {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function saveSettings(event: any) {
    event.preventDefault();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    addAuditLog({
      area: 'Configurações',
      action: 'SETTINGS',
      title: 'Configurações da empresa salvas',
      description: `Empresa: ${settings.companyName || '-'}\nTelefone: ${settings.phone || '-'}\nCidade: ${settings.city || '-'}\nDocumento: ${settings.document || '-'}`,
    });

    alert('Configurações salvas com sucesso.');
  }

  function resetSettings() {
    const confirmReset = window.confirm(
      'Tem certeza que deseja voltar as configurações para o padrão?'
    );

    if (!confirmReset) {
      return;
    }

    setSettings(defaultSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));

    addAuditLog({
      area: 'Configurações',
      action: 'SETTINGS',
      title: 'Configurações restauradas para o padrão',
      description: 'Os dados da empresa voltaram para o padrão do sistema.',
    });

    alert('Configurações restauradas.');
  }

  return (
    <Layout>
      <PageHeader
        title="Configurações"
        description="Dados da empresa usados nas notas, fichas de entrega, retirada e relatórios."
      />

      <form onSubmit={saveSettings} className="grid gap-8 xl:grid-cols-[1fr_460px]">
        <PremiumPanel
          title="Dados da empresa"
          description="Essas informações aparecem nas notas de pedido e nos relatórios impressos."
          icon={Building2}
        >
          <div className="space-y-5">
            <Field label="Nome da empresa" icon={Building2}>
              <input
                value={settings.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder="Ex: RJ CHOPP"
                className={inputClass}
              />
            </Field>

            <Field label="Telefone" icon={Phone}>
              <input
                value={settings.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="Ex: (44) 99958-8160"
                className={inputClass}
              />
            </Field>

            <Field label="Cidade" icon={MapPin}>
              <input
                value={settings.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Ex: Loanda - Paraná"
                className={inputClass}
              />
            </Field>

            <Field label="Endereço" icon={MapPin}>
              <input
                value={settings.address}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="Endereço da empresa"
                className={inputClass}
              />
            </Field>

            <Field label="CNPJ / Documento" icon={FileText}>
              <input
                value={settings.document}
                onChange={(event) => updateField('document', event.target.value)}
                placeholder="CNPJ ou documento, se quiser"
                className={inputClass}
              />
            </Field>

            <Field label="Mensagem da nota" icon={FileText}>
              <textarea
                value={settings.noteMessage}
                onChange={(event) => updateField('noteMessage', event.target.value)}
                placeholder="Mensagem que aparece na nota do pedido"
                className={`${inputClass} min-h-[110px] resize-none`}
              />
            </Field>

            <Field label="Rodapé do relatório" icon={FileText}>
              <textarea
                value={settings.reportFooter}
                onChange={(event) => updateField('reportFooter', event.target.value)}
                placeholder="Mensagem que aparece no final do relatório"
                className={`${inputClass} min-h-[90px] resize-none`}
              />
            </Field>

            <div className="flex flex-col gap-3 pt-4 md:flex-row">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01]">
                <Save size={20} />
                Salvar Configurações
              </button>

              <button
                type="button"
                onClick={resetSettings}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-yellow-500/15 bg-black/45 py-4 font-black text-zinc-300 transition hover:border-yellow-400/35 hover:text-yellow-400"
              >
                <RotateCcw size={20} />
                Restaurar Padrão
              </button>
            </div>
          </div>
        </PremiumPanel>

        <PremiumPanel
          title="Prévia"
          description="Veja como os dados aparecem na ficha impressa."
          icon={Eye}
        >
          <div className="overflow-hidden rounded-[2rem] border border-zinc-300 bg-white p-6 text-black shadow-[0_0_35px_rgba(255,255,255,.08)]">
            <div className="mb-4 border-b-4 border-black pb-4">
              <h1 className="text-4xl font-black">
                {settings.companyName || 'Nome da empresa'}
              </h1>

              <p className="font-bold text-zinc-700">
                Ficha de entrega e retirada
              </p>

              <p className="text-zinc-600">
                {settings.city || 'Cidade'} {settings.phone ? `| ${settings.phone}` : ''}
              </p>

              {settings.address && (
                <p className="text-zinc-600">
                  {settings.address}
                </p>
              )}

              {settings.document && (
                <p className="text-zinc-600">
                  {settings.document}
                </p>
              )}
            </div>

            <div className="mb-4 rounded-2xl border border-zinc-300 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                Mensagem da nota
              </p>

              <p className="font-bold">
                {settings.noteMessage || '-'}
              </p>
            </div>

            <div className="border-t border-zinc-300 pt-3 text-center text-xs text-zinc-500">
              {settings.reportFooter || '-'}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-yellow-500/15 bg-black/45 p-4">
            <p className="text-sm font-medium text-zinc-500">
              Por enquanto essas configurações ficam salvas neste navegador.
              Depois dá para salvar no banco de dados também.
            </p>
          </div>
        </PremiumPanel>
      </form>
    </Layout>
  );
}