export default function PageHeader({
  title,
  description,
}: any) {
  return (
    <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-yellow-500/20 bg-black/45 p-6 shadow-[0_0_45px_rgba(245,158,11,.08)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent" />

      <div className="relative">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-yellow-400/80">
          RJ Chopp SGE
        </p>

        <h1 className="text-4xl md:text-5xl font-black text-white">
          {title}
        </h1>

        {description && (
          <p className="text-zinc-400 mt-3 max-w-3xl font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}