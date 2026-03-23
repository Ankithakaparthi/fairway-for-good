import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href?: string; onClick?: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center mb-4">
        <Icon size={28} className="text-cream/20" />
      </div>
      <h3 className="font-display text-lg font-bold text-cream/60 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-cream/30 max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {action && (
        action.href ? (
          <a href={action.href} className="btn-primary text-sm py-2 px-5">{action.label}</a>
        ) : (
          <button onClick={action.onClick} className="btn-primary text-sm py-2 px-5">{action.label}</button>
        )
      )}
    </div>
  )
}
