import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';

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
    const response = await api.get('/clients', authHeaders());

    setClients(response.data);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function saveClient(event: any) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const data = {
      name: String(form.get('name')),
      phone: String(form.get('phone')),
      email: String(form.get('email')),
      address: String(form.get('address')),
    };

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

    loadClients();
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
          placeholder="Pesquisar cliente..."
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
            className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  {client.name}
                </h2>

                <div className="mt-5 space-y-2 text-zinc-400">
                  <p>{client.phone || 'Sem telefone'}</p>
                  <p>{client.email || 'Sem email'}</p>
                  <p>{client.address || 'Sem endereço'}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingClient(client);
                  setShowModal(true);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl"
              >
                <Pencil size={18} />
              </button>
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
              {editingClient
                ? 'Editar Cliente'
                : 'Novo Cliente'}
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

              <button className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black">
                Salvar Cliente
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