import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell, SectionEyebrow } from "@/components/site-chrome";
import {
  LogOut,
  User,
  Mail,
  FileText,
  MessageSquare,
  BarChart2,
  Trash2,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Viktor RAG" },
      { name: "description", content: "Manage your Viktor RAG account and settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ documents: 0, queries: 0, sessions: 0 });
  const [documents, setDocuments] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [dash, docs] = await Promise.all([api.getDashboard(user.id), api.getDocuments(user.id)]);
    setStats({ documents: dash.documents, queries: dash.queries, sessions: dash.sessions });
    setDocuments(docs.documents ?? []);
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
    toast.success("Logged out");
  };

  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!user) return;
    setDeletingId(docId);
    try {
      await api.deleteDocument(user.id, docId);
      setDocuments((p) => p.filter((d) => d.id !== docId));
      toast.success(`${docName} deleted`);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
    setDeletingId(null);
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

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-24">
        <SectionEyebrow>Account</SectionEyebrow>
        <h1 className="mt-3 text-[40px] md:text-[60px] leading-[1] tracking-tight mb-10">
          Your <span className="font-mondwest text-[#1f5d4f]">Profile</span>
        </h1>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left column — user info */}
          <div className="lg:col-span-4 space-y-5">
            {/* Avatar card */}
            <div className="bg-white rounded-3xl p-8 border border-[#051A24]/5 text-center">
              <div className="w-20 h-20 rounded-full bg-[#051A24] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {initials}
              </div>
              <p className="text-sm text-[#273C46] flex items-center justify-center gap-2 break-all">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {user.email}
              </p>
              <p className="mt-2 text-xs text-[#273C46]/50 flex items-center justify-center gap-1">
                <User className="w-3 h-3" /> User ID:{" "}
                <span className="font-mono">{user.id?.slice(0, 8)}…</span>
              </p>
              <button
                onClick={handleLogout}
                className="mt-6 w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-full px-5 py-2.5 text-sm font-medium transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-3xl p-6 border border-[#051A24]/5">
              <p className="text-xs uppercase tracking-wide text-[#273C46] font-semibold mb-4">
                Account Stats
              </p>
              <div className="space-y-3">
                {[
                  { Icon: FileText, label: "Documents", value: stats.documents },
                  { Icon: MessageSquare, label: "Sessions", value: stats.sessions },
                  { Icon: BarChart2, label: "Total Queries", value: stats.queries },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-[#273C46] flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#1f5d4f]" /> {label}
                    </span>
                    <span className="text-lg font-semibold text-[#051A24]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan badge */}
            <div className="bg-[#051A24] rounded-3xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#1f5d4f]" />
                <p className="text-sm font-semibold">Free Plan</p>
              </div>
              <p className="text-xs text-white/50">
                Powered by Groq + local embeddings. No usage limits on indexing.
              </p>
              <Link
                to="/pricing"
                className="mt-4 inline-block text-xs text-[#1f5d4f] hover:underline"
              >
                View plans →
              </Link>
            </div>
          </div>

          {/* Right column — documents */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl p-6 border border-[#051A24]/5">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs uppercase tracking-wide text-[#273C46] font-semibold">
                  My Documents
                </p>
                <Link to="/upload" className="text-xs text-[#1f5d4f] hover:underline">
                  + Upload new
                </Link>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-[#273C46]/20 mx-auto mb-3" />
                  <p className="text-sm text-[#273C46]/60">No documents yet.</p>
                  <Link
                    to="/upload"
                    className="mt-3 inline-block text-sm text-[#1f5d4f] hover:underline"
                  >
                    Upload your first document →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-4 p-3 rounded-2xl border border-[#051A24]/5 hover:border-[#1f5d4f]/20 transition group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#f0f0ee] flex items-center justify-center text-[10px] font-mono text-[#1f5d4f] shrink-0">
                        {doc.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-[#051A24]">{doc.name}</p>
                        <p className="text-xs text-[#273C46]/60">
                          {doc.size} · {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${doc.status === "done" ? "bg-[#1f5d4f]/10 text-[#1f5d4f]" : doc.status === "error" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}
                        >
                          {doc.status}
                        </span>
                        {doc.status === "done" && (
                          <Link
                            to="/chat"
                            onClick={() => localStorage.setItem("scope_doc_id", doc.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#1f5d4f] hover:bg-[#1f5d4f]/10 transition"
                            title="Chat with this file"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.name)}
                          disabled={deletingId === doc.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition disabled:opacity-40"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
