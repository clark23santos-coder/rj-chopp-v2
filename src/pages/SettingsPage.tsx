import { useEffect, useState } from 'react';
import { Save, Building2, Phone, MapPin, FileText } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { addAuditLog } from '../services/audit';

const STORAGE_KEY = 'rjchopp_company_settings';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

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
        description="Dados da empresa usados em notas e relatórios"
      />

      <form onSubmit={saveSettings} className="grid lg:grid-cols-[1fr_420px] gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-2xl font-black text-yellow-400 mb-6">
            Dados da empresa
          </h2>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-zinc-300">
                <Building2 size={18} className="text-yellow-400" />
                Nome da empresa
              </label>

              <input
                value={settings.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder="Ex: RJ CHOPP"
                className={inputClass}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-zinc-300">
                <Phone size={18} className="text-yellow-400" />
                Telefone
              </label>

              <input
                value={settings.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="Ex: (44) 99958-8160"
                className={inputClass}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-zinc-300">
                <MapPin size={18} className="text-yellow-400" />
                Cidade
              </label>

              <input
                value={settings.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Ex: Loanda - Paraná"
                className={inputClass}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-zinc-300">
                <MapPin size={18} className="text-yellow-400" />
                Endereço
              </label>

              <input
                value={settings.address}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="Endereço da empresa"
                className={inputClass}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-zinc-300">
                <FileText size={18} className="text-yellow-400" />
                CNPJ / Documento
              </label>

              <input
                value={settings.document}
                onChange={(event) => updateField('document', event.target.value)}
                placeholder="CNPJ ou documento, se quiser"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold text-zinc-300">
                Mensagem da nota
              </label>

              <textarea
                value={settings.noteMessage}
                onChange={(event) => updateField('noteMessage', event.target.value)}
                placeholder="Mensagem que aparece na nota do pedido"
                className={`${inputClass} min-h-[110px]`}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold text-zinc-300">
                Rodapé do relatório
              </label>

              <textarea
                value={settings.reportFooter}
                onChange={(event) => updateField('reportFooter', event.target.value)}
                placeholder="Mensagem que aparece no final do relatório"
                className={`${inputClass} min-h-[90px]`}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-4">
              <button
                className="flex-1 bg-yellow-400 text-black rounded-2xl py-4 font-black flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Salvar Configurações
              </button>

              <button
                type="button"
                onClick={resetSettings}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-2xl py-4 font-bold"
              >
                Restaurar Padrão
              </button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-fit">
          <h2 className="text-2xl font-black text-yellow-400 mb-6">
            Prévia
          </h2>

          <div className="bg-white text-black rounded-3xl p-6">
            <div className="border-b-4 border-black pb-4 mb-4">
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

            <div className="border border-zinc-300 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-zinc-500 uppercase">
                Mensagem da nota
              </p>

              <p className="font-bold">
                {settings.noteMessage || '-'}
              </p>
            </div>

            <div className="border-t border-zinc-300 pt-3 text-xs text-zinc-500 text-center">
              {settings.reportFooter || '-'}
            </div>
          </div>

          <p className="text-zinc-500 text-sm mt-5">
            Por enquanto essas configurações ficam salvas neste navegador. Depois dá para salvar no banco de dados também.
          </p>
        </div>
      </form>
    </Layout>
  );
}
