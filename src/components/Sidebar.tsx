import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSidebar } from "@/hooks/useSidebar";

interface SidebarProps {
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Sidebar({ className = "" }: SidebarProps) {
  const { isOpen, toggle, close } = useSidebar();
  const sidebarRef = useRef<HTMLElement>(null);

  // Trap focus inside sidebar when open on mobile
  useEffect(() => {
    if (!isOpen) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const focusable = Array.from(sidebar.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    // Move focus into sidebar
    first?.focus();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  const menuItems = [
    {
      href: "/dashboard",
      label: "Vault",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      href: "https://stellar.org/soroban",
      label: "Soroban",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      external: true,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        className={`
          fixed left-0 top-0 z-50 h-screen w-64 bg-background-primary border-r border-border-primary
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${className}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-primary">
            <Link href="/" className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-axion-500 to-indigo-500 shadow-lg shadow-axion-500/20"
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-text-primary">Axionvera</div>
                <div className="text-xs text-text-muted">Dashboard</div>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={close}
              aria-label="Close sidebar"
              className="lg:hidden rounded-xl border border-border-primary bg-background-secondary/30 p-2 text-text-secondary transition hover:bg-background-secondary/60"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-text-secondary transition hover:bg-background-secondary/60 hover:text-text-primary"
                    >
                      <span className="text-slate-400 transition-colors">{item.icon}</span>
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={close}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-text-secondary transition hover:bg-background-secondary/60 hover:text-text-primary"
                    >
                      <span className="text-slate-400 transition-colors">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}