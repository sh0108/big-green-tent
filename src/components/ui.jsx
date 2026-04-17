import { Link } from 'react-router-dom'

export function SectionHeading({ eyebrow, title, accent, body, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="display-title text-[clamp(2.6rem,6vw,5.4rem)] text-forest">{title}</h2>
      {accent ? <p className="accent-script mt-4 text-[clamp(1.7rem,3vw,2.6rem)] text-forest/88">{accent}</p> : null}
      {body ? <p className="body-copy mt-5 max-w-3xl">{body}</p> : null}
    </div>
  )
}

export function Surface({ children, className = '', strong = false, ...rest }) {
  return <section className={`${strong ? 'brand-card-strong' : 'brand-card'} ${className}`} {...rest}>{children}</section>
}

export function Button({ children, className = '', variant = 'primary', ...props }) {
  const variantClass =
    variant === 'secondary' ? 'brand-button-secondary' : variant === 'ghost' ? 'brand-button text-forest hover:bg-forest/6' : 'brand-button-primary'

  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'default' }) {
  const toneClass = {
    default: 'border-forest/10 bg-white/70 text-forest/80',
    sun: 'border-sun/30 bg-sun/15 text-forest',
    grove: 'border-grove/20 bg-grove/10 text-pine',
    sky: 'border-sky/25 bg-sky/10 text-forest',
  }[tone]

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>
}

export function TabButton({ active, count, children, ...props }) {
  return (
    <button
      className={[
        'cta-text inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition',
        active ? 'border-forest bg-forest text-cream shadow-lift' : 'border-forest/10 bg-white/70 text-forest/72 hover:border-pine/25 hover:text-forest',
      ].join(' ')}
      {...props}
    >
      <span>{children}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/18 text-cream' : 'bg-forest/6 text-forest/75'}`}>{count}</span>
    </button>
  )
}

export function FieldLabel({ title, detail }) {
  return (
    <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
      <label className="font-cta text-sm text-forest">{title}</label>
      {detail ? <span className="text-xs text-forest/50">{detail}</span> : null}
    </div>
  )
}

export function EmptyState({ title, body, icon, linkTo, linkLabel }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-pine/20 bg-white/55 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest text-2xl text-cream shadow-lift">
        {icon}
      </div>
      <h3 className="font-cta text-xl text-forest">{title}</h3>
      <p className="body-copy mx-auto mt-3 max-w-xl">{body}</p>
      {linkTo && linkLabel ? (
        <Link to={linkTo} className="cta-text mt-6 inline-flex text-sm text-pine underline underline-offset-4">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  )
}
