import Sidebar from './Sidebar';

export default function Layout({ children }: any) {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,.12),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(245,158,11,.10),transparent_25%),linear-gradient(135deg,#050505_0%,#090909_45%,#120d04_100%)]" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.35)_62%,rgba(0,0,0,.85)_100%)]" />

      <div className="pointer-events-none fixed left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

      <Sidebar />

      <section className="relative z-10 w-full min-h-[100dvh] p-4 pt-24 md:pt-8 md:p-8 md:pl-28 lg:pl-80">
        <div className="mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </section>
    </main>
  );
}