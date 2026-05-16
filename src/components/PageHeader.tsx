export default function PageHeader({
  title,
  description,
}: any) {
  return (
    <div className="mb-10">
      <h1 className="text-4xl md:text-5xl font-black text-yellow-400">
        {title}
      </h1>

      <p className="text-zinc-500 mt-2">
        {description}
      </p>
    </div>
  );
}