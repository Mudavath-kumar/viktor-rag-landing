import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, SectionEyebrow, PrimaryBtn, SecondaryBtn } from "@/components/site-chrome";
import { Brain, ShieldCheck, Search, Network, Layers, Cpu, Zap, GitBranch, Eye, FileSearch, LinkIcon, Lock } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Viktor RAG" },
      { name: "description", content: "Multi-modal ingestion, agentic retrieval, claim verification, and source-grounded citations." },
      { property: "og:title", content: "Features — Viktor RAG" },
      { property: "og:description", content: "Everything inside the Viktor RAG agentic pipeline." },
    ],
  }),
  component: FeaturesPage,
});

const pillars = [
  { Icon: Layers, name: "Multi-modal ingestion", desc: "PDFs, scanned images, code repos, spreadsheets, audio transcripts — one pipeline.", tag: "Ingest" },
  { Icon: Network, name: "Agentic retrieval", desc: "LangGraph routes each question through query planning, hybrid search, and re-ranking.", tag: "Retrieve" },
  { Icon: ShieldCheck, name: "Claim verification", desc: "Every sentence is cross-checked against retrieved evidence before being returned.", tag: "Verify" },
  { Icon: LinkIcon, name: "Inline citations", desc: "Source-accurate spans link back to the exact page, cell, or line in your originals.", tag: "Cite" },
];

const deep = [
  { Icon: Brain, name: "Query understanding", desc: "Decomposes complex questions into sub-queries with intent classification." },
  { Icon: Search, name: "Hybrid search", desc: "Dense vectors + BM25 lexical, fused with reciprocal rank for recall." },
  { Icon: Eye, name: "OCR & layout parsing", desc: "Reads tables, equations, and figures — not just plain text." },
  { Icon: Cpu, name: "Re-ranker", desc: "Cross-encoder scoring trims context to the top-k most relevant chunks." },
  { Icon: FileSearch, name: "Citation grounding", desc: "Quote-level alignment between answers and source chunks." },
  { Icon: GitBranch, name: "Multi-hop reasoning", desc: "Chains evidence across documents to answer cross-cutting questions." },
  { Icon: Zap, name: "Streaming responses", desc: "Token-by-token output with citations appearing as they resolve." },
  { Icon: Lock, name: "SOC 2 ready", desc: "Per-workspace isolation, encryption at rest, audit logs for every query." },
];

function FeaturesPage() {
  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-20">
        <SectionEyebrow>Features</SectionEyebrow>
        <h1 className="mt-3 text-[44px] md:text-[68px] leading-[0.95] tracking-tight max-w-3xl">
          A <span className="font-mondwest text-[#1f5d4f]">grounded</span> answer,<br />for every question.
        </h1>
        <p className="mt-6 text-lg text-[#273C46] max-w-2xl">
          Viktor RAG is not a wrapper on top of a chat model. It is a deliberate, observable pipeline — built so you can trust what you read.
        </p>

        <div className="mt-16 grid md:grid-cols-2 gap-4">
          {pillars.map((p) => (
            <div key={p.name} className="bg-white rounded-3xl p-8 border border-[#051A24]/5 group hover:shadow-[0_30px_60px_-30px_rgba(5,26,36,0.18)] transition">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1f5d4f] bg-[#1f5d4f]/8 px-3 py-1 rounded-full">{p.tag}</span>
                <p.Icon className="w-6 h-6 text-[#1f5d4f]" />
              </div>
              <h3 className="mt-8 font-mondwest text-3xl">{p.name}</h3>
              <p className="mt-3 text-[#273C46] text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <SectionEyebrow>Under the hood</SectionEyebrow>
          <h2 className="mt-3 text-3xl md:text-5xl tracking-tight max-w-2xl">Every component you can name, and a few you cannot.</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {deep.map((d) => (
              <div key={d.name} className="bg-[#f7f7f5] rounded-2xl p-6 border border-[#051A24]/5">
                <d.Icon className="w-5 h-5 text-[#1f5d4f]" />
                <p className="mt-4 font-medium text-sm">{d.name}</p>
                <p className="mt-2 text-xs text-[#273C46] leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 bg-[#051A24] rounded-[32px] p-10 md:p-16 text-white">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <SectionEyebrow><span className="text-[#5cc9b1]">Observability</span></SectionEyebrow>
              <h3 className="mt-4 font-mondwest text-5xl">See every step.</h3>
              <p className="mt-6 text-[#E0EBF0] max-w-md">
                Trace each answer through query planning, retrieval, re-ranking, verification, and synthesis. No black box.
              </p>
              <div className="mt-8 flex gap-3">
                <Link to="/signup"><PrimaryBtn className="!bg-white !text-[#051A24]">Try it free</PrimaryBtn></Link>
                <Link to="/docs"><SecondaryBtn>Read the docs</SecondaryBtn></Link>
              </div>
            </div>
            <div className="bg-[#0D212C] rounded-2xl p-6 font-mono text-xs space-y-2">
              {[
                ["01", "plan", "Decompose → 3 sub-queries"],
                ["02", "retrieve", "Hybrid · 247 chunks → 24"],
                ["03", "rerank", "Cross-encoder · top 8"],
                ["04", "verify", "8/8 claims grounded ✓"],
                ["05", "cite", "12 inline citations"],
              ].map(([n, k, v]) => (
                <div key={n} className="flex gap-4 py-2 border-b border-white/5 last:border-0">
                  <span className="text-[#5cc9b1]">{n}</span>
                  <span className="text-white/60 w-20">{k}</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
