import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, SectionEyebrow, PrimaryBtn } from "@/components/site-chrome";
import { Mail, Lock, User, Building2, Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Viktor RAG" },
      { name: "description", content: "Start your free Viktor RAG workspace. Upload documents and get verified, cited answers in minutes." },
    ],
  }),
  component: SignupPage,
});

const perks = [
  "10,000 free queries / month",
  "Up to 500 documents indexed",
  "Verification + citation engine",
  "No credit card required",
];

function SignupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 700);
  };
  return (
    <PageShell>
      <section className="px-6 max-w-[1100px] mx-auto pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="bg-[#051A24] text-white rounded-3xl p-10 order-2 md:order-1">
          <SectionEyebrow><span className="text-[#5cc9b1]">Free forever tier</span></SectionEyebrow>
          <h1 className="mt-4 font-mondwest text-5xl leading-[1]">
            Verified answers,<br />in 60 seconds.
          </h1>
          <p className="mt-6 text-[#E0EBF0] max-w-md">
            Drop in your first PDF, ask one question, and watch every claim trace back to its source.
          </p>
          <ul className="mt-10 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-[#5cc9b1]/15 grid place-items-center">
                  <Check className="w-3.5 h-3.5 text-[#5cc9b1]" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
            {[["12K+", "Teams"], ["94%", "Less halluc."], ["4.9★", "Avg rating"]].map(([v, l]) => (
              <div key={l}>
                <p className="font-mondwest text-3xl">{v}</p>
                <p className="text-xs text-[#E0EBF0]">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#051A24]/5 shadow-[0_30px_60px_-30px_rgba(5,26,36,0.18)] order-1 md:order-2">
          <h2 className="text-2xl font-medium">Create your workspace</h2>
          <p className="text-sm text-[#273C46] mt-1">Takes about a minute.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {[
              { Icon: User, label: "Full name", type: "text", ph: "Ada Lovelace" },
              { Icon: Building2, label: "Workspace", type: "text", ph: "Acme Research" },
              { Icon: Mail, label: "Work email", type: "email", ph: "you@company.com" },
              { Icon: Lock, label: "Password", type: "password", ph: "8+ characters" },
            ].map((f) => (
              <label key={f.label} className="block">
                <span className="text-xs text-[#273C46] uppercase tracking-wide">{f.label}</span>
                <div className="mt-1 relative">
                  <f.Icon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#273C46]" />
                  <input required type={f.type} placeholder={f.ph} className="w-full rounded-full border border-[#051A24]/10 bg-[#f0f0ee] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]" />
                </div>
              </label>
            ))}
            <label className="flex items-start gap-2 text-xs text-[#273C46]">
              <input required type="checkbox" className="mt-0.5" />
              I agree to the <a href="#" className="text-[#1f5d4f] underline">Terms</a> and <a href="#" className="text-[#1f5d4f] underline">Privacy Policy</a>.
            </label>
            <PrimaryBtn className="w-full justify-center inline-flex items-center gap-2" disabled={loading}>
              {loading ? "Creating workspace…" : <>Start free <ArrowRight className="w-4 h-4" /></>}
            </PrimaryBtn>
          </form>
          <p className="mt-6 text-sm text-center text-[#273C46]">
            Already have an account? <Link to="/login" className="text-[#1f5d4f] font-medium">Sign in</Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
