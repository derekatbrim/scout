'use client'

interface HiringBadgeProps {
  status: 'hiring' | 'open' | 'closed' | 'unknown'
}

export function HiringBadge({ status }: HiringBadgeProps) {
  if (status === 'unknown' || status === 'closed') return null

  const config = {
    hiring: {
      label: 'Hiring',
      gradient: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    open: {
      label: 'Open',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    }
  }

  const { label, gradient, icon } = config[status]

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1"
      style={{
        background: gradient,
        borderRadius: '6px',
        color: '#FFFFFF',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'var(--font-libre), sans-serif',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
