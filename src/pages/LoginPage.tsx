import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Beer,
  CheckCircle,
  Cloud,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  LogIn,
  ShieldCheck,
  User,
} from 'lucide-react';

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
  if (role === 'DELIVERY') return '/retiradas';
  if (role === 'FINANCE') return '/financeiro';

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

const inputClass =
  'w-full h-[54px] bg-black/50 border border-yellow-500/30 rounded-xl pl-12 pr-12 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-300 focus:bg-black/75 focus:shadow-[0_0_32px_rgba(250,204,21,0.20)]';

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

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

    setShowIntro(true);

    window.setTimeout(() => {
      setLoading(false);
      navigate(getHomeByRole(user.role));
    }, 1700);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <style>
        {`
          @keyframes bgMove {
            0%, 100% {
              transform: scale(1.015) translateX(0);
              filter: brightness(.88) saturate(1.1);
            }
            50% {
              transform: scale(1.04) translateX(-6px);
              filter: brightness(1) saturate(1.18);
            }
          }

          @keyframes cardEnter {
            from {
              opacity: 0;
              transform: translateY(28px) scale(.97);
              filter: blur(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes logoIntro {
            0% {
              opacity: 0;
              transform: translateY(22px) scale(.86);
              filter: blur(12px);
            }
            45% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes introGlow {
            0% {
              opacity: 0;
              transform: scale(.65);
            }
            45% {
              opacity: .95;
              transform: scale(1);
            }
            100% {
              opacity: .35;
              transform: scale(1.4);
            }
          }

          @keyframes introLine {
            from {
              width: 0;
              opacity: 0;
            }
            to {
              width: 260px;
              opacity: 1;
            }
          }

          @keyframes goldShine {
            0% {
              transform: translateX(-130%) skewX(-18deg);
            }
            100% {
              transform: translateX(230%) skewX(-18deg);
            }
          }

          @keyframes particleFloat {
            0% {
              transform: translateY(40px) translateX(0);
              opacity: 0;
            }
            20% {
              opacity: .7;
            }
            100% {
              transform: translateY(-110vh) translateX(28px);
              opacity: 0;
            }
          }

          @keyframes cardGlow {
            0%, 100% {
              box-shadow:
                0 0 55px rgba(245, 158, 11, .24),
                inset 0 0 36px rgba(245, 158, 11, .08);
            }
            50% {
              box-shadow:
                0 0 95px rgba(245, 158, 11, .40),
                inset 0 0 54px rgba(245, 158, 11, .12);
            }
          }

          @keyframes topLight {
            0%, 100% {
              opacity: .45;
              transform: translateX(-18%);
            }
            50% {
              opacity: .9;
              transform: translateX(18%);
            }
          }

          .background-photo {
            animation: bgMove 22s ease-in-out infinite;
          }

          .login-card {
            animation: cardEnter .85s ease-out both;
          }

          .card-glow {
            animation: cardGlow 5s ease-in-out infinite;
          }

          .gold-button::before {
            content: "";
            position: absolute;
            inset: 0;
            width: 35%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
            animation: goldShine 4.2s ease-in-out infinite;
          }

          .gold-particle {
            position: absolute;
            bottom: -40px;
            width: 3px;
            height: 3px;
            border-radius: 999px;
            background: rgba(250,204,21,.78);
            box-shadow: 0 0 14px rgba(250,204,21,.85);
            animation: particleFloat linear infinite;
          }

          .top-light {
            animation: topLight 8s ease-in-out infinite;
          }

          .intro-logo {
            animation: logoIntro 1.25s ease-out both;
          }

          .intro-glow {
            animation: introGlow 1.6s ease-out both;
          }

          .intro-line {
            animation: introLine .9s ease-out .45s both;
          }

          @media (max-width: 900px) {
            .background-photo {
              animation: none;
            }

            .desktop-particles {
              display: none;
            }
          }
        `}
      </style>

      <div
        className="background-photo absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/login-bg-clean.png')",
        }}
      />

      <div className="absolute inset-0 bg-black/18" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,.03),rgba(0,0,0,.42)_72%,rgba(0,0,0,.78)_100%),linear-gradient(90deg,rgba(0,0,0,.38),rgba(0,0,0,.04)_45%,rgba(0,0,0,.38))]" />

      <div className="top-light pointer-events-none absolute left-1/2 top-0 h-52 w-[46rem] -translate-x-1/2 rounded-full bg-yellow-400/22 blur-3xl" />

      <div className="desktop-particles pointer-events-none absolute inset-0">
        {Array.from({ length: 40 }).map((_, index) => (
          <span
            key={index}
            className="gold-particle"
            style={{
              left: `${(index * 31) % 100}%`,
              animationDuration: `${8 + (index % 7)}s`,
              animationDelay: `${index * 0.38}s`,
              opacity: 0.18 + (index % 5) * 0.12,
            }}
          />
        ))}
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-all duration-700 ${
          showIntro ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 blur-sm"
          style={{
            backgroundImage: "url('/login-bg-clean.png')",
          }}
        />

        <div className="absolute inset-0 bg-black/70" />

        <div className="intro-glow absolute h-72 w-72 rounded-full bg-yellow-400/20 blur-3xl" />

        <div className="intro-logo relative text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-yellow-400/50 bg-yellow-400/10 text-yellow-400 shadow-[0_0_55px_rgba(250,204,21,.35)]">
            <Beer size={52} />
          </div>

          <h1 className="text-4xl font-black tracking-[0.24em] text-white sm:text-6xl">
            RJ CHOPP <span className="text-yellow-400">SGE</span>
          </h1>

          <div className="intro-line mx-auto mt-6 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

          <p className="mt-6 text-sm font-semibold tracking-[0.35em] text-yellow-100/80">
            ENTRANDO NO SISTEMA
          </p>
        </div>
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="login-card w-full max-w-[720px]">
          <div className="card-glow relative overflow-hidden rounded-[2rem] border border-yellow-500/50 bg-black/58 px-7 py-8 shadow-2xl backdrop-blur-[10px] sm:px-12 sm:py-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.09),transparent_38%,rgba(250,204,21,.06))]" />

            <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-300/90 to-transparent" />

            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-500/45 to-transparent" />

            <div className="relative">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-yellow-500/55 bg-yellow-500/10 text-yellow-400 shadow-[0_0_38px_rgba(250,204,21,.28)]">
                  <Beer size={42} />
                </div>

                <h1 className="text-3xl font-black tracking-[0.20em] sm:text-4xl">
                  RJ CHOPP <span className="text-yellow-400">SGE</span>
                </h1>

                <div className="mx-auto my-4 h-px w-28 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

                <h2 className="text-3xl font-semibold tracking-wide sm:text-4xl">
                  Acesse o <span className="text-yellow-400">sistema</span>
                </h2>

                <p className="mt-3 text-sm font-medium text-zinc-300 sm:text-base">
                  Controle pedidos, estoque e financeiro em um só lugar.
                </p>
              </div>

              <form onSubmit={login} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-yellow-200">
                    Usuário
                  </label>

                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
                      size={20}
                    />

                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Digite seu usuário"
                      autoComplete="username"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-yellow-200">
                    Senha
                  </label>

                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400"
                      size={20}
                    />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 transition hover:text-yellow-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-zinc-200">
                    <input
                      type="checkbox"
                      checked={rememberLogin}
                      onChange={(event) => setRememberLogin(event.target.checked)}
                      className="hidden"
                    />

                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                        rememberLogin
                          ? 'border-yellow-400 bg-yellow-400 text-black'
                          : 'border-yellow-500/40 bg-black/40 text-transparent'
                      }`}
                    >
                      <CheckCircle size={15} />
                    </span>

                    Salvar login neste computador
                  </label>

                  <button
                    type="button"
                    className="text-left text-sm font-black text-yellow-400 underline-offset-4 transition hover:text-yellow-300 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <button
                  disabled={loading}
                  className="gold-button relative mt-2 flex h-[58px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 px-6 text-base font-black text-black shadow-[0_0_38px_rgba(250,204,21,.42)] transition hover:scale-[1.01] hover:shadow-[0_0_60px_rgba(250,204,21,.56)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn size={22} />
                  {loading ? 'Entrando...' : 'Entrar no sistema'}
                </button>
              </form>

              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-yellow-500/15 pt-5 text-xs text-zinc-300 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-yellow-400" size={20} />
                  <div>
                    <p className="font-black text-white">Seguro e confiável</p>
                    <p>Seus dados protegidos com segurança.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Cloud className="mt-0.5 text-yellow-400" size={20} />
                  <div>
                    <p className="font-black text-white">Backup diário</p>
                    <p>Suas informações sempre protegidas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Headphones className="mt-0.5 text-yellow-400" size={20} />
                  <div>
                    <p className="font-black text-white">Suporte dedicado</p>
                    <p>Conte com nosso time sempre que precisar.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-zinc-300 drop-shadow">
            © 2024 RJ Chopp SGE. Todos os direitos reservados.
          </p>
        </div>
      </section>
    </main>
  );
}