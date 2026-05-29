import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Beer,
  Cloud,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';


const fieldClass =
  'group flex h-[66px] min-w-0 items-center rounded-2xl border border-yellow-500/25 bg-black/45 px-5 transition duration-300 focus-within:border-yellow-400 focus-within:bg-black/60 focus-within:shadow-[0_0_30px_rgba(250,204,21,.16)]';

const featureClass =
  'group relative overflow-hidden rounded-2xl border border-yellow-500/15 bg-black/30 p-4 text-left shadow-[0_0_24px_rgba(250,204,21,.05)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-yellow-400/35 hover:shadow-[0_0_34px_rgba(250,204,21,.13)]';

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

    if (saved) {
      const parsed = JSON.parse(saved);

      return parsed.username || localStorage.getItem('savedLogin') || '';
    }

    return getSavedLogin();
  } catch {
    return '';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [login, setLogin] = useState(() => {
    try {
      return localStorage.getItem('savedLogin') || '';
    } catch {
      return '';
    }
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [error, setError] = useState('');

  const particles = useMemo(() => {
    return Array.from({ length: 62 }).map((_, index) => ({
      id: index,
      left: `${3 + ((index * 13) % 94)}%`,
      top: `${3 + ((index * 19) % 94)}%`,
      delay: `${(index % 11) * 0.37}s`,
      duration: `${4.2 + (index % 7) * 0.7}s`,
      size: `${1.8 + (index % 4) * 0.8}px`,
      opacity: 0.13 + ((index % 6) * 0.055),
    }));
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const normalizedLogin = login.trim().toLowerCase();

    if (!normalizedLogin || !password.trim()) {
      setError('Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    setError('');

    const user = users.find((item) => {
      return (
        item.username.toLowerCase() === normalizedLogin &&
        item.password === password
      );
    });

    if (!user) {
      setLoading(false);
      setError('Usuário ou senha inválidos.');
      return;
    }

    const userToSave = {
      id: user.username,
      name: user.name,
      email: user.username,
      username: user.username,
      role: user.role,
      roleLabel: user.roleLabel,
      loggedAt: new Date().toISOString(),
    };

    localStorage.setItem('rjchopp_user', JSON.stringify(userToSave));
    localStorage.setItem('user', JSON.stringify(userToSave));
    localStorage.setItem('token', `local-token-${user.username}-${Date.now()}`);

    if (remember) {
      localStorage.setItem('savedLogin', user.username);
      localStorage.setItem(
        REMEMBER_LOGIN_KEY,
        JSON.stringify({
          username: user.username,
        })
      );
    } else {
      localStorage.removeItem('savedLogin');
      localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }

    setShowIntro(true);

    window.setTimeout(() => {
      window.location.href = getHomeByRole(user.role);
    }, 1250);
  }

  return (
    <main className="login-page relative min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden overflow-y-auto bg-black text-white">
      <div className="pointer-events-none fixed inset-0 max-w-[100vw] overflow-hidden">
        <img
          src="/login-bg-clean.png"
          alt=""
          className="absolute inset-0 h-full w-full scale-[1.08] object-cover object-center animate-[backgroundFloat_18s_ease-in-out_infinite_alternate]"
          draggable={false}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.58),rgba(0,0,0,.12)_45%,rgba(0,0,0,.62)),radial-gradient(circle_at_top,rgba(250,204,21,.20),transparent_39%)]" />
        <div className="absolute inset-0 animate-[goldBreath_7s_ease-in-out_infinite] bg-[radial-gradient(circle_at_50%_0%,rgba(255,220,80,.24),transparent_30%),radial-gradient(circle_at_13%_74%,rgba(250,204,21,.11),transparent_24%),radial-gradient(circle_at_88%_50%,rgba(250,204,21,.12),transparent_28%)]" />
        <div className="absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-gradient-to-r from-transparent via-yellow-200/10 to-transparent blur-sm animate-[screenShine_9s_ease-in-out_infinite]" />
        <div className="absolute left-[-7rem] top-[7%] h-[26rem] w-[26rem] rounded-full bg-yellow-500/10 blur-3xl animate-[softPulse_5s_ease-in-out_infinite]" />
        <div className="absolute right-[-8rem] top-[18%] h-[28rem] w-[28rem] rounded-full bg-yellow-500/10 blur-3xl animate-[softPulse_6.5s_ease-in-out_infinite]" />

        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full bg-yellow-300"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              boxShadow: '0 0 12px rgba(250,204,21,.55)',
              animation: `loginDust ${particle.duration} ease-in-out ${particle.delay} infinite alternate`,
            }}
          />
        ))}
      </div>

      <section className="relative z-10 flex min-h-[100dvh] w-full max-w-[100vw] items-start justify-center overflow-x-hidden px-3 py-0 sm:px-5 md:px-8">
        <div className="w-full max-w-[900px] min-w-0">
          <div className="login-card relative mx-auto w-full max-w-full overflow-hidden rounded-[2.1rem] border border-yellow-500/25 bg-black/48 px-5 pb-7 pt-8 shadow-[0_0_80px_rgba(250,204,21,.14)] backdrop-blur-[6px] sm:px-9 md:px-16 md:pb-10 md:pt-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.23),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.055),transparent_40%,rgba(250,204,21,.048))]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/75 to-transparent" />
            <div className="pointer-events-none absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent" />
            <div className="pointer-events-none absolute inset-y-8 right-0 w-px bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent" />
            <div className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-yellow-200/8 to-transparent animate-[cardShine_6s_ease-in-out_infinite]" />

            <div className="relative">
              <div className="mb-7 flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_36px_rgba(250,204,21,.14)]">
                  <span className="absolute inset-0 rounded-full border border-yellow-400/25 animate-[ringPulse_2.6s_ease-in-out_infinite]" />
                  <span className="absolute inset-[-10px] rounded-full border border-yellow-400/10 animate-[ringPulse_3.2s_ease-in-out_infinite]" />
                  <Beer size={38} className="relative z-10 drop-shadow-[0_0_10px_rgba(250,204,21,.35)]" />
                </div>

                <h1 className="max-w-full break-words text-[2rem] font-black leading-none tracking-[0.30em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,.12)] sm:text-[2.35rem] md:text-[2.55rem]">
                  RJ CHOPP <span className="text-yellow-400 drop-shadow-[0_0_18px_rgba(250,204,21,.34)]">SGE</span>
                </h1>

                <div className="my-5 h-px w-44 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent shadow-[0_0_18px_rgba(250,204,21,.45)]" />

                <h2 className="max-w-full break-words text-[2.05rem] font-black leading-tight text-white sm:text-[2.45rem] md:text-[2.65rem]">
                  Acesse o <span className="text-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,.26)]">sistema</span>
                </h2>

                <p className="mt-3 text-sm font-semibold text-zinc-300 sm:text-base md:text-lg">
                  Controle pedidos, estoque e financeiro em um só lugar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[760px]">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-black text-yellow-100">
                      Usuário
                    </label>

                    <div className={fieldClass}>
                      <User className="mr-4 shrink-0 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,.35)]" size={22} />

                      <input
                        type="text"
                        value={login}
                        onChange={(event) => setLogin(event.target.value)}
                        placeholder="Digite seu usuário"
                        autoComplete="username"
                        className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500 sm:text-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-yellow-100">
                      Senha
                    </label>

                    <div className={fieldClass}>
                      <Lock className="mr-4 shrink-0 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,.35)]" size={22} />

                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500 sm:text-lg"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="ml-3 shrink-0 text-zinc-300 transition hover:text-yellow-400"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-3">
                    <label className="flex min-w-0 items-center gap-3 text-sm font-semibold text-zinc-200 sm:text-base">
                      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded border border-yellow-500/35 bg-black/50">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(event) => setRemember(event.target.checked)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />

                        {remember && (
                          <span className="h-5 w-5 rounded bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,.35)]">
                            <svg viewBox="0 0 20 20" fill="none">
                              <path
                                d="M5 10.3L8.3 13.5L15 6.5"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                      </span>

                      <span className="leading-tight">
                        Salvar login neste computador
                      </span>
                    </label>

                    <button
                      type="button"
                      className="shrink-0 text-right text-sm font-black text-yellow-400 transition hover:text-yellow-300 sm:text-base"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative flex h-[68px] w-full overflow-hidden items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-500 text-lg font-black text-black shadow-[0_14px_34px_rgba(250,204,21,.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 sm:text-xl"
                  >
                    <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-[buttonShine_3.6s_ease-in-out_infinite]" />
                    <ArrowRight size={25} className="relative z-10" />
                    <span className="relative z-10">
                      {loading ? 'Entrando...' : 'Entrar no sistema'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between gap-4 border-b border-yellow-500/15 pb-6 text-sm sm:text-base">
                    <button
                      type="button"
                      className="font-black text-yellow-400 transition hover:text-yellow-300"
                    >
                      Esqueci minha senha
                    </button>

                    <button
                      type="button"
                      className="font-black text-yellow-400 transition hover:text-yellow-300"
                    >
                      Primeiro acesso
                    </button>
                  </div>
                </div>
              </form>

              <div className="mx-auto mt-6 grid w-full max-w-[760px] grid-cols-3 gap-3">
                <div className={featureClass}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,.10),transparent_45%)] opacity-0 transition group-hover:opacity-100" />
                  <ShieldCheck className="relative mb-2 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,.35)]" size={22} />
                  <h3 className="relative text-sm font-black text-white sm:text-base">
                    Seguro e confiável
                  </h3>
                  <p className="relative mt-1 text-xs text-zinc-400 sm:text-sm">
                    Seus dados protegidos com segurança
                  </p>
                </div>

                <div className={featureClass}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,.10),transparent_45%)] opacity-0 transition group-hover:opacity-100" />
                  <Cloud className="relative mb-2 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,.35)]" size={22} />
                  <h3 className="relative text-sm font-black text-white sm:text-base">
                    Backup diário
                  </h3>
                  <p className="relative mt-1 text-xs text-zinc-400 sm:text-sm">
                    Suas informações sempre protegidas
                  </p>
                </div>

                <div className={featureClass}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,.10),transparent_45%)] opacity-0 transition group-hover:opacity-100" />
                  <Headphones className="relative mb-2 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,.35)]" size={22} />
                  <h3 className="relative text-sm font-black text-white sm:text-base">
                    Suporte dedicado
                  </h3>
                  <p className="relative mt-1 text-xs text-zinc-400 sm:text-sm">
                    Conte com nosso time sempre que precisar
                  </p>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-zinc-400 sm:text-base">
                © 2024 RJ Chopp SGE. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showIntro && (
        <div className="fixed inset-0 z-[100] w-full max-w-[100vw] overflow-hidden bg-black">
          <img
            src="/login-bg-clean.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
            draggable={false}
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,.22),transparent_36%),linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.55),rgba(0,0,0,.82))]" />

          <div className="relative flex min-h-[100dvh] w-full max-w-[100vw] items-center justify-center overflow-hidden px-5 text-center">
            <div className="w-full max-w-[520px] animate-[introZoom_1.25s_ease-in-out]">
              <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_50px_rgba(250,204,21,.18)] sm:h-24 sm:w-24">
                <span className="absolute inset-0 rounded-full border border-yellow-400/25 animate-[ringPulse_2.4s_ease-in-out_infinite]" />
                <Beer size={42} />
              </div>

              <h2 className="max-w-full break-words text-[2rem] font-black leading-tight tracking-[0.14em] text-white sm:text-[3.4rem] sm:tracking-[0.18em]">
                RJ CHOPP <span className="text-yellow-400">SGE</span>
              </h2>

              <div className="mx-auto my-5 h-px w-36 bg-gradient-to-r from-transparent via-yellow-400 to-transparent sm:w-44" />

              <p className="text-sm uppercase tracking-[0.25em] text-yellow-100/90 sm:text-xl sm:tracking-[0.38em]">
                Entrando no sistema
              </p>

              <div className="mx-auto mt-6 h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-zinc-800 sm:max-w-sm">
                <div className="h-full w-full animate-[loadingBar_1.2s_ease-in-out] rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes backgroundFloat {
          0% { transform: scale(1.08) translate3d(-10px, -6px, 0); filter: brightness(.95) saturate(1); }
          50% { transform: scale(1.12) translate3d(12px, 8px, 0); filter: brightness(1.08) saturate(1.08); }
          100% { transform: scale(1.08) translate3d(-6px, 10px, 0); filter: brightness(.98) saturate(1.03); }
        }

        @keyframes goldBreath {
          0%, 100% { opacity: .72; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }

        @keyframes screenShine {
          0%, 58% { transform: translateX(-140%) rotate(12deg); opacity: 0; }
          70% { opacity: 1; }
          100% { transform: translateX(430%) rotate(12deg); opacity: 0; }
        }

        @keyframes loginDust {
          0% { transform: translate3d(0, 0, 0) scale(1); filter: blur(0px); }
          100% { transform: translate3d(12px, -18px, 0) scale(1.35); filter: blur(.2px); }
        }

        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: .85; }
          50% { transform: scale(1.26); opacity: .18; }
        }

        @keyframes softPulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: .95; transform: scale(1.08); }
        }

        @keyframes cardShine {
          0%, 60% { transform: translateX(-120%) rotate(12deg); opacity: 0; }
          72% { opacity: 1; }
          100% { transform: translateX(330%) rotate(12deg); opacity: 0; }
        }

        @keyframes buttonShine {
          0%, 55% { transform: translateX(-140%); opacity: 0; }
          68% { opacity: 1; }
          100% { transform: translateX(460%); opacity: 0; }
        }

        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }

        @keyframes introZoom {
          0% { opacity: 0; transform: scale(.92) translateY(14px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 640px) {
          html,
          body,
          #root {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            overscroll-behavior-x: none;
          }

          .login-page {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
            overscroll-behavior-x: none;
            touch-action: pan-y;
          }

          .login-page * {
            min-width: 0;
          }

          .login-page > div,
          .login-page section {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
          }

          .login-page section {
            align-items: flex-start;
            padding-left: 10px;
            padding-right: 10px;
          }

          .login-page section > div,
          .login-page .login-card,
          .login-page form {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .login-page h1 {
            font-size: 1.45rem;
            letter-spacing: .14em;
          }

          .login-page h2 {
            font-size: 1.75rem;
          }

          .login-page .grid-cols-3 {
            grid-template-columns: 1fr;
          }

          .login-page .grid-cols-3 p {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
