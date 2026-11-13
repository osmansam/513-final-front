export function CompassRose({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} fill="none" aria-hidden="true" focusable="false">
      <circle cx="160" cy="160" r="133" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      <circle cx="160" cy="160" r="118" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 8" opacity="0.5" />
      <circle cx="160" cy="160" r="90" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <path d="M160 14V306M14 160H306M56 56L264 264M56 264L264 56" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
      <path d="M160 48L182 138L272 160L182 182L160 272L138 182L48 160L138 138Z" fill="currentColor" opacity="0.12" />
      <path d="M160 48L160 160L138 138ZM272 160L160 160L182 138ZM160 272L160 160L182 182ZM48 160L160 160L138 182Z" fill="currentColor" opacity="0.7" />
      <path d="M160 48L182 138L272 160L182 182L160 272L138 182L48 160L138 138Z" stroke="currentColor" strokeWidth="1" />
      <path d="M91 91L160 135L229 91L185 160L229 229L160 185L91 229L135 160Z" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
      <circle cx="160" cy="160" r="9" fill="#091e28" stroke="currentColor" />
      <circle cx="160" cy="160" r="3" fill="currentColor" />
      <g fill="currentColor" fontFamily="Georgia, serif" fontSize="12" textAnchor="middle">
        <text x="160" y="10">N</text><text x="313" y="164">E</text>
        <text x="160" y="319">S</text><text x="7" y="164">W</text>
      </g>
    </svg>
  )
}
