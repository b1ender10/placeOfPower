type Size = 'sm' | 'md' | 'lg'

const sizeMap: Record<Size, number> = {
  sm: 36,
  md: 44,
  lg: 56,
}

/** Логотип «Место силы»: сходящиеся кольца и центр — место внимания */
export function AppLogo({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  const s = sizeMap[size]
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="logoRing" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="logoCore" x1="18" y1="18" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#logoRing)" strokeWidth="1.5" opacity={0.45} />
      <circle cx="24" cy="24" r="15" stroke="url(#logoRing)" strokeWidth="1.25" opacity={0.65} />
      <circle cx="24" cy="24" r="9" stroke="url(#logoRing)" strokeWidth="1" opacity={0.85} />
      <circle cx="24" cy="24" r="4.5" fill="url(#logoCore)" />
    </svg>
  )
}
