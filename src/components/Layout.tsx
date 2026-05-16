import Sidebar from './Sidebar';

export default function Layout({ children }: any) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex">
      <Sidebar />

      <div className="flex-1 p-6 md:p-10">
        {children}
      </div>
    </main>
  );
}