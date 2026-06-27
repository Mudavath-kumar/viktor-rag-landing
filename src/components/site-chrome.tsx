import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight, LogOut, User as UserIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

export const Logo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-label="Viktor RAG">
    <path
      d="M4 4 L12 20 L20 4"
      stroke="#051A24"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PrimaryBtn = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-[#051A24] text-white rounded-full px-7 py-3 text-[13px] font-medium hover:bg-[#0D212C] transition-all duration-200 shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),0_9px_6px_0_rgba(5,26,36,0.05),inset_0_2px_8px_0_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
  >
    {children}
  </button>
);

export const SecondaryBtn = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-white text-[#051A24] rounded-full px-7 py-3 text-[13px] font-medium hover:shadow-lg transition-all duration-200 shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
  >
    {children}
  </button>
);

export const InvertedBtn = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-white text-[#051A24] rounded-full px-7 py-3 text-[13px] font-medium hover:bg-gray-100 transition-all duration-200 ${className}`}
  >
    {children}
  </button>
);

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  const NAV = [
    { label: "Features", to: "/features" as const },
    { label: "Pricing", to: "/pricing" as const },
    { label: "Docs", to: "/docs" as const },
    ...(user
      ? [
          { label: "Dashboard", to: "/dashboard" as const },
          { label: "Chat", to: "/chat" as const },
        ]
      : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pt-4 sm:pt-6 px-4 sm:px-8 gap-2 sm:gap-3">
      <Link
        to="/"
        className="flex items-center justify-center rounded-full w-10 h-10 sm:w-11 sm:h-11 shrink-0"
        style={{ backgroundColor: "#EDEDED" }}
        aria-label="Home"
      >
        <Logo className="w-5 h-5" />
      </Link>
      <nav
        className="hidden md:flex items-center gap-4 sm:gap-8 rounded-xl px-4 sm:px-6 py-2.5 sm:py-3"
        style={{ backgroundColor: "#EDEDED" }}
      >
        {NAV.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            className="text-[12px] sm:text-[14px] font-medium text-gray-700 hover:text-gray-900 transition-colors"
            activeProps={{ className: "text-[#051A24] font-semibold" }}
          >
            {l.label}
          </Link>
        ))}
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-gray-500 hidden lg:inline">{user.email}</span>
            <Link
              to="/upload"
              className="text-[12px] sm:text-[14px] font-medium text-gray-700 hover:text-gray-900"
            >
              Upload
            </Link>
            <Link
              to="/profile"
              className="text-[12px] sm:text-[14px] font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              <UserIcon className="w-3 h-3" /> Profile
            </Link>
            <button
              onClick={signOut}
              className="text-[12px] sm:text-[14px] font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" /> Sign out
            </button>
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="text-[12px] sm:text-[14px] font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link to="/signup">
              <PrimaryBtn className="!text-[12px] !px-5 !py-2">Get Started</PrimaryBtn>
            </Link>
          </>
        )}
      </nav>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center rounded-full w-10 h-10 shrink-0"
        style={{ backgroundColor: "#EDEDED" }}
        aria-label="Menu"
      >
        <Menu className="w-5 h-5 text-[#051A24]" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 bottom-0 w-72 bg-white p-6 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <Logo className="w-6 h-6" />
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {NAV.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="text-base font-medium text-[#051A24]"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  to="/upload"
                  className="text-base font-medium text-[#051A24]"
                  onClick={() => setOpen(false)}
                >
                  Upload
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="text-base font-medium text-red-500 text-left"
                >
                  Sign out
                </button>
              </>
            )}
            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-[#051A24]"
                >
                  Sign in
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <PrimaryBtn className="w-full">Get Started</PrimaryBtn>
                </Link>
              </>
            )}
          </aside>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const cols = [
    { title: "Product", items: ["Features", "Pricing", "Documentation", "API Reference"] },
    { title: "Company", items: ["About", "Blog", "Careers", "Contact"] },
    { title: "Legal", items: ["Privacy", "Terms", "Security"] },
  ];
  return (
    <>
      <footer className="w-full py-12 px-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div>
            <PrimaryBtn>Start Free Trial</PrimaryBtn>
            <p className="font-mondwest text-xl font-semibold text-[#051A24] mt-4">Viktor RAG</p>
          </div>
          <div>
            <ArrowUpRight className="w-5 h-5 text-[#051A24] mb-4" />
            <div className="grid grid-cols-3 gap-10">
              {cols.map((c) => (
                <div key={c.title}>
                  <p className="font-semibold text-sm text-[#051A24] mb-3">{c.title}</p>
                  <ul className="space-y-2">
                    {c.items.map((it) => (
                      <li key={it}>
                        <a
                          href="#"
                          className="text-base text-[#051A24] hover:opacity-70 transition-opacity"
                        >
                          {it}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
      <div className="max-w-[1200px] mx-auto px-6 py-4 border-t border-[#051A24]/10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-sm text-[#051A24]">© 2026 Viktor RAG. All rights reserved.</p>
        <p className="text-sm text-[#273C46]">Built with FastAPI · Groq · Supabase</p>
      </div>
    </>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f0f0ee] text-[#051A24] antialiased">
      <Navbar />
      <div className="pt-28 md:pt-32">{children}</div>
      <Footer />
    </main>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#273C46]">{children}</p>;
}
