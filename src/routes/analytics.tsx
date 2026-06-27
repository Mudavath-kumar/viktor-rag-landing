import { createFileRoute } from "@tanstack/react-router";
import { PageShell, SectionEyebrow } from "@/components/site-chrome";
import { TrendingUp, ShieldCheck, Clock, Search } from "lucide-react";
import analyticsImg from "@/assets/analytics-paper.jpg";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Viktor RAG" },
      {
        name: "description",
        content:
          "Verification accuracy, retrieval latency, top queries, and source coverage across your knowledge base.",
      },
      { property: "og:title", content: "Analytics — Viktor RAG" },
      {
        property: "og:description",
        content: "Measure grounding, confidence, and retrieval performance.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const kpis = [
  {
    label: "Verification accuracy",
    value: "97.2%",
    Icon: ShieldCheck,
    trend: "+0.6 pts vs last week",
  },
  { label: "Avg retrieval latency", value: "340ms", Icon: Clock, trend: "−42ms vs last week" },
  { label: "Queries this month", value: "184,302", Icon: Search, trend: "+18.4%" },
  { label: "Avg confidence", value: "0.91", Icon: TrendingUp, trend: "stable" },
];

const topQueries = [
  { q: "renewal clause obligations", n: 1284, conf: 0.96 },
  { q: "Q4 revenue by segment", n: 982, conf: 0.93 },
  { q: "compliance gaps SOC2", n: 740, conf: 0.88 },
  { q: "API rate limit defaults", n: 612, conf: 0.97 },
  { q: "data residency policy", n: 488, conf: 0.91 },
];

const sources = [
  { name: "Contracts", pct: 38 },
  { name: "Research", pct: 24 },
  { name: "Code repos", pct: 19 },
  { name: "Reports", pct: 12 },
  { name: "Misc", pct: 7 },
];

function AnalyticsPage() {
  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-24">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7">
            <SectionEyebrow>Analytics</SectionEyebrow>
            <h1 className="mt-3 text-[40px] md:text-[60px] leading-[1] tracking-tight">
              Measure the <span className="font-mondwest text-[#1f5d4f]">grounding</span>.
            </h1>
            <p className="mt-6 text-[#273C46] max-w-lg">
              Verification accuracy, retrieval latency, confidence distribution — observability for
              the parts of RAG that actually matter.
            </p>
          </div>
          <div className="lg:col-span-5">
            <img
              src={analyticsImg}
              alt="Hand-drawn line charts on tracing paper"
              loading="lazy"
              className="w-full rounded-3xl shadow-lg aspect-[4/3] object-cover"
            />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-3xl p-6 border border-[#051A24]/5">
              <div className="flex justify-between items-start">
                <p className="text-xs text-[#273C46] uppercase tracking-wide max-w-[120px]">
                  {k.label}
                </p>
                <k.Icon className="w-4 h-4 text-[#1f5d4f]" />
              </div>
              <p className="mt-4 font-mondwest text-[44px] leading-none text-[#051A24]">
                {k.value}
              </p>
              <p className="mt-3 text-xs text-[#1f5d4f]">{k.trend}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#051A24] rounded-3xl p-8 text-white">
            <p className="text-xs uppercase tracking-wide text-[#E0EBF0]">
              Confidence distribution · 30 days
            </p>
            <svg viewBox="0 0 400 160" className="mt-6 w-full h-44">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5cc9b1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#5cc9b1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,120 L20,110 L40,115 L60,90 L80,95 L100,72 L120,80 L140,55 L160,60 L180,42 L200,50 L220,30 L240,38 L260,28 L280,40 L300,45 L320,60 L340,75 L360,95 L380,115 L400,130 L400,160 L0,160 Z"
                fill="url(#g)"
              />
              <path
                d="M0,120 L20,110 L40,115 L60,90 L80,95 L100,72 L120,80 L140,55 L160,60 L180,42 L200,50 L220,30 L240,38 L260,28 L280,40 L300,45 L320,60 L340,75 L360,95 L380,115 L400,130"
                fill="none"
                stroke="#5cc9b1"
                strokeWidth="2"
              />
            </svg>
            <div className="mt-2 flex justify-between text-[10px] font-mono text-[#E0EBF0]">
              <span>0.0</span>
              <span>0.25</span>
              <span>0.5</span>
              <span>0.75</span>
              <span>1.0</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-[#051A24]/5">
            <p className="text-xs uppercase tracking-wide text-[#273C46]">Source coverage</p>
            <ul className="mt-6 space-y-4">
              {sources.map((s) => (
                <li key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.name}</span>
                    <span className="font-mono text-[#273C46]">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#051A24]/10 overflow-hidden">
                    <div className="h-full bg-[#1f5d4f]" style={{ width: `${s.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 bg-white rounded-3xl p-8 border border-[#051A24]/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Top queries</h2>
            <span className="text-xs text-[#273C46]">Last 30 days</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#273C46] border-b border-[#051A24]/10">
                <th className="py-3 font-medium">Query</th>
                <th className="py-3 font-medium text-right">Volume</th>
                <th className="py-3 font-medium text-right">Avg confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#051A24]/5">
              {topQueries.map((q) => (
                <tr key={q.q}>
                  <td className="py-4">{q.q}</td>
                  <td className="py-4 text-right font-mono">{q.n.toLocaleString()}</td>
                  <td className="py-4 text-right font-mono text-[#1f5d4f]">{q.conf.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
