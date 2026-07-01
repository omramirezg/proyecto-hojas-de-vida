export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border bg-card" />
    </div>
  );
}
