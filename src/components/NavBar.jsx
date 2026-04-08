import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-ink">
          Simplify
        </Link>
        <div />
      </div>
    </div>
  )
}
