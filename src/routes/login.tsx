import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, SectionEyebrow, PrimaryBtn } from "@/components/site-chrome";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Viktor RAG" },
      { name: "description", content: "Sign in to your Viktor RAG workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signIn, user } = useAuth();

  if (user) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <PageShell>
      <section className="px-6 max-w-[1100px] mx-auto pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="hidden md:block">
          <SectionEyebrow>Welcome back</SectionEyebrow>
          <h1 className="mt-4 text-[56px] leading-[0.95] tracking-tight">
            Pick up <span className="font-mondwest text-[#1f5d4f]">where</span>
            <br />
            you left off.
          </h1>
          <p className="mt-6 text-[#273C46] max-w-md">
            Your indexed knowledge base, verification scores, and citation history are waiting.
          </p>
          <div className="mt-10 bg-[#051A24] text-white rounded-3xl p-6 max-w-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#5cc9b1]">
              Last session
            </p>
            <p className="font-mondwest text-3xl mt-3">2,418 docs</p>
            <p className="text-sm text-[#E0EBF0] mt-1">9,304 queries · 97.2% verified</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#051A24]/5 shadow-[0_30px_60px_-30px_rgba(5,26,36,0.18)]">
          <h2 className="text-2xl font-medium">Sign in</h2>
          <p className="text-sm text-[#273C46] mt-1">Use your work email to continue.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs text-[#273C46] uppercase tracking-wide">Email</span>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#273C46]" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-full border border-[#051A24]/10 bg-[#f0f0ee] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-[#273C46] uppercase tracking-wide">Password</span>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#273C46]" />
                <input
                  required
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-[#051A24]/10 bg-[#f0f0ee] pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#273C46]"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <PrimaryBtn
              className="w-full justify-center inline-flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </PrimaryBtn>
          </form>

          <p className="mt-6 text-sm text-center text-[#273C46]">
            New here?{" "}
            <Link to="/signup" className="text-[#1f5d4f] font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
