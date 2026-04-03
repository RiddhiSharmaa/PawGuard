import Link from 'next/link'
import { PawPrint } from 'lucide-react'

const footerLinks = [
  { href: '/report', label: 'Report' },
  { href: '/map', label: 'Map' },
  { href: '/feed', label: 'Feed' },
  { href: '/ngo-register', label: 'NGO Register' },
  { href: '/sos', label: 'SOS' },
]

export function Footer() {
  return (
    <footer className="border-t border-[var(--sg-neutral-200)] py-8">
      <div className="max-w-7xl mx-auto px-10">
        <div className="flex items-center justify-between">
          {/* Logo + Tagline */}
          <div className="flex items-center gap-3">
            <PawPrint className="w-6 h-6 text-[var(--sg-primary)]" />
            <span className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[var(--sg-primary)]">
              PawGuard
            </span>
            <span className="text-[var(--sg-neutral-400)] text-sm ml-2">
              
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--sg-neutral-600)] text-sm hover:text-[var(--sg-neutral-800)] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
