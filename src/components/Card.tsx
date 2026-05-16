export default function Card({ title, value }: any) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <h2 className="text-zinc-400">{title}</h2>

      <p className="text-4xl md:text-5xl font-black mt-5">
        {value}
      </p>
    </div>
  );
}