export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-white/10 rounded-lg w-2/3 mb-3" />
      <div className="h-8 bg-white/8 rounded-lg w-1/2 mb-2" />
      <div className="h-3 bg-white/6 rounded-lg w-3/4" />
    </div>
  )
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 py-4 border-b border-white/5 animate-pulse ${className}`}>
      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-2.5 bg-white/6 rounded w-1/2" />
      </div>
      <div className="h-4 bg-white/8 rounded w-16" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 bg-white/3">
        <div className="h-3 bg-white/10 rounded w-32 animate-pulse" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-2 border-forest-600 border-t-forest-400 rounded-full animate-spin" />
      <p className="text-cream/30 text-sm">Loading...</p>
    </div>
  )
}
