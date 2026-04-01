'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PawPrint } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/feed', label: 'Feed' },
  { href: '/sos', label: 'SOS', isUrgent: true },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[var(--sg-neutral-200)] shadow-sm">
      <div className="h-full max-w-7xl mx-auto px-10 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-all duration-200 hover:opacity-80">
          <PawPrint className="w-7 h-7 text-[var(--sg-primary)]" />
          <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[var(--sg-primary)]">
            StreetGuard
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative text-[15px] font-medium transition-all duration-200
                  ${link.isUrgent 
                    ? 'text-[var(--sg-urgent)] hover:text-[var(--sg-urgent)]' 
                    : isActive 
                      ? 'text-[var(--sg-primary)]' 
                      : 'text-[var(--sg-neutral-600)] hover:text-[var(--sg-neutral-800)]'
                  }
                `}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--sg-primary)]" />
                )}
              </Link>
            )
          })}

          {/* Report Button */}
          <Link
            href="/report"
            className="
              bg-[var(--sg-primary)] text-white font-semibold
              px-5 py-2 rounded-xl
              transition-all duration-200
              hover:bg-[var(--sg-primary-dark)]
              active:scale-95
            "
          >
            Report a Dog
          </Link>
        </div>
      </div>
    </nav>
  )
}
