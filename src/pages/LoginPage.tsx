import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Beer, CheckCircle } from 'lucide-react';

const inputClass =
  'w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-white outline-none focus:border-yellow-400';

const REMEMBER_LOGIN_KEY = 'rjchopp_remember_login';

const users = [
  {
    username: 'clark',
    password: '232814',
    name: 'Clark',
    role: 'ADMIN',
    roleLabel: 'Admin',
  },
  {
    username: 'uber',
    password: '060705',
    name: 'Uber',
    role: 'ADMIN',
    roleLabel: 'Admin',
  },
  {
    username: 'entregador',
    password: '1234',
    name: 'Entregador',
    role: 'DELIVERY',
    roleLabel: 'Entregador',
  },
];

function getHomeByRole(role: string) {
  if (role === 'DELIVERY') {
    return '/retiradas';
  }

  if (role === 'FINANCE') {
    return '/financeiro';
  }

  return '/';
}

function getSavedLogin() {
  try {
    const saved = localStorage.getItem(REMEMBER_LOGIN_KEY);

    if (!saved) {
      return {
        username: '',
        remember: false,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      username: parsed.username || '',
      remember: true,
    };
  } catch {
    return {
      username: '',
      remember: false,
    };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getSavedLogin();

    setUsername(saved.username);
    setRememberLogin(saved.remember);
    setPassword('');
  }, []);

  function login(event: any) {
    event.preventDefault();

    setLoading(true);

    const user = users.find((item) => {
      return (
        item.username.toLowerCase() === username.toLowerCase().trim() &&
        item.password === password
      );
    });

    if (!user) {
      setLoading(false);
      alert('Usuário ou senha inválidos.');
      return;
    }

    const userToSave = {
      name: user.name,
      username: user.username,
      role: user.role,
      roleLabel: user.roleLabel,
      loggedAt: new Date().toISOString(),
    };

    localStorage.setItem('rjchopp_user', JSON.stringify(userToSave));

    if (rememberLogin) {
      localStorage.setItem(
        REMEMBER_LOGIN_KEY,
        JSON.stringify({
          username: user.username,
        })
      );
    } else {
      localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }

    setLoading(false);

    navigate(getHomeByRole(user.role));
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#facc1530,transparent_40%),radial-gradient(circle_at_bottom_right,#22c55e20,transparent_35%)]" />

      <div className="relative w-full max-w-5xl grid lg:grid-cols-[1fr_420px] gap-8 items-center">
        <div className="hidden lg:block">
          <div className="bg-black/60 border border-zinc-800 rounded-[2rem] p-10 shadow-2xl">
            <div className="bg-yellow-400 text-black rounded-3xl w-20 h-20 flex items-center justify-center mb-8">
              <Beer size={42} />
            </div>

            <h1 className="text-6xl font-black leading-none mb-6">
              RJ Chopp
              <span className="block text-yellow-400">
                SGE
              </span>
            </h1>

            <p className="text-zinc-400 text-xl font-bold max-w-lg">
              Controle de pedidos, estoque, financeiro, retiradas e relatórios em um só lugar.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                <p className="text-yellow-400 font-black text-3xl">3</p>
                <p className="text-zinc-400 font-bold">acessos cadastrados</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
                <p className="text-yellow-400 font-black text-3xl">100%</p>
                <p className="text-zinc-400 font-bold">organizado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 rounded-[2rem] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto bg-yellow-400 text-black rounded-3xl w-16 h-16 flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>

            <h2 className="text-4xl font-black text-yellow-400">
              Entrar
            </h2>

            <p className="text-zinc-500 font-bold mt-2">
              Acesse o sistema RJ Chopp
            </p>
          </div>

          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-zinc-300">
                <User size={18} className="text-yellow-400" />
                Usuário
              </label>

              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Digite seu usuário"
                autoComplete="username"
                className={inputClass}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-zinc-300">
                <Lock size={18} className="text-yellow-400" />
                Senha
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberLogin}
                onChange={(event) => setRememberLogin(event.target.checked)}
                className="hidden"
              />

              <span
                className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                  rememberLogin
                    ? 'bg-yellow-400 border-yellow-400 text-black'
                    : 'border-zinc-700 text-transparent'
                }`}
              >
                <CheckCircle size={18} />
              </span>

              <span className="font-bold text-zinc-300">
                Salvar login neste computador
              </span>
            </label>

            <button
              disabled={loading}
              className="w-full bg-yellow-400 text-black rounded-2xl py-4 font-black hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no sistema'}
            </button>
          </form>

          <div className="mt-8 bg-zinc-950 border border-zinc-800 rounded-3xl p-5">
            <p className="text-yellow-400 font-black mb-3">
              Acessos cadastrados
            </p>

            <div className="text-sm text-zinc-400 space-y-3">
              {users.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between gap-3 border-b border-zinc-800 last:border-b-0 pb-3 last:pb-0"
                >
                  <div>
                    <p className="text-white font-black">
                      {user.name}
                    </p>

                    <p className="text-zinc-500">
                      Usuário: {user.username}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      user.role === 'DELIVERY'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-400/20 text-yellow-400'
                    }`}
                  >
                    {user.roleLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
