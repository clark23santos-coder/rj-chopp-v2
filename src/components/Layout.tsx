import Sidebar from './Sidebar';

export default function Layout({ children }: any) {
  return (
    <main className="bg-zinc-950 text-white min-h-[100dvh] w-full">
      <Sidebar />

      <section className="w-full min-h-[100dvh] p-4 pt-24 md:pt-8 md:p-8 md:pl-28">
        {children}
      </section>
    </main>
  );
}