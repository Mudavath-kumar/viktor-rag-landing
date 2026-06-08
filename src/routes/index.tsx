import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FileText, Image as ImageIcon, Code, Table, Brain, Search, ShieldCheck, Quote,
  MessageSquare, Sparkles, TrendingUp, Star, ArrowUpRight, Menu, X, Check, ArrowRight,
  ChevronLeft, ChevronRight,
} from "lucide-react";

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

/* ---------- Hooks ---------- */
function useInViewAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

/* ---------- Reusable ---------- */
const Logo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Viktor RAG">
    <path d="M4 4 L12 20 L20 4" stroke="#051A24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PrimaryBtn = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-[#051A24] text-white rounded-full px-7 py-3 text-[13px] font-medium hover:bg-[#0D212C] transition-all duration-200 shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),0_9px_6px_0_rgba(5,26,36,0.05),0_17px_7px_0_rgba(5,26,36,0.01),0_26px_7px_0_rgba(5,26,36,0),inset_0_2px_8px_0_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
  >
    {children}
  </button>
);

const SecondaryBtn = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-white text-[#051A24] rounded-full px-7 py-3 text-[13px] font-medium hover:shadow-lg transition-all duration-200 shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_30px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
  >
    {children}
  </button>
);

const InvertedBtn = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`bg-white text-[#051A24] rounded-full px-7 py-3 text-[13px] font-medium hover:bg-gray-100 transition-all duration-200 ${className}`}
  >
    {children}
  </button>
);

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useInViewAnimation();
  return (
    <div
      ref={ref}
      className={`${isVisible ? "animate-fade-in-up" : "opacity-0"} ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/* ---------- Page ---------- */
function Index() {
  return (
    <main className="min-h-screen bg-[#f0f0ee] text-[#051A24] antialiased">
      <Navbar />
      <Hero />
      <Marquee />
      <Testimonial />
      <Pricing />
      <Features />
      <TestimonialCarousel />
      <UseCases />
      <CTASection />
      <Footer />
      <Copyright />
      <MobileBottomNav />
    </main>
  );
}

/* ---------- Navbar ---------- */
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Dashboard", "Upload", "Chat", "Analytics"];
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pt-4 sm:pt-6 px-4 sm:px-8 gap-2 sm:gap-3">
      <div className="flex items-center justify-center rounded-full w-10 h-10 sm:w-11 sm:h-11 shrink-0" style={{ backgroundColor: "#EDEDED" }}>
        <Logo className="w-5 h-5" />
      </div>
      <nav className="hidden md:flex items-center gap-4 sm:gap-10 rounded-xl px-4 sm:px-8 py-2.5 sm:py-3" style={{ backgroundColor: "#EDEDED" }}>
        {links.map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="text-[12px] sm:text-[14px] font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200">{l}</a>
        ))}
        <PrimaryBtn className="!text-[12px] !px-5 !py-2">Get Started</PrimaryBtn>
      </nav>
      <button onClick={() => setOpen(true)} className="md:hidden flex items-center justify-center rounded-full w-10 h-10 sm:w-11 sm:h-11 shrink-0" style={{ backgroundColor: "#EDEDED" }} aria-label="Menu">
        <Menu className="w-5 h-5 text-[#051A24]" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-white p-6 flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <Logo className="w-6 h-6" />
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            {links.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-base font-medium text-[#051A24]" onClick={() => setOpen(false)}>{l}</a>
            ))}
            <PrimaryBtn>Get Started</PrimaryBtn>
          </aside>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="bg-gradient-to-b from-transparent via-[#f0f0ee]/50 to-[#f0f0ee] pt-28 md:pt-32 pb-10 sm:pb-16">
      <div className="max-w-[440px] mx-auto px-6 text-center">
        <Reveal delay={0.1}>
          <p className="font-mono text-xs md:text-sm text-[#051A24] mb-2">Multi-Modal Agentic RAG Platform</p>
        </Reveal>
        <Reveal delay={0.2}>
          <h1 className="font-mondwest text-[40px] md:text-[52px] lg:text-[56px] font-semibold text-[#051A24] tracking-tight mb-4">Viktor RAG</h1>
        </Reveal>
        <Reveal delay={0.3}>
          <h2 className="text-[32px] md:text-[40px] lg:text-[44px] leading-[1.1] text-[#0D212C] tracking-tight">
            Understand <span className="font-mondwest">your documents,</span><br />
            verify <span className="font-mondwest">every answer.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.4}>
          <div className="flex flex-col gap-6 mt-5 md:mt-6 text-sm md:text-base text-[#051A24] leading-relaxed text-left">
            <p>Upload PDFs, images, code repositories, and spreadsheets. Our agentic pipeline extracts, chunks, embeds, and retrieves with source-accurate citations.</p>
            <p>Built with LangGraph agents for query understanding, hybrid retrieval, verification, and hallucination detection. Every answer is grounded in your data.</p>
            <p>Enterprise-ready with JWT auth, role-based access, and real-time analytics.</p>
          </div>
        </Reveal>
        <Reveal delay={0.5}>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-5 md:mt-6 justify-center">
            <PrimaryBtn>Start Free Trial</PrimaryBtn>
            <SecondaryBtn>View Documentation</SecondaryBtn>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Marquee ---------- */
const marqueeItems = [
  { Icon: FileText, title: "PDF Processing", desc: "Extract text, tables, and metadata from any PDF document" },
  { Icon: ImageIcon, title: "Image OCR", desc: "PaddleOCR-powered text extraction from images and scans" },
  { Icon: Code, title: "Code Analysis", desc: "Understand repository structure, dependencies, and architecture" },
  { Icon: Table, title: "Spreadsheet Intelligence", desc: "CSV and Excel parsing with semantic table understanding" },
  { Icon: Brain, title: "Agentic Reasoning", desc: "LangGraph-powered multi-agent orchestration" },
  { Icon: Search, title: "Hybrid Retrieval", desc: "Vector + BM25 with reciprocal rank fusion" },
  { Icon: ShieldCheck, title: "Hallucination Guard", desc: "Adaptive verification layer with confidence scoring" },
  { Icon: Quote, title: "Source Citations", desc: "Every answer mapped to exact page, slide, and chunk" },
];

function Marquee() {
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <section className="w-full mt-16 md:mt-20 mb-16 overflow-hidden">
      <div className="flex animate-marquee w-max">
        {doubled.map((item, i) => (
          <div key={i} className="h-[200px] md:h-[280px] w-[300px] md:w-[400px] shrink-0 mx-3 rounded-2xl shadow-lg bg-white p-6 flex flex-col justify-between">
            <item.Icon className="w-8 h-8 text-[#051A24] mb-4" />
            <div>
              <h3 className="text-lg font-semibold text-[#051A24] mb-2">{item.title}</h3>
              <p className="text-sm text-[#273C46]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Testimonial Quote ---------- */
function Testimonial() {
  const imgRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        if (!imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = (vh - rect.top) / (vh + rect.height);
        const o = Math.max(-100, Math.min(200, (progress - 0.5) * 200));
        setOffset(o);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="py-12 px-6 max-w-2xl mx-auto text-center bg-white rounded-[40px] my-12">
      <Reveal delay={0.1}><Quote className="w-6 h-6 text-[#051A24] mx-auto mb-4" /></Reveal>
      <Reveal delay={0.2}>
        <p className="text-[32px] md:text-[40px] lg:text-[44px] leading-[1.1] text-[#0D212C] tracking-tight">
          "We reduced research time by 80% using <span className="font-mondwest">Viktor RAG's</span> agentic verification"
        </p>
      </Reveal>
      <Reveal delay={0.3}>
        <p className="italic text-sm text-[#273C46] mt-6">Dr. Sarah Chen, Research Lead, BioTech Labs</p>
      </Reveal>
      <Reveal delay={0.4}>
        <div className="flex justify-center items-center gap-8 md:gap-12 mt-8 flex-wrap">
          <span className="font-medium text-[#051A24] text-2xl">Stanford</span>
          <span className="font-medium text-[#051A24] text-xl">MIT</span>
          <span className="font-medium text-[#051A24] text-2xl">OpenAI</span>
        </div>
      </Reveal>
      <Reveal delay={0.5}>
        <div ref={imgRef} className="w-full max-w-xs mx-auto rounded-2xl shadow-lg overflow-hidden mt-8" style={{ transform: `translateY(${offset * 0.15}px)` }}>
          <img loading="lazy" alt="Document analysis" className="w-full h-auto" src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260330_103804_7aa5494f-4d5b-432e-9dc7-20715275f143.png&w=1280&q=85" />
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Pricing ---------- */
function Pricing() {
  return (
    <section className="py-12 md:py-20 px-6 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:max-w-4xl md:ml-auto">
        <Reveal delay={0.1}>
          <div className="bg-[#051A24] rounded-[40px] pl-10 pr-10 md:pr-24 pt-3 pb-10 shadow-[inset_0_2px_8px_rgba(255,255,255,0.1)] h-full">
            <p className="text-[#E0EBF0] text-xs font-mono mt-6">STARTER</p>
            <h3 className="text-[22px] font-medium text-[#F6FCFF] mt-2">Starter</h3>
            <p className="text-sm text-[#E0EBF0] mt-2">Perfect for individual researchers<br/>1,000 queries per month</p>
            <p className="mt-6"><span className="text-4xl font-bold text-[#F6FCFF]">$49</span><span className="text-sm text-[#E0EBF0]">/month</span></p>
            <ul className="mt-6 space-y-3 text-sm text-[#E0EBF0]">
              {["PDF, DOCX, TXT support", "Basic citations", "Community support"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-[#14B8A6]" />{f}</li>
              ))}
            </ul>
            <div className="mt-8"><InvertedBtn>Start Free Trial</InvertedBtn></div>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="bg-white rounded-[40px] pl-10 pr-10 md:pr-24 pt-3 pb-10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] h-full">
            <p className="text-[#273C46] text-xs font-mono mt-6">ENTERPRISE</p>
            <h3 className="text-[22px] font-medium text-[#051A24] mt-2">Enterprise</h3>
            <p className="text-sm text-[#273C46] mt-2">For teams that need verification<br/>Unlimited queries</p>
            <p className="mt-6"><span className="text-4xl font-bold text-[#0D212C]">Custom</span> <span className="text-sm text-[#273C46]">Contact us</span></p>
            <ul className="mt-6 space-y-3 text-sm text-[#051A24]">
              {["All file types including ZIP repos","Agentic verification layer","Hybrid retrieval + reranking","SSO & role-based access","Dedicated support"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" />{f}</li>
              ))}
            </ul>
            <div className="mt-8"><PrimaryBtn>Contact Sales</PrimaryBtn></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Features ---------- */
const features = [
  { Icon: MessageSquare, color: "text-blue-500", title: "Query Understanding Agent", desc: "Classifies intent and determines optimal retrieval strategy" },
  { Icon: Search, color: "text-teal-500", title: "Hybrid Retrieval", desc: "Vector search + BM25 with reciprocal rank fusion" },
  { Icon: ShieldCheck, color: "text-emerald-500", title: "Claim Verification", desc: "Detects unsupported claims and hallucinations in real-time" },
  { Icon: Quote, color: "text-amber-500", title: "Source Citations", desc: "Maps every answer to exact file, page, and chunk IDs" },
  { Icon: Sparkles, color: "text-purple-500", title: "Response Generation", desc: "Synthesizes verified information into coherent answers" },
  { Icon: TrendingUp, color: "text-rose-500", title: "Confidence Score", desc: "0-100 score based on retrieval similarity and verification" },
];

function Features() {
  return (
    <section className="py-12 md:py-20 px-6 max-w-[1200px] mx-auto">
      <Reveal>
        <h2 className="text-[28px] md:text-[36px] lg:text-[40px] leading-[1.15] text-[#0D212C] tracking-tight mb-3">
          Agentic <span className="font-mondwest">Architecture</span>
        </h2>
        <p className="text-sm text-[#273C46] mb-12">Five specialized agents working in concert</p>
      </Reveal>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={0.1 * (i % 3)}>
            <div className="bg-white rounded-[32px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-8 hover:shadow-lg transition-shadow duration-300 h-full">
              <f.Icon className={`w-10 h-10 ${f.color} mb-4`} />
              <h3 className="text-[22px] font-medium text-[#051A24] mb-2">{f.title}</h3>
              <p className="text-sm text-[#273C46]">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Testimonial Carousel ---------- */
const testimonials = [
  { quote: "The verification agent caught hallucinations our previous RAG system missed entirely. Game changer for compliance.", name: "Marcus Anderson", role: "CTO, DataFlow" },
  { quote: "We deployed Viktor RAG for our documentation. The source citations alone saved our support team 20 hours a week.", name: "Alex Wu", role: "Founder, Nexgate" },
  { quote: "Hybrid retrieval found relevant chunks that pure vector search missed. The BM25 fusion is genuinely better.", name: "James Mitchell", role: "VP Engineering, LaunchPad" },
  { quote: "The code repository analysis understood our architecture better than our own docs. Incredible depth.", name: "Rachel Foster", role: "Co-founder, Nexus Labs" },
  { quote: "From PDFs to ZIP repositories, it handles everything we throw at it. The confidence scores keep our users informed.", name: "David Zhang", role: "Head of AI, Paradigm Labs" },
];

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const i = setInterval(() => setIdx((p) => (p + 1) % testimonials.length), 3000);
    return () => clearInterval(i);
  }, [paused]);
  const tripled = [...testimonials, ...testimonials, ...testimonials];
  return (
    <section className="py-20 bg-[#f0f0ee]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="md:max-w-4xl md:ml-auto px-6 flex items-end justify-between mb-10">
        <h2 className="text-[28px] md:text-[36px] leading-[1.15] text-[#0D212C] tracking-tight">
          What <span className="font-mondwest">teams</span> say
        </h2>
        <div className="flex items-center gap-2">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-black text-black" />)}
          <span className="text-sm font-medium ml-2">G2 5/5</span>
        </div>
      </div>
      <div className="overflow-hidden px-6">
        <div className="flex gap-6 transition-transform duration-[800ms]" style={{ transform: `translateX(calc(-${idx} * (427.5px + 24px)))`, transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}>
          {tripled.map((t, i) => (
            <div key={i} className="w-[calc(100vw-48px)] md:w-[427.5px] shrink-0 bg-white rounded-[32px] md:rounded-[40px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] px-6 md:pl-10 md:pr-16 py-8">
              <svg width="32" height="24" viewBox="0 0 32 24" className="text-[#051A24] mb-4" fill="currentColor"><path d="M0 24V14C0 6.5 4.5 1 12 0v4C8 5 6 7.5 6 11h6v13H0zm18 0V14c0-7.5 4.5-13 12-14v4c-4 1-6 3.5-6 7h6v13H18z"/></svg>
              <p className="text-base text-[#0D212C] leading-relaxed">{t.quote}</p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-12 h-12 rounded-full bg-[#EDEDED]" />
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-[#273C46] text-sm flex items-center gap-1"><ArrowRight className="w-3 h-3" />{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-8">
        <button onClick={() => setIdx((p) => (p - 1 + testimonials.length) % testimonials.length)} className="w-12 h-12 rounded-full border border-[#0D212C]/20 flex items-center justify-center hover:bg-[#051A24] hover:text-white transition-all" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={() => setIdx((p) => (p + 1) % testimonials.length)} className="w-12 h-12 rounded-full border border-[#0D212C]/20 flex items-center justify-center hover:bg-[#051A24] hover:text-white transition-all" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </section>
  );
}

/* ---------- Use Cases ---------- */
const useCases = [
  { name: "Legal Document Analysis", desc: "Process case files, extract precedents, verify citations across thousands of pages", media: "https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif" },
  { name: "Code Repository Intelligence", desc: "Understand architecture, map dependencies, generate API documentation automatically", media: "https://motionsites.ai/assets/hero-automation-machines-preview-DlTveRIN.gif" },
  { name: "Research Paper Synthesis", desc: "Cross-reference findings, detect contradictory claims, generate literature reviews", media: "https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif" },
];

function UseCases() {
  return (
    <section className="max-w-[1200px] mx-auto px-6 py-12 md:py-20">
      <Reveal>
        <h2 className="text-[28px] md:text-[36px] leading-[1.15] text-[#0D212C] tracking-tight mb-12">
          Real-world <span className="font-mondwest">deployments</span>
        </h2>
      </Reveal>
      <div className="flex flex-col gap-16 md:gap-20">
        {useCases.map((u) => (
          <Reveal key={u.name}>
            <div>
              <div className="ml-6 md:ml-28 mb-6">
                <h3 className="font-mondwest text-2xl md:text-3xl font-semibold text-[#051A24]">{u.name}</h3>
                <p className="text-sm md:text-base text-[#051A24]/70 mt-2">{u.desc}</p>
              </div>
              <img loading="lazy" src={u.media} alt={u.name} className="w-full rounded-2xl shadow-lg object-cover h-[300px] md:h-[500px]" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- CTA Section ---------- */
const ctaIcons = [FileText, ImageIcon, Code, Brain, Search, ShieldCheck, Quote, Sparkles];
type Spawn = { id: number; x: number; y: number; rot: number; Icon: typeof FileText };

function CTASection() {
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const lastRef = useRef(0);
  const idRef = useRef(0);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = performance.now();
    if (now - lastRef.current < 80) return;
    lastRef.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    const Icon = ctaIcons[Math.floor(Math.random() * ctaIcons.length)];
    const s: Spawn = { id: ++idRef.current, x: e.clientX - rect.left, y: e.clientY - rect.top, rot: Math.random() * 20 - 10, Icon };
    setSpawns((prev) => [...prev, s]);
    setTimeout(() => setSpawns((prev) => prev.filter((p) => p.id !== s.id)), 1000);
  };
  return (
    <section className="py-12 md:py-20 px-6">
      <div onMouseMove={onMove} className="max-w-7xl mx-auto bg-white rounded-[40px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-24 md:py-48 relative overflow-hidden">
        {spawns.map((s) => (
          <s.Icon key={s.id} className="w-6 h-6 text-[#051A24]/40 absolute pointer-events-none transition-all duration-1000" style={{ left: s.x, top: s.y, transform: `translate(-50%,-50%) rotate(${s.rot}deg) scale(0.5)`, opacity: 0 }} />
        ))}
        <div className="relative text-center">
          <h2 className="font-mondwest text-[48px] md:text-[64px] lg:text-[80px] text-[#0D212C] mb-12 leading-[1.05]">Ready to ground your AI?</h2>
          <button className="inline-flex items-center gap-3 bg-[#051A24] text-white rounded-full pl-2 pr-6 py-2 text-[14px] font-medium hover:bg-[#0D212C] transition-all">
            <img src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" alt="" className="w-10 h-10 rounded-full object-cover" />
            Chat with our team
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  const cols = [
    { title: "Product", items: ["Features", "Pricing", "Documentation", "API Reference"] },
    { title: "Company", items: ["About", "Blog", "Careers", "Contact"] },
    { title: "Legal", items: ["Privacy", "Terms", "Security"] },
  ];
  return (
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
                    <li key={it}><a href="#" className="text-base text-[#051A24] hover:opacity-70 transition-opacity duration-200">{it}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function Copyright() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-4 border-t border-[#051A24]/10 flex flex-col sm:flex-row justify-between items-center gap-2">
      <p className="text-sm text-[#051A24]">© 2026 Viktor RAG. All rights reserved.</p>
      <p className="text-sm text-[#273C46]">Built with LangGraph & Qdrant</p>
    </div>
  );
}

function MobileBottomNav() {
  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full px-6 py-2 shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_30px_rgba(0,0,0,0.08)] flex items-center gap-4">
      <span className="font-mondwest text-2xl font-semibold text-[#051A24]">V</span>
      <PrimaryBtn className="!text-[13px] !px-5 !py-2">Start a chat</PrimaryBtn>
    </div>
  );
}
