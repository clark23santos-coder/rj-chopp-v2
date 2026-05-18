import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';

import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-yellow-400';

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
      } else {
        await api.post('/clients', data, authHeaders());
      }

      setShowModal(false);
      setEditingClient(null);

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

  return (
    <Layout>
      <PageHeader
        title="Clientes"
        description="Gerenciamento de clientes da RJ Chopp"
      />

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          placeholder="Pesquisar cliente por nome, telefone, email ou endereço..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
        />

        <button
          onClick={() => {
            setEditingClient(null);
            setShowModal(true);
          }}
          className="bg-yellow-400 text-black rounded-2xl px-6 py-3 font-black flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 hover:border-yellow-400/40 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-black break-words">
                  {client.name}
                </h2>

                <div className="mt-5 space-y-3 text-zinc-400">
                  <div className="flex items-start gap-2">
                    <Phone size={18} className="text-yellow-400 mt-1 shrink-0" />
                    <p className="break-words">
                      {client.phone || 'Sem telefone'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail size={18} className="text-yellow-400 mt-1 shrink-0" />
                    <p className="break-words">
                      {client.email || 'Sem email'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-yellow-400 mt-1 shrink-0" />
                    <p className="break-words">
                      {client.address || 'Sem endereço'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingClient(client);
                    setShowModal(true);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl"
                  title="Editar cliente"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => deleteClient(client)}
                  className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-3 rounded-xl"
                  title="Apagar cliente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 text-zinc-500">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <form
              onSubmit={saveClient}
              className="space-y-4"
            >
              <input
                name="name"
                placeholder="Nome"
                defaultValue={editingClient?.name || ''}
                className={inputClass}
              />

              <input
                name="phone"
                placeholder="Telefone"
                defaultValue={editingClient?.phone || ''}
                className={inputClass}
              />

              <input
                name="email"
                placeholder="Email"
                defaultValue={editingClient?.email || ''}
                className={inputClass}
              />

              <input
                name="address"
                placeholder="Endereço"
                defaultValue={editingClient?.address || ''}
                className={inputClass}
              />

              <button
                disabled={loading}
                className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Cliente'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingClient(null);
                }}
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