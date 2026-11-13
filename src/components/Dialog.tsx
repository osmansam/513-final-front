import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Dialog({ title, description, children, onClose }: {
  title: string; description?: string; children: ReactNode; onClose: () => void
}) {
  const id = useId()
  const panel = useRef<HTMLElement | null>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const element = panel.current!
    const focusable = () => Array.from(element.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ))
    const initial = element.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0] ?? element
    initial.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); return }
      if (event.key !== 'Tab') return
      const options = focusable()
      const first = options[0]
      const last = options.at(-1)
      if (!first || !last) { event.preventDefault(); element.focus(); return }
      if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', keydown, true)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      if (previous?.isConnected && previous !== document.body && !previous.hasAttribute('disabled')) previous.focus()
      else document.querySelector<HTMLElement>('main h1')?.focus()
    }
  }, [])
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ocean-950/85 p-4 backdrop-blur-sm">
      <section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        className="my-auto w-full max-w-lg border border-gold/40 bg-ocean-900 p-6 text-parchment shadow-2xl outline-none sm:p-8">
        <h2 id={`${id}-title`} className="font-display text-3xl sm:text-4xl">{title}</h2>
        {description && <p id={`${id}-description`} className="mt-4 text-sm leading-7 text-parchment/75">{description}</p>}
        {children}
      </section>
    </div>, document.body,
  )
}
