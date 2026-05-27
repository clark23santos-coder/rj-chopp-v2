import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Search,
  Users,
  UserPlus,
  X,
} from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { addAuditLog } from '../services/audit';

const inputClass =
  'w-full bg-black/55 border border-yellow-500/20 rounded-2xl px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:bg-black/70 focus:shadow-[0_0_28px_rgba(250,204,21,.14)]';

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

function PremiumCard({ title, value, icon: Icon, tone = 'yellow' }: any) {
  const toneClass =
    tone === 'green'
      ? 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/25'
      : 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/25';

  return (
    <div className="group relative min-h-[140px] overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400/35 hover:shadow-[0_0_50px_rgba(245,158,11,.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-black text-zinc-300 md:text-base">
            {title}
          </p>

          <div className={`rounded-2xl border bg-gradient-to-br p-3 ${toneClass}`}>
            <Icon size={22} />
          </div>
        </div>

        <p className="mt-6 text-4xl font-black leading-none text-white md:text-5xl">
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

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  async function loadClients() {
    try {
      const response = await api.get('/clients', authHeaders());
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log('Erro ao carregar clientes:', error);
      setClients([]);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function openNewClient() {
    setEditingClient(null);
    setShowModal(true);
  }

  function openEditClient(client: any) {
    setEditingClient(client);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingClient(null);
  }

  async function saveClient(event: any) {
    event.preventDefault();

    try {
      setLoading(true);

      const form = new FormData(event.currentTarget);

      const data = {
        name: String(form.get('name') || ''),
        phone: String(form.get('phone') || ''),
        email: String(form.get('email') || ''),
        address: String(form.get('address') || ''),
      };

      if (!data.name.trim()) {
        alert('Coloque o nome do cliente.');
        return;
      }

      if (!data.phone.trim()) {
        alert('Coloque o telefone do cliente.');
        return;
      }

      if (editingClient) {
        await api.put(
          `/clients/${editingClient.id}`,
          data,
          authHeaders()
        );

        addAuditLog({
          area: 'Clientes',
          action: 'UPDATE',
          title: `Cliente editado: ${data.name}`,
          description: `Telefone: ${data.phone || '-'}\nEmail: ${data.email || '-'}\nEndereço: ${data.address || '-'}`,
        });
      } else {
        await api.post('/clients', data, authHeaders());

        addAuditLog({
          area: 'Clientes',
          action: 'CREATE',
          title: `Cliente criado: ${data.name}`,
          description: `Telefone: ${data.phone || '-'}\nEmail: ${data.email || '-'}\nEndereço: ${data.address || '-'}`,
        });
      }

      closeModal();

      await loadClients();
    } catch (error) {
      console.log('Erro ao salvar cliente:', error);
      alert('Não foi possível salvar o cliente.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteClient(client: any) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja apagar o cliente "${client.name}"?\n\nEssa ação não tem como desfazer.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      await api.delete(`/clients/${client.id}`, authHeaders());

      await loadClients();

      addAuditLog({
        area: 'Clientes',
        action: 'DELETE',
        title: `Cliente apagado: ${client.name || 'Cliente'}`,
        description: `Telefone: ${client.phone || '-'}\nEmail: ${client.email || '-'}\nEndereço: ${client.address || '-'}`,
      });

      alert('Cliente apagado com sucesso.');
    } catch (error) {
      console.log('Erro ao apagar cliente:', error);
      alert(
        'Não foi possível apagar esse cliente. Se ele estiver em algum pedido, primeiro apague o pedido ou deixe o cliente salvo.'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter((client) => {
    const text = search.toLowerCase();

    return (
      client.name?.toLowerCase().includes(text) ||
      client.phone?.toLowerCase().includes(text) ||
      client.email?.toLowerCase().includes(text) ||
      client.address?.toLowerCase().includes(text)
    );
  });

  const totals = useMemo(() => {
    const withPhone = clients.filter((client) => String(client.phone || '').trim()).length;
    const withAddress = clients.filter((client) => String(client.address || '').trim()).length;

    return {
      clients: clients.length,
      filtered: filteredClients.length,
      withPhone,
      withAddress,
    };
  }, [clients, filteredClients.length]);

  return (
    <Layout>
      <PageHeader
        title="Clientes"
        description="Cadastro, consulta e gerenciamento dos clientes da RJ Chopp."
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumCard title="Clientes cadastrados" value={totals.clients} icon={Users} />
        <PremiumCard title="Resultado da busca" value={totals.filtered} icon={Search} />
        <PremiumCard title="Com telefone" value={totals.withPhone} icon={Phone} tone="green" />
        <PremiumCard title="Com endereço" value={totals.withAddress} icon={MapPin} tone="green" />
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
          />

          <input
            placeholder="Pesquisar cliente por nome, telefone, email ou endereço..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} pl-12`}
          />
        </div>

        <button
          onClick={openNewClient}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 py-3 font-black text-black shadow-[0_0_30px_rgba(250,204,21,.22)] transition hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(250,204,21,.35)]"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="group relative overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-6 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400/35 hover:shadow-[0_0_50px_rgba(245,158,11,.16)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.13),transparent_35%),linear-gradient(135deg,rgba(255,255,255,.055),transparent_38%,rgba(250,204,21,.035))]" />
            <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/45 to-transparent" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-500/25 bg-yellow-500/10 text-yellow-400">
                  <UserPlus size={24} />
                </div>

                <h2 className="break-words text-2xl font-black text-white">
                  {client.name}
                </h2>

                <p className="mt-1 text-xs font-medium text-zinc-500">
                  ID: {String(client.id || '').slice(0, 8)}
                </p>

                <div className="mt-5 space-y-3 text-zinc-400">
                  <div className="flex items-start gap-2">
                    <Phone size={18} className="mt-1 shrink-0 text-yellow-400" />

                    <p className="break-words">
                      {client.phone || 'Sem telefone'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail size={18} className="mt-1 shrink-0 text-yellow-400" />

                    <p className="break-words">
                      {client.email || 'Sem email'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="mt-1 shrink-0 text-yellow-400" />

                    <p className="break-words">
                      {client.address || 'Sem endereço'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <button
                  onClick={() => openEditClient(client)}
                  className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
                  title="Editar cliente"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => deleteClient(client)}
                  className="rounded-xl border border-red-500/25 bg-red-500/15 p-3 text-red-400 transition hover:bg-red-500 hover:text-white"
                  title="Apagar cliente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <PremiumPanel>
            <div className="p-6 text-zinc-500">
              Nenhum cliente encontrado.
            </div>
          </PremiumPanel>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-500/20 bg-black/90 p-8 shadow-[0_0_70px_rgba(245,158,11,.20)] custom-scrollbar">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(250,204,21,.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
                    Clientes
                  </p>

                  <h2 className="text-3xl font-black text-white">
                    {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-yellow-500/20 bg-black/45 p-3 text-zinc-300 transition hover:bg-yellow-400 hover:text-black"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={saveClient} className="space-y-4">
                <Field label="Nome">
                  <input
                    name="name"
                    placeholder="Nome do cliente"
                    defaultValue={editingClient?.name || ''}
                    className={inputClass}
                  />
                </Field>

                <Field label="Telefone">
                  <input
                    name="phone"
                    placeholder="Telefone"
                    defaultValue={editingClient?.phone || ''}
                    className={inputClass}
                  />
                </Field>

                <Field label="Email">
                  <input
                    name="email"
                    placeholder="Email"
                    defaultValue={editingClient?.email || ''}
                    className={inputClass}
                  />
                </Field>

                <Field label="Endereço">
                  <input
                    name="address"
                    placeholder="Endereço completo"
                    defaultValue={editingClient?.address || ''}
                    className={inputClass}
                  />
                </Field>

                <button
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 py-4 font-black text-black shadow-[0_0_35px_rgba(250,204,21,.26)] transition hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Cliente'}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
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