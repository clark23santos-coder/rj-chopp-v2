import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type LoginResponse = {
  token?: string;
  user?: any;
  message?: string;
};

function BeerIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 8V18C8 19.1046 8.89543 20 10 20H14C15.1046 20 16 19.1046 16 18V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 9H17C18.1046 9 19 9.89543 19 11V13C19 14.1046 18.1046 15 17 15H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8C7.11929 8 6 6.88071 6 5.5C6 4.11929 7.11929 3 8.5 3C9.31243 3 10.0343 3.38706 10.4917 3.98764C10.9456 3.38316 11.6672 3 12.5 3C13.3328 3 14.0544 3.38316 14.5083 3.98764C14.9657 3.38706 15.6876 3 16.5 3C17.8807 3 19 4.11929 19 5.5C19 6.88071 17.8807 8 16.5 8H8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20C5.73095 16.6158 8.52453 14.5 12 14.5C15.4755 14.5 18.2691 16.6158 19 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 11V8.5C7 5.73858 9.23858 3.5 12 3.5C14.7614 3.5 17 5.73858 17 8.5V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2 12C3.8 8.5 7.2 6 12 6C16.8 6 20.2 8.5 22 12C20.2 15.5 16.8 18 12 18C7.2 18 3.8 15.5 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.584 10.587C10.2103 10.9607 10 11.4675 10 12C10 13.1046 10.8954 14 12 14C12.5325 14 13.0393 13.7897 13.413 13.416"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.36395 5.36597C10.2087 5.12576 11.0835 5 12 5C16.8 5 20.2 7.5 22 11C21.4267 12.1145 20.6925 13.1095 19.811 13.953"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.23999 7.237C4.50404 8.2094 3.07374 9.46285 2 11C3.8 14.5 7.2 17 12 17C13.3747 17 14.6549 16.7952 15.8301 16.417"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3L19 6V11C19 15.4183 16.134 19.2845 12 20.5C7.866 19.2845 5 15.4183 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloudIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 18H17C19.2091 18 21 16.2091 21 14C21 11.9631 19.4763 10.282 17.5 10.0312C17.1504 7.16507 14.71 5 11.75 5C8.8235 5 6.40557 7.11636 6.02072 9.93427C3.7312 10.3374 2 12.3359 2 14.75C2 16.5449 3.45507 18 5.25 18H7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeadsetIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 13V12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="3" y="12" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="17" y="12" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 19C17 20.1046 16.1046 21 15 21H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [error, setError] = useState('');

  const particles = useMemo(() => {
    return Array.from({ length: 16 }).map((_, index) => ({
      id: index,
      left: `${8 + ((index * 19) % 84)}%`,
      top: `${8 + ((index * 23) % 84)}%`,
      delay: `${(index % 7) * 0.5}s`,
      duration: `${4 + (index % 5)}s`,
      size: `${2 + (index % 3)}px`,
      opacity: 0.15 + ((index % 4) * 0.08),
    }));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!login || !password) {
      setError('Preencha usuário e senha');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: login,
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Falha ao entrar');
      }

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }

      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('rjchopp_user', JSON.stringify(data.user));
      }

      if (remember) {
        localStorage.setItem('savedLogin', login);
      } else {
        localStorage.removeItem('savedLogin');
      }

      setShowIntro(true);

      setTimeout(() => {
        navigate('/');
      }, 1300);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] w-screen max-w-[100vw] overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 w-screen max-w-[100vw] overflow-hidden">
        <div className="absolute left-[-96px] top-[8%] h-[210px] w-[210px] rounded-full bg-yellow-500/10 blur-3xl sm:left-[-15%] sm:h-[360px] sm:w-[360px]" />
        <div className="absolute right-[-96px] top-[27%] h-[220px] w-[220px] rounded-full bg-amber-400/10 blur-3xl sm:right-[-10%] sm:h-[420px] sm:w-[420px]" />
        <div className="absolute bottom-[-80px] left-1/2 h-[220px] w-[220px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl sm:h-[340px] sm:w-[340px]" />

        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full bg-yellow-400/70 animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      <section className="relative z-10 flex h-[100dvh] w-screen max-w-[100vw] items-center justify-center overflow-hidden px-3 py-3 sm:min-h-[100dvh] sm:px-6 sm:py-8">
        <div className="h-full w-full max-w-[520px] overflow-y-auto overflow-x-hidden sm:h-auto sm:overflow-visible">
          <div className="relative mx-auto w-full max-w-full overflow-hidden rounded-[22px] border border-yellow-500/20 bg-black/75 p-3 shadow-[0_0_52px_rgba(234,179,8,0.14)] backdrop-blur-xl sm:rounded-[30px] sm:p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(234,179,8,0.10),transparent_30%)]" />

            <div className="relative z-10 min-w-0">
              <div className="mb-3 flex min-w-0 flex-col items-center text-center sm:mb-6">
                <div className="mb-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.15)] sm:mb-4 sm:h-20 sm:w-20">
                  <BeerIcon className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>

                <h1 className="w-full max-w-full break-words text-[22px] font-black leading-none tracking-[0.10em] text-white sm:text-[42px] sm:tracking-[0.22em]">
                  RJ CHOPP <span className="text-yellow-400">SGE</span>
                </h1>

                <div className="my-2 h-px w-16 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent sm:my-4 sm:w-24" />

                <h2 className="w-full max-w-full break-words text-[24px] font-bold leading-tight text-white sm:text-[46px]">
                  Acesse o <span className="text-yellow-400">sistema</span>
                </h2>

                <p className="mt-1 max-w-md text-xs text-zinc-300 sm:mt-3 sm:text-base">
                  Controle pedidos estoque e financeiro em um só lugar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-yellow-100 sm:mb-2">
                    Usuário
                  </label>

                  <div className="flex h-11 min-w-0 items-center rounded-2xl border border-yellow-500/25 bg-black/50 px-3 transition focus-within:border-yellow-400 focus-within:shadow-[0_0_25px_rgba(250,204,21,0.10)] sm:h-14 sm:px-4">
                    <div className="mr-2 shrink-0 text-yellow-400 sm:mr-3">
                      <UserIcon />
                    </div>

                    <input
                      type="text"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Digite seu usuário"
                      className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-yellow-100 sm:mb-2">
                    Senha
                  </label>

                  <div className="flex h-11 min-w-0 items-center rounded-2xl border border-yellow-500/25 bg-black/50 px-3 transition focus-within:border-yellow-400 focus-within:shadow-[0_0_25px_rgba(250,204,21,0.10)] sm:h-14 sm:px-4">
                    <div className="mr-2 shrink-0 text-yellow-400 sm:mr-3">
                      <LockIcon />
                    </div>

                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="ml-2 shrink-0 text-zinc-300 transition hover:text-yellow-400"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-1">
                  <label className="flex min-w-0 items-center gap-2 text-xs text-zinc-200 sm:gap-3 sm:text-sm">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border border-yellow-500/30 bg-black accent-yellow-400 sm:h-5 sm:w-5"
                    />
                    <span className="min-w-0 leading-tight">
                      Salvar login neste computador
                    </span>
                  </label>

                  <button
                    type="button"
                    className="text-left text-xs font-semibold text-yellow-400 transition hover:text-yellow-300 sm:text-right sm:text-sm"
                  >
                    Primeiro acesso
                  </button>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300 sm:py-3 sm:text-sm">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-300 text-base font-black text-black shadow-[0_12px_30px_rgba(250,204,21,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-2 sm:h-14 sm:text-lg"
                >
                  {loading ? 'Entrando...' : 'Entrar no sistema'}
                </button>

                <div className="flex items-center justify-between gap-4 pt-0 text-xs sm:pt-1 sm:text-sm">
                  <button
                    type="button"
                    className="font-medium text-yellow-300 transition hover:text-yellow-200"
                  >
                    Esqueci minha senha
                  </button>

                  <button
                    type="button"
                    className="font-medium text-yellow-300 transition hover:text-yellow-200"
                  >
                    Primeiro acesso
                  </button>
                </div>
              </form>

              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-yellow-500/15 pt-3 sm:mt-6 sm:grid-cols-3 sm:gap-3 sm:pt-5">
                <div className="rounded-2xl border border-yellow-500/12 bg-black/35 p-2.5 sm:p-3">
                  <div className="mb-1 text-yellow-400 sm:mb-2">
                    <ShieldIcon />
                  </div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">Seguro e confiável</h3>
                  <p className="mt-0.5 text-xs text-zinc-400 sm:mt-1 sm:text-sm">
                    Seus dados protegidos com segurança
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-500/12 bg-black/35 p-2.5 sm:p-3">
                  <div className="mb-1 text-yellow-400 sm:mb-2">
                    <CloudIcon />
                  </div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">Backup diário</h3>
                  <p className="mt-0.5 text-xs text-zinc-400 sm:mt-1 sm:text-sm">
                    Suas informações sempre protegidas
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-500/12 bg-black/35 p-2.5 sm:p-3">
                  <div className="mb-1 text-yellow-400 sm:mb-2">
                    <HeadsetIcon />
                  </div>
                  <h3 className="text-sm font-semibold text-white sm:text-base">Suporte dedicado</h3>
                  <p className="mt-0.5 text-xs text-zinc-400 sm:mt-1 sm:text-sm">
                    Conte com nosso time sempre que precisar
                  </p>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-zinc-400 sm:mt-6 sm:text-sm">
                © 2024 RJ Chopp SGE. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showIntro ? (
        <div className="fixed inset-0 z-[100] w-screen max-w-[100vw] overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.16),transparent_35%)]" />
          <div className="relative flex min-h-[100dvh] w-screen max-w-[100vw] items-center justify-center overflow-hidden px-4 text-center">
            <div className="w-full max-w-[320px] min-w-0 sm:max-w-xl">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.18)] sm:mb-5 sm:h-24 sm:w-24">
                <BeerIcon className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>

              <h2 className="w-full break-words text-[25px] font-black leading-tight tracking-[0.10em] text-white sm:text-[54px] sm:tracking-[0.18em]">
                RJ CHOPP <span className="text-yellow-400">SGE</span>
              </h2>

              <div className="mx-auto my-4 h-px w-28 bg-gradient-to-r from-transparent via-yellow-400 to-transparent sm:my-5 sm:w-40" />

              <p className="text-sm uppercase tracking-[0.18em] text-yellow-100/90 sm:text-xl sm:tracking-[0.38em]">
                Entrando no sistema
              </p>

              <div className="mx-auto mt-5 h-2 w-full max-w-[240px] overflow-hidden rounded-full bg-zinc-800 sm:mt-6 sm:max-w-sm">
                <div className="h-full w-full animate-[loadingBar_1.2s_ease-in-out] rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300" />
              </div>
            </div>
          </div>

          <style>{`
            @keyframes loadingBar {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(0%); }
            }
          `}</style>
        </div>
      ) : null}
    </main>
  );
}
