import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, SectionEyebrow, PrimaryBtn } from "@/components/site-chrome";
import { Mail, Lock, Github, Eye, EyeOff, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Viktor RAG" },
      { name: "description", content: "Sign in to your Viktor RAG workspace to query verified answers from your documents." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 600);
  };

  return (
    <PageShell>
      <section className="px-6 max-w-[1100px] mx-auto pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="hidden md:block">
          <SectionEyebrow>Welcome back</SectionEyebrow>
          <h1 className="mt-4 text-[56px] leading-[0.95] tracking-tight">
            Pick up <span className="font-mondwest text-[#1f5d4f]">where</span><br />you left off.
          </h1>
          <p className="mt-6 text-[#273C46] max-w-md">
            Your indexed knowledge base, verification scores, and citation history are waiting.
          </p>
          <div className="mt-10 bg-[#051A24] text-white rounded-3xl p-6 max-w-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5cc9b1]">Last session</p>
            <p className="font-mondwest text-3xl mt-3">2,418 docs</p>
            <p className="text-sm text-[#E0EBF0] mt-1">9,304 queries · 97.2% verified</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#051A24]/5 shadow-[0_30px_60px_-30px_rgba(5,26,36,0.18)]">
          <h2 className="text-2xl font-medium">Sign in</h2>
          <p className="text-sm text-[#273C46] mt-1">Use your work email to continue.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="rounded-full border border-[#051A24]/10 py-2.5 text-sm font-medium hover:bg-[#f0f0ee] transition flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Google
            </button>
            <button className="rounded-full border border-[#051A24]/10 py-2.5 text-sm font-medium hover:bg-[#f0f0ee] transition flex items-center justify-center gap-2">
              <Github className="w-4 h-4" /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-[#051A24]/10" />
            <span className="text-xs text-[#273C46]">or</span>
            <div className="h-px flex-1 bg-[#051A24]/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-[#273C46] uppercase tracking-wide">Email</span>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#273C46]" />
                <input required type="email" defaultValue="you@company.com" className="w-full rounded-full border border-[#051A24]/10 bg-[#f0f0ee] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-[#273C46] uppercase tracking-wide">Password</span>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#273C46]" />
                <input required type={show ? "text" : "password"} placeholder="••••••••" className="w-full rounded-full border border-[#051A24]/10 bg-[#f0f0ee] pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#273C46]">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#273C46]">
                <input type="checkbox" className="rounded" /> Remember me
              </label>
              <a href="#" className="text-[#1f5d4f] font-medium">Forgot?</a>
            </div>
            <PrimaryBtn className="w-full justify-center inline-flex items-center gap-2" disabled={loading}>
              {loading ? "Signing in…" : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </PrimaryBtn>
          </form>

          <p className="mt-6 text-sm text-center text-[#273C46]">
            New here? <Link to="/signup" className="text-[#1f5d4f] font-medium">Create an account</Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
