import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { PageShell, SectionEyebrow } from "@/components/site-chrome";
import {
  Upload as UploadIcon,
  FileText,
  Image as ImageIcon,
  Code,
  Table,
  Check,
  Loader2,
  Trash2,
  MessageSquare,
  Sparkles,
  Brain,
  Tag,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — Viktor RAG" },
      {
        name: "description",
        content: "Upload documents to your knowledge base.",
      },
    ],
  }),
  component: UploadPage,
});

type Item = {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  tags?: string[];
  category?: string;
};

const formats = [
  { Icon: FileText, label: "PDF · DOCX · TXT · MD" },
  { Icon: ImageIcon, label: "PNG · JPG · SVG" },
  { Icon: Code, label: "ZIP repos · .py · .ts" },
  { Icon: Table, label: "CSV · XLSX" },
];

function UploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, any>>({});
  const [taggingId, setTaggingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasProcessingRef = useRef(false);

  // Load docs on mount, then poll every 3s while any doc is processing
  useEffect(() => {
    if (!user) return;
    loadDocuments();

    const interval = setInterval(() => {
      if (hasProcessingRef.current) {
        loadDocuments();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    try {
      const { documents } = await api.getDocuments(user.id);
      const mapped = documents.map((d: any) => ({
        id: d.id,
        name: d.name,
        size: d.size,
        type: d.type,
        status: d.status,
        tags: d.tags,
        category: d.category,
      }));
      setItems(mapped);
      hasProcessingRef.current = mapped.some((it) => it.status === "processing" || it.status === "uploading");
    } catch (e) {
      console.error("Failed to load documents", e);
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const tempId = "tmp-" + Date.now();
      setItems((p) => [
        {
          id: tempId,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          type: file.name.split(".").pop()?.toUpperCase() || "FILE",
          status: "uploading",
        },
        ...p,
      ]);
      try {
        const { document } = await api.upload(user.id, file);
        setItems((p) =>
          p.map((it) => (it.id === tempId ? { ...it, id: document.id, status: "processing" } : it)),
        );
        toast.success(`${file.name} uploaded successfully! Indexing in background...`);
      } catch (e: any) {
        setItems((p) => p.map((it) => (it.id === tempId ? { ...it, status: "error" } : it)));
        toast.error(e.message || `Failed: ${file.name}`);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (it: Item) => {
    if (!user) return;
    setDeletingId(it.id);
    try {
      await api.deleteDocument(user.id, it.id);
      setItems((p) => p.filter((x) => x.id !== it.id));
      toast.success(`${it.name} deleted`);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete document");
    }
    setDeletingId(null);
  };

  const handleChat = (it: Item) => {
    localStorage.setItem("scope_doc_id", it.id);
    navigate({ to: "/chat" });
  };

  const handleSummarize = async (it: Item) => {
    if (!user) return;
    setSummarizingId(it.id);
    try {
      const result = await api.summarize(user.id, it.id);
      setSummaries((p) => ({ ...p, [it.id]: result }));
      setExpandedSummary(it.id);
      // Update tags if returned
      if (result.tags) {
        setItems((p) =>
          p.map((x) =>
            x.id === it.id ? { ...x, tags: result.tags, category: result.category } : x,
          ),
        );
      }
      toast.success("Summary generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate summary");
    }
    setSummarizingId(null);
  };

  const handleGenerateTags = async (it: Item) => {
    if (!user) return;
    setTaggingId(it.id);
    try {
      const result = await api.generateTags(user.id, it.id);
      setItems((p) =>
        p.map((x) => (x.id === it.id ? { ...x, tags: result.tags, category: result.category } : x)),
      );
      toast.success("Tags generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate tags");
    }
    setTaggingId(null);
  };

  const handleQuiz = (it: Item) => {
    navigate({ to: "/quiz", search: { docId: it.id, docName: it.name } });
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

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-24">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <SectionEyebrow>Upload</SectionEyebrow>
            <h1 className="mt-3 text-[40px] md:text-[60px] leading-[1] tracking-tight">
              Drop it in. <span className="font-mondwest text-[#1f5d4f]">We'll read</span> the rest.
            </h1>
            <p className="mt-6 text-[#273C46] max-w-xl">
              Documents are parsed, chunked, embedded locally with sentence-transformers, and
              indexed for semantic retrieval.
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                onFiles(e.dataTransfer.files);
              }}
              onClick={() => !uploading && inputRef.current?.click()}
              className={`mt-10 cursor-pointer rounded-[28px] border-2 border-dashed p-12 text-center transition-all ${drag ? "border-[#1f5d4f] bg-[#1f5d4f]/5" : "border-[#051A24]/15 bg-white hover:border-[#1f5d4f]/40"} ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              {uploading ? (
                <Loader2 className="w-10 h-10 text-[#1f5d4f] mx-auto animate-spin" />
              ) : (
                <UploadIcon className="w-10 h-10 text-[#1f5d4f] mx-auto" />
              )}
              <p className="mt-4 text-lg font-medium">
                {uploading ? "Uploading & indexing..." : "Drop files or click to browse"}
              </p>
              <p className="mt-2 text-sm text-[#273C46]">PDF, DOCX, TXT, MD supported</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
                accept=".pdf,.docx,.txt,.md,.csv"
                disabled={uploading}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {formats.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-[#051A24]/5"
                >
                  <f.Icon className="w-4 h-4 text-[#1f5d4f]" />
                  <span className="text-xs text-[#273C46]">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[#051A24]/5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-wide text-[#273C46] font-semibold">
                  Documents
                </p>
                <div className="flex items-center gap-2">
                  {doneCount > 0 && (
                    <span className="text-xs text-[#1f5d4f] bg-[#1f5d4f]/10 px-2 py-0.5 rounded-full">
                      {doneCount} indexed
                    </span>
                  )}
                  <button
                    onClick={loadDocuments}
                    title="Refresh document statuses"
                    className="p-1 rounded-lg text-[#273C46]/60 hover:text-[#1f5d4f] hover:bg-[#1f5d4f]/10 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <ul className="space-y-3">
                {items.length === 0 && (
                  <p className="text-xs text-[#273C46]/60">No documents yet</p>
                )}
                {items.map((it) => (
                  <li key={it.id} className="rounded-2xl border border-[#051A24]/5 overflow-hidden">
                    <div className="flex items-center gap-3 p-3 hover:bg-[#f0f0ee]/60 transition">
                      <div className="w-10 h-10 rounded-xl bg-[#f0f0ee] flex items-center justify-center text-[10px] font-mono text-[#1f5d4f] shrink-0">
                        {it.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{it.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-[#273C46]">{it.size}</p>
                          {it.category && (
                            <span className="text-[10px] bg-[#051A24]/8 text-[#051A24] px-1.5 py-0.5 rounded-full">
                              {it.category}
                            </span>
                          )}
                        </div>
                        {/* Tags */}
                        {it.tags && it.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {it.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-[#1f5d4f]/10 text-[#1f5d4f] px-2 py-0.5 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {it.status === "done" && (
                          <>
                            <button
                              onClick={() => handleSummarize(it)}
                              disabled={summarizingId === it.id}
                              title="AI Summarize"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition disabled:opacity-40"
                            >
                              {summarizingId === it.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleQuiz(it)}
                              title="AI Quiz"
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                            >
                              <Brain className="w-3.5 h-3.5" />
                            </button>
                            {!it.tags?.length && (
                              <button
                                onClick={() => handleGenerateTags(it)}
                                disabled={taggingId === it.id}
                                title="Auto Tag"
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition disabled:opacity-40"
                              >
                                {taggingId === it.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Tag className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleChat(it)}
                              title="Chat with this document"
                              className="p-1.5 rounded-lg text-[#1f5d4f] hover:bg-[#1f5d4f]/10 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(it)}
                              disabled={deletingId === it.id}
                              title="Delete document"
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition disabled:opacity-40"
                            >
                              {deletingId === it.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <Check className="w-4 h-4 text-[#1f5d4f]" />
                          </>
                        )}
                        {it.status === "uploading" && (
                          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                        )}
                        {it.status === "processing" && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                            <span className="text-[10px] font-mono text-amber-600 font-medium">
                              INDEXING
                            </span>
                          </div>
                        )}
                        {it.status === "error" && (
                          <>
                            <button
                              onClick={() => handleDelete(it)}
                              title="Remove failed document"
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono text-red-500">ERROR</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expandable AI Summary */}
                    {expandedSummary === it.id && summaries[it.id] && (
                      <div className="border-t border-[#051A24]/5 bg-gradient-to-b from-[#f0f0ee]/50 to-white p-4 space-y-3 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#1f5d4f] flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> AI Summary
                          </p>
                          <button
                            onClick={() => setExpandedSummary(null)}
                            className="p-1 rounded-lg hover:bg-[#051A24]/5"
                          >
                            <X className="w-3 h-3 text-[#273C46]" />
                          </button>
                        </div>
                        {summaries[it.id].tldr && (
                          <div className="bg-[#1f5d4f]/8 rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-wide text-[#1f5d4f] font-semibold mb-1">
                              TL;DR
                            </p>
                            <p className="text-sm text-[#051A24] leading-relaxed">
                              {summaries[it.id].tldr}
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-[#273C46] leading-relaxed">
                          {summaries[it.id].summary}
                        </p>
                        {summaries[it.id].key_points?.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-[#273C46] font-semibold mb-1.5">
                              Key Points
                            </p>
                            <ul className="space-y-1">
                              {summaries[it.id].key_points.map((kp: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-[#051A24] flex items-start gap-2"
                                >
                                  <span className="text-[#1f5d4f] mt-0.5">•</span>
                                  {kp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summaries[it.id].topics?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {summaries[it.id].topics.map((t: string, i: number) => (
                              <span
                                key={i}
                                className="text-[10px] bg-[#051A24]/8 text-[#051A24] px-2 py-0.5 rounded-full"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Toggle summary if cached */}
                    {summaries[it.id] && expandedSummary !== it.id && (
                      <button
                        onClick={() => setExpandedSummary(it.id)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-[#1f5d4f] font-medium hover:bg-[#f0f0ee]/50 transition border-t border-[#051A24]/5"
                      >
                        <ChevronDown className="w-3 h-3" /> Show Summary
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
