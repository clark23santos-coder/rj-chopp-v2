import {
  Boxes,
  TrendingDown,
  TrendingUp,
  Package,
} from 'lucide-react';

function getIcon(title: string) {
  const text = String(title || '').toLowerCase();

  if (text.includes('entrada')) return TrendingUp;
  if (text.includes('saída') || text.includes('saida') || text.includes('despesa')) return TrendingDown;
  if (text.includes('estoque') || text.includes('baixo')) return Boxes;

  return Package;
}

function getTone(title: string) {
  const text = String(title || '').toLowerCase();

  if (
    text.includes('saída') ||
    text.includes('saida') ||
    text.includes('despesa') ||
    text.includes('baixo') ||
    text.includes('atrasado')
  ) {
    return 'red';
  }

  if (
    text.includes('entrada') ||
    text.includes('lucro') ||
    text.includes('receita')
  ) {
    return 'green';
  }

  return 'yellow';
}

export default function Card({ title, value }: any) {
  const Icon = getIcon(title);
  const tone = getTone(title);

  const toneClass =
    tone === 'red'
      ? 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/25'
      : tone === 'green'
        ? 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/25'
        : 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/25';

  return (
    <div className="group relative min-h-[145px] overflow-hidden rounded-[2rem] border border-yellow-500/15 bg-black/52 p-5 shadow-[0_0_35px_rgba(245,158,11,.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-yellow-400/35 hover:shadow-[0_0_50px_rgba(245,158,11,.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,.14),transparent_36%),linear-gradient(135deg,rgba(255,255,255,.06),transparent_38%,rgba(250,204,21,.04))]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <h2 className="max-w-[75%] text-sm font-black text-zinc-300 md:text-base">
            {title}
          </h2>

          <div className={`rounded-2xl border bg-gradient-to-br p-3 ${toneClass}`}>
            <Icon size={22} />
          </div>
        </div>

        <p className="mt-6 break-words text-3xl font-black leading-none text-white md:text-4xl">
          {value}
        </p>
      </div>
    </div>
  );
}