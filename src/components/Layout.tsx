import Sidebar from './Sidebar';

export default function Layout({ children }: any) {
  return (
    <main className="h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar />

      <section className="ml-72 h-screen overflow-y-auto p-6 md:p-10">
        {children}
      </section>
    </main>
  );
}