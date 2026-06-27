import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, SectionEyebrow, PrimaryBtn, SecondaryBtn } from "@/components/site-chrome";
import {
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  Brain,
  Loader2,
  Lightbulb,
  AlertTriangle,
  GitBranch,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Viktor RAG" },
      { name: "description", content: "Your knowledge base at a glance." },
    ],
  }),
  component: DashboardPage,
});

type Insights = {
  key_topics: string[];
  knowledge_gaps: string[];
  connections: { docs: string[]; theme: string }[];
  briefing: string;
};

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    documents: 0,
    queries: 0,
    sessions: 0,
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (user) {
      loadStats();
      loadInsights();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    const data = await api.getDashboard(user.id);
    setStats({
      documents: data.documents,
      queries: data.queries,
      sessions: data.sessions,
    });
    setActivity(data.recent_activity);
  };

  const loadInsights = async () => {
    if (!user) return;
    try {
      const cached = await api.getInsights(user.id);
      if (cached && cached.briefing) {
        setInsights(cached);
      }
    } catch {
      // No cached insights yet
    }
  };

  const generateInsights = async () => {
    if (!user) return;
    setLoadingInsights(true);
    try {
      const result = await api.generateInsights(user.id);
      setInsights(result);
      toast.success("Insights generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate insights");
    }
    setLoadingInsights(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f5d4f]"></div>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return null;
  }

  const cards = [
    { label: "Documents", value: String(stats.documents), Icon: FileText },
    { label: "Queries", value: String(stats.queries), Icon: MessageSquare },
    { label: "Chat Sessions", value: String(stats.sessions), Icon: Activity },
    { label: "AI Features", value: "5", Icon: Brain },
  ];

  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionEyebrow>Dashboard</SectionEyebrow>
            <h1 className="mt-3 text-[40px] md:text-[56px] leading-[1] tracking-tight">
              Your <span className="font-mondwest text-[#1f5d4f]">knowledge base</span>
              <br />
              at a glance.
            </h1>
          </div>
          <div className="flex gap-3">
            <Link to="/upload">
              <PrimaryBtn>Upload</PrimaryBtn>
            </Link>
            <Link to="/chat">
              <SecondaryBtn>Ask a question</SecondaryBtn>
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((s) => (
            <div key={s.label} className="bg-white rounded-3xl p-6 border border-[#051A24]/5">
              <div className="flex justify-between items-start">
                <p className="text-xs text-[#273C46] uppercase tracking-wide">{s.label}</p>
                <s.Icon className="w-4 h-4 text-[#1f5d4f]" />
              </div>
              <p className="mt-4 font-mondwest text-[44px] leading-none text-[#051A24]">
                {s.value}
              </p>
              <p className="mt-3 text-xs text-[#273C46]">From your workspace</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#051A24]/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#273C46] uppercase tracking-wide">Recent Documents</p>
                <p className="mt-1 text-sm text-[#051A24]">Last uploads</p>
              </div>
              <Activity className="w-5 h-5 text-[#1f5d4f]" />
            </div>
            <div className="mt-8 space-y-4">
              {activity.length === 0 && (
                <p className="text-sm text-[#273C46]/60">
                  Upload your first document to get started.
                </p>
              )}
              {activity.map((a: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-2 border-b border-[#051A24]/5 last:border-0"
                >
                  <FileText className="w-4 h-4 text-[#1f5d4f] shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{a.name}</span>
                  {a.status === "done" && (
                    <button
                      onClick={() => {
                        localStorage.setItem("scope_doc_id", a.id);
                        navigate({ to: "/chat" });
                      }}
                      className="text-xs font-medium bg-[#1f5d4f]/10 text-[#1f5d4f] hover:bg-[#1f5d4f]/20 px-3 py-1 rounded-full transition"
                    >
                      Chat
                    </button>
                  )}
                  <span
                    className={`text-xs font-mono ${a.status === "done" ? "text-[#1f5d4f]" : "text-amber-600"}`}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#051A24] rounded-3xl p-8 text-white">
            <p className="text-xs uppercase tracking-wide text-[#E0EBF0]">RAG Pipeline</p>
            <p className="mt-6 font-mondwest text-5xl">All systems</p>
            <p className="mt-1 text-sm text-[#E0EBF0]">local storage · Groq · operational</p>
            <div className="mt-8 space-y-3 text-sm">
              {[
                ["Storage", "OK"],
                ["Embeddings", "OK"],
                ["Vector Search", "OK"],
                ["LLM", "OK"],
                ["AI Features", "5 active"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-[#E0EBF0]">{k}</span>
                  <span className="text-[#5cc9b1]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── AI Insights Section ──────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1f5d4f] to-[#5cc9b1] flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-[#051A24]">AI Insights</h2>
                <p className="text-xs text-[#273C46]">Cross-document intelligence powered by AI</p>
              </div>
            </div>
            <button
              onClick={generateInsights}
              disabled={loadingInsights || stats.documents === 0}
              className="flex items-center gap-2 bg-[#051A24] text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-[#0D212C] transition disabled:opacity-40"
            >
              {loadingInsights ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : insights ? (
                <>
                  <RefreshCw className="w-4 h-4" /> Refresh
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Insights
                </>
              )}
            </button>
          </div>

          {!insights && !loadingInsights && (
            <div className="bg-gradient-to-br from-[#f0f0ee] to-white rounded-3xl border border-[#051A24]/5 p-10 text-center">
              <Brain className="w-12 h-12 text-[#273C46]/20 mx-auto mb-4" />
              <p className="text-[#273C46] text-sm">
                {stats.documents === 0
                  ? "Upload documents to unlock AI insights"
                  : 'Click "Generate Insights" to analyze your knowledge base'}
              </p>
            </div>
          )}

          {loadingInsights && !insights && (
            <div className="bg-white rounded-3xl border border-[#051A24]/5 p-10 text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full border-4 border-[#1f5d4f]/20 border-t-[#1f5d4f] animate-spin" />
                <Brain className="w-6 h-6 text-[#1f5d4f] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[#273C46] mt-4 animate-pulse">Analyzing your knowledge base...</p>
            </div>
          )}

          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* AI Briefing */}
              <div className="lg:col-span-2 bg-gradient-to-r from-[#051A24] to-[#0D2F3C] rounded-3xl p-8 text-white">
                <p className="text-xs uppercase tracking-wide text-[#5cc9b1] flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3 h-3" /> AI Briefing
                </p>
                <p className="text-lg leading-relaxed text-[#E0EBF0]">{insights.briefing}</p>
              </div>

              {/* Key Topics */}
              <div className="bg-white rounded-3xl p-8 border border-[#051A24]/5">
                <p className="text-xs uppercase tracking-wide text-[#273C46] flex items-center gap-1.5 mb-4">
                  <Lightbulb className="w-3.5 h-3.5 text-[#1f5d4f]" /> Key Topics
                </p>
                {insights.key_topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {insights.key_topics.map((topic, i) => (
                      <span
                        key={i}
                        className="bg-[#1f5d4f]/10 text-[#1f5d4f] px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#273C46]/60">No topics found yet</p>
                )}
              </div>

              {/* Knowledge Gaps */}
              <div className="bg-white rounded-3xl p-8 border border-[#051A24]/5">
                <p className="text-xs uppercase tracking-wide text-[#273C46] flex items-center gap-1.5 mb-4">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Knowledge Gaps
                </p>
                {insights.knowledge_gaps.length > 0 ? (
                  <ul className="space-y-3">
                    {insights.knowledge_gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#051A24]">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#273C46]/60">No gaps identified</p>
                )}
              </div>

              {/* Cross-Document Connections */}
              {insights.connections.length > 0 && (
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#051A24]/5">
                  <p className="text-xs uppercase tracking-wide text-[#273C46] flex items-center gap-1.5 mb-4">
                    <GitBranch className="w-3.5 h-3.5 text-[#1f5d4f]" /> Cross-Document Connections
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {insights.connections.map((conn, i) => (
                      <div key={i} className="bg-[#f0f0ee] rounded-2xl p-5">
                        <p className="text-sm font-medium text-[#051A24] mb-2">
                          {typeof conn === "string" ? conn : conn.theme || "Shared theme"}
                        </p>
                        {typeof conn !== "string" && conn.docs && conn.docs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {conn.docs.map((doc: string, j: number) => (
                              <span
                                key={j}
                                className="text-[10px] bg-white text-[#273C46] px-2 py-0.5 rounded-full border border-[#051A24]/10"
                              >
                                📄 {doc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
