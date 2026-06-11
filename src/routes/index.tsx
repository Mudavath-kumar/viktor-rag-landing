import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Brain, Search, ShieldCheck, Quote, MessageSquare, Sparkles, TrendingUp,
  Star, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Code, Table,
  ArrowUpRight, Check, Upload, Cpu, Layers, Zap, Database, Network,
  PlayCircle, Github, Slack, Globe, Box, GitBranch,
} from "lucide-react";
import { Navbar, Footer, PrimaryBtn, SecondaryBtn, InvertedBtn, SectionEyebrow } from "@/components/site-chrome";
import heroBook from "@/assets/hero-book.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Viktor RAG — Multi-Modal Agentic RAG Platform" },
      { name: "description", content: "Upload PDFs, images, code, and spreadsheets. Verified answers with source citations powered by agentic retrieval." },
      { property: "og:title", content: "Viktor RAG — Multi-Modal Agentic RAG Platform" },
      { property: "og:description", content: "Verified, cited answers from your documents — powered by LangGraph agents and hybrid retrieval." },
    ],
  }),
  component: Index,
});

function useInViewAnimation(threshold = 0.12) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

type AnimVariant = "up" | "left" | "right" | "blur" | "scale";
const ANIM_CLASS: Record<AnimVariant, string> = {
  up: "animate-fade-in-up",
  left: "animate-slide-in-left",
  right: "animate-slide-in-right",
  blur: "animate-blur-up",
  scale: "animate-scale-in",
};

function Reveal({ children, delay = 0, variant = "up", className = "" }: { children: ReactNode; delay?: number; variant?: AnimVariant; className?: string }) {
  const { ref, isVisible } = useInViewAnimation();
  return (
    <div ref={ref} className={`${isVisible ? ANIM_CLASS[variant] : "opacity-0"} ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

/* Animated counter — eases up to target value when in view */
function CountUp({ to, suffix = "", duration = 1600 }: { to: number; suffix?: string; duration?: number }) {
  const { ref, isVisible } = useInViewAnimation();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, to, duration]);
  return <span ref={ref as React.RefObject<HTMLSpanElement>}>{val.toLocaleString()}{suffix}</span>;
}

function Index() {
  return (
    <main className="min-h-screen bg-[#f0f0ee] text-[#051A24] antialiased overflow-x-hidden">
      <Navbar />
      <Hero />
      <LogoMarquee />
      <StatsBand />
      <Capabilities />
      <HowItWorks />
      <LiveDemo />
      <Testimonial />
      <Architecture />
      <Integrations />
      <Pricing />
      <TestimonialCarousel />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}


/* ---------- Hero: editorial split ---------- */
function Hero() {
  return (
    <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-6">
      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-6">
          <Reveal delay={0.05}>
            <SectionEyebrow>Multi-Modal Agentic RAG</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.15}>
            <h1 className="mt-5 text-[44px] md:text-[68px] lg:text-[80px] leading-[0.95] tracking-tight text-[#051A24]">
              Understand <span className="font-mondwest text-[#1f5d4f]">your</span><br />
              documents.<br />
              Verify <span className="font-mondwest text-[#1f5d4f]">every</span> answer.
            </h1>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-8 text-[17px] leading-relaxed text-[#273C46] max-w-[520px]">
              Viktor is an agentic retrieval platform. Drop in PDFs, images, code, and spreadsheets — get answers grounded in the exact page, chunk, and line they came from.
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/upload"><PrimaryBtn>Upload a document</PrimaryBtn></Link>
              <Link to="/chat"><SecondaryBtn>Try the chat</SecondaryBtn></Link>
            </div>
          </Reveal>
          <Reveal delay={0.5}>
            <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md border-t border-[#051A24]/10 pt-6">
              <div><dt className="text-xs text-[#273C46]">Hallucination</dt><dd className="font-mondwest text-3xl text-[#051A24]">-94%</dd></div>
              <div><dt className="text-xs text-[#273C46]">Retrieval P95</dt><dd className="font-mondwest text-3xl text-[#051A24]">340ms</dd></div>
              <div><dt className="text-xs text-[#273C46]">Cited answers</dt><dd className="font-mondwest text-3xl text-[#051A24]">100%</dd></div>
            </dl>
          </Reveal>
        </div>
        <div className="lg:col-span-6 relative">
          <Reveal delay={0.2}>
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-[#1f5d4f]/10 blur-2xl" />
              <img src={heroBook} alt="An open book with translucent pages and highlighted passages" className="relative w-full rounded-[28px] shadow-[0_30px_80px_-30px_rgba(5,26,36,0.4)] object-cover aspect-[5/6]" />
              <div className="absolute -bottom-6 -right-4 md:-right-10 bg-white rounded-2xl shadow-xl p-5 w-[260px]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#1f5d4f]"><ShieldCheck className="w-4 h-4" />VERIFIED · 0.97</div>
                <p className="mt-2 text-sm leading-snug text-[#051A24]">"The clause appears on page 14, paragraph 3, and matches the cited precedent."</p>
                <p className="mt-2 text-[11px] text-[#273C46]">contract_v3.pdf · p.14</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Capabilities (replaces marquee) ---------- */
const caps = [
  { Icon: FileText, title: "PDF & DOCX", desc: "Layout-aware extraction with tables and footnotes preserved." },
  { Icon: ImageIcon, title: "Images & Scans", desc: "PaddleOCR pipeline for handwriting, diagrams, and screenshots." },
  { Icon: Code, title: "Code Repos", desc: "Tree-sitter parsing for dependency and architecture maps." },
  { Icon: Table, title: "Spreadsheets", desc: "Semantic table understanding across sheets and merged cells." },
];

function Capabilities() {
  return (
    <section className="bg-white py-20 md:py-28 px-6">
      <div className="max-w-[1200px] mx-auto">
        <Reveal>
          <SectionEyebrow>What it ingests</SectionEyebrow>
          <h2 className="mt-3 text-[32px] md:text-[44px] leading-[1.05] tracking-tight max-w-2xl">
            Four formats. <span className="font-mondwest text-[#1f5d4f]">One</span> grounded answer.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#051A24]/10 rounded-3xl overflow-hidden">
          {caps.map((c, i) => (
            <Reveal key={c.title} delay={0.08 * i}>
              <div className="bg-white h-full p-8 hover:bg-[#f0f0ee] transition-colors">
                <c.Icon className="w-7 h-7 text-[#1f5d4f]" />
                <h3 className="mt-8 text-xl font-medium text-[#051A24]">{c.title}</h3>
                <p className="mt-2 text-sm text-[#273C46] leading-relaxed">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="py-20 px-6 max-w-3xl mx-auto text-center">
      <Reveal><Quote className="w-6 h-6 text-[#051A24] mx-auto mb-6" /></Reveal>
      <Reveal delay={0.1}>
        <p className="text-[32px] md:text-[44px] leading-[1.1] tracking-tight text-[#0D212C]">
          "We reduced research time by 80% using <span className="font-mondwest text-[#1f5d4f]">Viktor's</span> agentic verification."
        </p>
      </Reveal>
      <Reveal delay={0.2}>
        <p className="italic text-sm text-[#273C46] mt-6">Dr. Sarah Chen · Research Lead, BioTech Labs</p>
      </Reveal>
      <Reveal delay={0.3}>
        <div className="flex justify-center items-center gap-10 mt-10 flex-wrap opacity-60">
          <span className="font-medium text-[#051A24] text-2xl">Stanford</span>
          <span className="font-medium text-[#051A24] text-xl">MIT</span>
          <span className="font-medium text-[#051A24] text-2xl">OpenAI</span>
          <span className="font-medium text-[#051A24] text-xl">Anthropic</span>
        </div>
      </Reveal>
    </section>
  );
}

function Pricing() {
  return (
    <section className="py-16 md:py-24 px-6 bg-white">
      <div className="max-w-[1100px] mx-auto">
        <Reveal>
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h2 className="mt-3 text-[32px] md:text-[44px] leading-[1.05] tracking-tight">
            Two ways to <span className="font-mondwest text-[#1f5d4f]">deploy</span>.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Reveal delay={0.1}>
            <div className="bg-[#051A24] rounded-[32px] p-10 h-full">
              <p className="text-[#E0EBF0] text-xs font-mono">STARTER</p>
              <h3 className="text-[22px] font-medium text-[#F6FCFF] mt-2">For individual researchers</h3>
              <p className="mt-6"><span className="text-5xl font-mondwest text-[#F6FCFF]">$49</span><span className="text-sm text-[#E0EBF0]">/month</span></p>
              <ul className="mt-8 space-y-3 text-sm text-[#E0EBF0]">
                {["1,000 queries / month", "PDF, DOCX, TXT, images", "Basic citations", "Community support"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-[#5cc9b1]" />{f}</li>
                ))}
              </ul>
              <div className="mt-10"><InvertedBtn>Start free trial</InvertedBtn></div>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="bg-white border border-[#051A24]/10 rounded-[32px] p-10 h-full">
              <p className="text-[#273C46] text-xs font-mono">ENTERPRISE</p>
              <h3 className="text-[22px] font-medium text-[#051A24] mt-2">For teams that need verification</h3>
              <p className="mt-6"><span className="text-5xl font-mondwest text-[#0D212C]">Custom</span></p>
              <ul className="mt-8 space-y-3 text-sm text-[#051A24]">
                {["Unlimited queries", "ZIP repos & code analysis", "Agentic verification layer", "Hybrid retrieval + reranking", "SSO & RBAC", "Dedicated support"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-[#1f5d4f]" />{f}</li>
                ))}
              </ul>
              <div className="mt-10"><PrimaryBtn>Contact sales</PrimaryBtn></div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const features = [
  { Icon: MessageSquare, title: "Query Understanding", desc: "Classifies intent and chooses retrieval strategy." },
  { Icon: Search, title: "Hybrid Retrieval", desc: "Vector + BM25 with reciprocal rank fusion." },
  { Icon: ShieldCheck, title: "Claim Verification", desc: "Detects unsupported claims in real time." },
  { Icon: Quote, title: "Source Citations", desc: "Maps every answer to file, page, and chunk." },
  { Icon: Sparkles, title: "Response Generation", desc: "Synthesizes verified information into prose." },
  { Icon: TrendingUp, title: "Confidence Score", desc: "0–100 score from similarity + verification." },
];

function Architecture() {
  return (
    <section className="py-20 md:py-28 px-6 max-w-[1200px] mx-auto">
      <Reveal>
        <SectionEyebrow>Architecture</SectionEyebrow>
        <h2 className="mt-3 text-[32px] md:text-[44px] leading-[1.05] tracking-tight">
          Six <span className="font-mondwest text-[#1f5d4f]">agents</span>. One pipeline.
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={0.08 * (i % 3)}>
            <div className="bg-white rounded-3xl p-8 h-full border border-[#051A24]/5 hover:border-[#1f5d4f]/30 transition-colors">
              <div className="flex items-start justify-between">
                <f.Icon className="w-8 h-8 text-[#1f5d4f]" />
                <span className="font-mono text-xs text-[#273C46]">0{i + 1}</span>
              </div>
              <h3 className="mt-8 text-xl font-medium text-[#051A24]">{f.title}</h3>
              <p className="mt-2 text-sm text-[#273C46] leading-relaxed">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const testimonials = [
  { quote: "The verification agent caught hallucinations our previous RAG system missed entirely.", name: "Marcus Anderson", role: "CTO, DataFlow" },
  { quote: "Source citations alone saved our support team 20 hours a week.", name: "Alex Wu", role: "Founder, Nexgate" },
  { quote: "Hybrid retrieval found chunks pure vector search missed. The BM25 fusion is genuinely better.", name: "James Mitchell", role: "VP Eng, LaunchPad" },
  { quote: "It understood our architecture better than our own docs.", name: "Rachel Foster", role: "Co-founder, Nexus Labs" },
  { quote: "From PDFs to ZIP repos, it handles everything we throw at it.", name: "David Zhang", role: "Head of AI, Paradigm" },
];

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const i = setInterval(() => setIdx((p) => (p + 1) % testimonials.length), 3500);
    return () => clearInterval(i);
  }, [paused]);
  return (
    <section className="py-20 bg-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="max-w-[1100px] mx-auto px-6 flex items-end justify-between mb-10">
        <h2 className="text-[28px] md:text-[36px] leading-[1.1] tracking-tight">
          What <span className="font-mondwest text-[#1f5d4f]">teams</span> say
        </h2>
        <div className="flex items-center gap-2">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-black text-black" />)}
          <span className="text-sm font-medium ml-2">G2 5/5</span>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="bg-[#f0f0ee] rounded-[32px] p-10 md:p-14 min-h-[260px]">
          <Quote className="w-8 h-8 text-[#1f5d4f]" />
          <p className="mt-6 text-[22px] md:text-[28px] leading-[1.3] text-[#0D212C]">{testimonials[idx].quote}</p>
          <div className="mt-8 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{testimonials[idx].name}</p>
              <p className="text-[#273C46] text-sm">{testimonials[idx].role}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIdx((p) => (p - 1 + testimonials.length) % testimonials.length)} className="w-10 h-10 rounded-full border border-[#0D212C]/20 flex items-center justify-center hover:bg-[#051A24] hover:text-white transition-all" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setIdx((p) => (p + 1) % testimonials.length)} className="w-10 h-10 rounded-full border border-[#0D212C]/20 flex items-center justify-center hover:bg-[#051A24] hover:text-white transition-all" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-[1200px] mx-auto bg-[#051A24] rounded-[40px] py-20 md:py-32 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(31,93,79,0.4),transparent_50%)]" />
        <div className="relative">
          <h2 className="font-mondwest text-[48px] md:text-[80px] text-white leading-[1.05]">Ready to ground your AI?</h2>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Link to="/upload"><InvertedBtn>Upload a document</InvertedBtn></Link>
            <Link to="/dashboard"><button className="bg-transparent border border-white/30 text-white rounded-full px-7 py-3 text-[13px] font-medium hover:bg-white/10 transition-all inline-flex items-center gap-2">Open dashboard <ArrowUpRight className="w-4 h-4" /></button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Logo marquee ---------- */
function LogoMarquee() {
  const logos = ["Stanford", "MIT", "OpenAI", "Anthropic", "BioTech Labs", "DataFlow", "Nexus", "Paradigm", "LaunchPad", "Nexgate"];
  return (
    <section className="py-10 border-y border-[#051A24]/10 bg-[#f0f0ee] overflow-hidden">
      <p className="text-center text-xs font-mono uppercase tracking-[0.18em] text-[#273C46] mb-6">Trusted by research & engineering teams</p>
      <div className="relative">
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {[...logos, ...logos].map((l, i) => (
            <span key={i} className="text-2xl font-medium text-[#051A24]/70 hover:text-[#051A24] transition-colors">{l}</span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#f0f0ee] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#f0f0ee] to-transparent" />
      </div>
    </section>
  );
}

/* ---------- Stats band with animated counters ---------- */
function StatsBand() {
  const stats = [
    { to: 12000, suffix: "+", label: "Teams onboarded" },
    { to: 94, suffix: "%", label: "Hallucination reduction" },
    { to: 340, suffix: "ms", label: "P95 retrieval latency" },
    { to: 2400000, suffix: "+", label: "Documents indexed" },
  ];
  return (
    <section className="py-20 md:py-28 px-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#051A24]/10 rounded-3xl overflow-hidden">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={0.08 * i} variant="blur">
            <div className="bg-[#f0f0ee] p-8 md:p-10 h-full">
              <p className="font-mondwest text-[44px] md:text-[64px] leading-[1] text-[#051A24]">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-3 text-sm text-[#273C46]">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- How it works — 3-step with animated arrows ---------- */
function HowItWorks() {
  const steps = [
    { Icon: Upload, kicker: "01 · Ingest", title: "Drop in your sources", desc: "PDFs, scans, ZIP repos, spreadsheets — Viktor parses layout, OCR, and structure in one pass." },
    { Icon: Cpu, kicker: "02 · Reason", title: "Agents do the work", desc: "Query planning, hybrid retrieval, cross-encoder re-ranking, and claim verification — all observable." },
    { Icon: ShieldCheck, kicker: "03 · Trust", title: "Get cited answers", desc: "Every sentence links back to the exact page, cell, or line. Confidence scored, never guessed." },
  ];
  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <Reveal>
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="mt-3 text-[32px] md:text-[52px] leading-[1.02] tracking-tight max-w-2xl">
            Three steps, <span className="font-mondwest text-[#1f5d4f]">zero</span> guessing.
          </h2>
        </Reveal>
        <div className="mt-16 grid md:grid-cols-3 gap-6 md:gap-3 relative">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={0.12 * i} variant="up">
              <div className="relative bg-[#f7f7f5] rounded-3xl p-8 h-full border border-[#051A24]/5 smooth-hover hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(5,26,36,0.18)]">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[#1f5d4f] grid place-items-center">
                  <span className="absolute inset-0 rounded-full bg-[#1f5d4f] animate-pulse-ring" />
                  <s.Icon className="w-4 h-4 text-white relative" />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1f5d4f]">{s.kicker}</p>
                <h3 className="mt-6 font-mondwest text-3xl">{s.title}</h3>
                <p className="mt-3 text-sm text-[#273C46] leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Live demo preview (mock chat with streaming citations) ---------- */
function LiveDemo() {
  const lines = [
    "Decomposed query into 3 sub-questions",
    "Retrieved 247 chunks · BM25 + dense",
    "Re-ranked to top 8 · cross-encoder",
    "Verified 8/8 claims · 0.94 confidence",
    "Ready · 12 inline citations",
  ];
  const [step, setStep] = useState(0);
  const { ref, isVisible } = useInViewAnimation();
  useEffect(() => {
    if (!isVisible) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => (s < lines.length ? s + 1 : s)), 600);
    return () => clearInterval(id);
  }, [isVisible, lines.length]);

  return (
    <section ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-10 items-center">
        <Reveal variant="left">
          <SectionEyebrow>Live pipeline</SectionEyebrow>
          <h2 className="mt-3 text-[32px] md:text-[52px] leading-[1.02] tracking-tight">
            Watch every <span className="font-mondwest text-[#1f5d4f]">decision</span>.
          </h2>
          <p className="mt-6 text-[#273C46] max-w-md">
            Viktor surfaces every retrieval, every score, every verification step. No black box — just trace lines you can audit.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/chat"><PrimaryBtn className="inline-flex items-center gap-2"><PlayCircle className="w-4 h-4" /> Try it now</PrimaryBtn></Link>
            <Link to="/docs"><SecondaryBtn>How it traces</SecondaryBtn></Link>
          </div>
        </Reveal>

        <Reveal variant="right" delay={0.1}>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#1f5d4f]/20 via-[#5cc9b1]/10 to-transparent rounded-[36px] blur-2xl animate-gradient" />
            <div className="relative bg-[#051A24] rounded-[28px] p-7 text-white shadow-[0_40px_80px_-30px_rgba(5,26,36,0.5)]">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#fab005]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#5cc9b1]" />
                <span className="ml-3 text-[11px] font-mono text-white/50">viktor · trace</span>
              </div>
              <div className="mt-5 text-sm font-mono space-y-2.5 min-h-[210px]">
                {lines.map((l, i) => (
                  <div key={i} className={`flex items-start gap-3 transition-all duration-500 ${i < step ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
                    <span className="text-[#5cc9b1] mt-0.5">{i < step - 1 ? "✓" : "›"}</span>
                    <span className={`${i === step - 1 ? "text-white" : "text-white/60"}`}>{l}</span>
                    {i === step - 1 && i < lines.length - 1 && (
                      <span className="ml-auto inline-block w-1.5 h-4 bg-[#5cc9b1] animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
                <div><p className="font-mondwest text-2xl text-[#5cc9b1]">8/8</p><p className="text-[10px] text-white/50 mt-1">verified</p></div>
                <div><p className="font-mondwest text-2xl">0.94</p><p className="text-[10px] text-white/50 mt-1">confidence</p></div>
                <div><p className="font-mondwest text-2xl">340ms</p><p className="text-[10px] text-white/50 mt-1">latency</p></div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Integrations ---------- */
function Integrations() {
  const items = [
    { Icon: Github, name: "GitHub" },
    { Icon: Slack, name: "Slack" },
    { Icon: Database, name: "Postgres" },
    { Icon: Box, name: "Notion" },
    { Icon: Globe, name: "Webhooks" },
    { Icon: GitBranch, name: "Linear" },
    { Icon: Layers, name: "S3" },
    { Icon: Network, name: "Zapier" },
  ];
  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-5 gap-10 items-center">
        <div className="md:col-span-2">
          <Reveal variant="left">
            <SectionEyebrow>Integrations</SectionEyebrow>
            <h2 className="mt-3 text-[32px] md:text-[48px] leading-[1.02] tracking-tight">
              Plays well with <span className="font-mondwest text-[#1f5d4f]">your stack</span>.
            </h2>
            <p className="mt-5 text-[#273C46]">Connect the tools your team already uses — Viktor syncs, indexes, and verifies in the background.</p>
            <Link to="/docs" className="mt-6 inline-flex items-center gap-1 text-sm text-[#1f5d4f] font-medium">See all integrations <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </Reveal>
        </div>
        <div className="md:col-span-3 grid grid-cols-4 gap-px bg-[#051A24]/10 rounded-3xl overflow-hidden">
          {items.map((it, i) => (
            <Reveal key={it.name} delay={0.04 * i} variant="scale">
              <div className="bg-white aspect-square flex flex-col items-center justify-center gap-2 smooth-hover hover:bg-[#f7f7f5] cursor-pointer group">
                <it.Icon className="w-7 h-7 text-[#051A24] group-hover:text-[#1f5d4f] group-hover:scale-110 transition-all duration-500" />
                <span className="text-[11px] text-[#273C46]">{it.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const faqs = [
    ["How is Viktor different from a regular RAG wrapper?", "Most RAG wrappers retrieve and generate. Viktor adds query planning, hybrid retrieval with re-ranking, claim-level verification, and per-answer confidence scoring — every step is observable."],
    ["What formats do you support?", "PDFs, DOCX, scanned images, photos, ZIP code repos, spreadsheets, audio transcripts, and HTML pages. Layout, tables, equations, and figures are preserved."],
    ["Can I use my own LLM?", "Yes. We default to GPT-4o-class models and support Claude, Gemini, and open-weight models on Team and Enterprise plans."],
    ["Is my data used to train models?", "Never. Your data is yours. Per-workspace isolation, encryption at rest, audit logs on every query."],
    ["How accurate are the citations?", "Quote-level alignment between answers and source chunks — citations point to the exact page, paragraph, cell, or line."],
  ];
  return (
    <section className="py-20 md:py-28 px-6 max-w-[1100px] mx-auto">
      <Reveal>
        <SectionEyebrow>Questions</SectionEyebrow>
        <h2 className="mt-3 text-[32px] md:text-[52px] leading-[1.02] tracking-tight">
          Asked, <span className="font-mondwest text-[#1f5d4f]">answered</span>.
        </h2>
      </Reveal>
      <div className="mt-12 divide-y divide-[#051A24]/10 border-y border-[#051A24]/10">
        {faqs.map(([q, a], i) => (
          <Reveal key={q} delay={0.05 * i}>
            <details className="group py-6 cursor-pointer">
              <summary className="flex justify-between items-center list-none gap-6">
                <span className="font-medium text-lg md:text-xl">{q}</span>
                <span className="text-2xl text-[#1f5d4f] transition-transform duration-500 group-open:rotate-45 shrink-0">+</span>
              </summary>
              <p className="mt-4 text-[#273C46] max-w-2xl leading-relaxed">{a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
