import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, SectionEyebrow } from "@/components/site-chrome";
import { Book, Terminal, Code, Layers, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Viktor RAG" },
      { name: "description", content: "Guides, API reference, and architecture notes for building with Viktor RAG." },
    ],
  }),
  component: DocsPage,
});

const sections = [
  { Icon: Zap, title: "Quickstart", desc: "From signup to your first cited answer in under 5 minutes.", time: "5 min" },
  { Icon: Layers, title: "Ingestion pipeline", desc: "PDF, image, code, and tabular extractors — and how to bring your own.", time: "12 min" },
  { Icon: Code, title: "REST & SDK reference", desc: "TypeScript and Python SDKs, plus the raw HTTP API.", time: "Reference" },
  { Icon: Terminal, title: "CLI", desc: "Bulk-index folders, schedule re-embedding, and tail verification logs.", time: "8 min" },
  { Icon: ShieldCheck, title: "Verification engine", desc: "Tune thresholds, surface low-confidence answers, and route to human review.", time: "10 min" },
  { Icon: Book, title: "Architecture", desc: "How LangGraph, Qdrant, and the re-ranker fit together end-to-end.", time: "15 min" },
];

const example = `import { Viktor } from "@viktor/sdk";

const client = new Viktor({ apiKey: process.env.VIKTOR_KEY });

// 1. Ingest
await client.documents.upload({
  path: "./contracts/q4-2026.pdf",
  workspace: "legal",
});

// 2. Ask, with verified citations
const { answer, citations, confidence } = await client.ask({
  workspace: "legal",
  query: "What changed in the indemnity clause?",
});

console.log(answer);          // grounded answer
console.log(confidence);      // 0.94
console.log(citations[0]);    // { doc, page, span, score }`;

function DocsPage() {
  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-20">
        <SectionEyebrow>Documentation</SectionEyebrow>
        <h1 className="mt-3 text-[44px] md:text-[64px] leading-[0.95] tracking-tight max-w-3xl">
          Build with <span className="font-mondwest text-[#1f5d4f]">Viktor</span>.<br />Ship in an afternoon.
        </h1>
        <p className="mt-6 text-lg text-[#273C46] max-w-2xl">
          Short guides, copy-paste examples, and a reference you can actually search.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {sections.map((s) => (
            <a href="#" key={s.title} className="bg-white rounded-3xl p-7 border border-[#051A24]/5 hover:border-[#1f5d4f]/30 hover:-translate-y-0.5 transition group">
              <div className="flex items-start justify-between">
                <s.Icon className="w-6 h-6 text-[#1f5d4f]" />
                <ArrowUpRight className="w-4 h-4 text-[#273C46] group-hover:text-[#1f5d4f] transition" />
              </div>
              <h3 className="mt-8 font-medium text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-[#273C46]">{s.desc}</p>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[#273C46]">{s.time}</p>
            </a>
          ))}
        </div>

        <div className="mt-16 grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <SectionEyebrow>Quickstart</SectionEyebrow>
            <h2 className="mt-3 text-3xl tracking-tight">Three lines, one verified answer.</h2>
            <p className="mt-4 text-[#273C46]">
              Install the SDK, point it at a document, and ask. Citations and confidence scores come standard.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/signup" className="text-sm font-medium text-[#1f5d4f] inline-flex items-center gap-1">Get an API key <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
          <pre className="md:col-span-3 bg-[#051A24] text-[#E0EBF0] rounded-3xl p-6 text-[12px] leading-relaxed font-mono overflow-x-auto">
            <code>{example}</code>
          </pre>
        </div>
      </section>
    </PageShell>
  );
}
