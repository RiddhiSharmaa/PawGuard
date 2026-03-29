interface PriorityBadgeProps {
  priority: 'urgent' | 'medium' | 'low'
  size?: 'sm' | 'lg'
}

const config = {
  urgent: { label: 'URGENT', bg: 'bg-red-100', text: 'text-red-700' },
  medium: { label: 'MEDIUM', bg: 'bg-amber-100', text: 'text-amber-700' },
  low: { label: 'LOW', bg: 'bg-green-100', text: 'text-green-700' }
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const { label, bg, text } = config[priority]

  return (
    <span
      className={`
        ${bg} ${text} rounded-full font-semibold uppercase tracking-wide
        ${size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-4 py-2 text-sm'}
      `}
    >
      {label}
    </span>
  )
}
