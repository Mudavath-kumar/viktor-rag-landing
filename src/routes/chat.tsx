import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { PageShell } from "@/components/site-chrome";
import {
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Search,
  Pencil,
  Check,
  X,
  Download,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Brain,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Viktor RAG" },
      { name: "description", content: "Ask questions across your documents." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: "user" | "assistant"; content: string; created_at: string };
type Session = {
  id: string;
  title: string;
  created_at: string;
  document_id?: string;
  document_name?: string;
};

function ChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Voice Chat state
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Document Summary state
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);

  // Clear summary when active session changes
  useEffect(() => {
    setSummary(null);
    setShowSummaryPanel(false);
  }, [activeId]);

  const handleSummarize = async (docId: string) => {
    setLoadingSummary(true);
    setShowSummaryPanel(true);
    try {
      // First try to get existing summary
      let res = await api.getSummary(docId);
      if (!res.summary) {
        // If not summarized yet, trigger summarization
        toast.info("Analyzing document and generating summary...");
        res = await api.summarize(user!.id, docId);
      }
      setSummary(res);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate summary");
      setShowSummaryPanel(false);
    }
    setLoadingSummary(false);
  };

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleMic = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const speakText = useCallback(
    (text: string) => {
      if (!ttsEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      // Strip markdown bold markers
      const clean = text.replace(/\*\*/g, "").replace(/`/g, "");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = navigator.language || "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled],
  );

  useEffect(() => {
    if (user) {
      loadSessions();
      loadDocuments().then((docsList) => {
        const scopeDocId = localStorage.getItem("scope_doc_id");
        if (scopeDocId) {
          localStorage.removeItem("scope_doc_id");
          setSelectedDocId(scopeDocId);
          newChat(scopeDocId, docsList);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingSessionId]);

  const loadSessions = async () => {
    if (!user) return;
    const { sessions: s } = await api.getSessions(user.id);
    setSessions(s ?? []);
  };

  const loadDocuments = async () => {
    if (!user) return [];
    try {
      const { documents: d } = await api.getDocuments(user.id);
      setDocuments(d ?? []);
      return d ?? [];
    } catch (e) {
      return [];
    }
  };

  const selectSession = async (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    setEditingSessionId(null);
    const { messages: m } = await api.getMessages(id);
    setMessages(m ?? []);
  };

  const newChat = async (docId?: string, docsList?: any[]) => {
    if (!user) return;
    const scopeId: string | undefined =
      docId || (selectedDocId === "all" ? undefined : selectedDocId);
    let scopeName: string | undefined;
    if (scopeId) {
      const activeList = docsList || documents;
      const d = activeList.find((doc: any) => doc.id === scopeId);
      if (d) scopeName = d.name;
    }
    const { session } = await api.createSession(user.id, scopeId, scopeName);
    if (session) {
      setSessions((p) => [session, ...p]);
      setActiveId(session.id);
      setMessages([]);
    }
  };

  const ask = async (q: string) => {
    if (!q.trim() || !user) return;
    const userId = user.id;
    let sid = activeId;
    if (!sid) {
      const scopeId: string | undefined = selectedDocId === "all" ? undefined : selectedDocId;
      let scopeName: string | undefined;
      if (scopeId) {
        const d = documents.find((doc: any) => doc.id === scopeId);
        if (d) scopeName = d.name;
      }
      const { session } = await api.createSession(userId, scopeId, scopeName);
      if (!session) return;
      sid = session.id;
      setSessions((p) => [session, ...p]);
      setActiveId(session.id);
    }
    setMessages((p) => [
      ...p,
      { id: "u-" + Date.now(), role: "user", content: q, created_at: new Date().toISOString() },
    ]);
    setInput("");
    setSending(true);
    try {
      const { message } = await api.sendMessage(sid!, userId, q);
      if (message) {
        setMessages((p) => [...p, message]);
        // Auto-speak AI response if TTS is enabled
        if (ttsEnabled && message.content) {
          speakText(message.content);
        }
      }
      loadSessions();
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    }
    setSending(false);
  };

  const removeSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    await api.deleteSession(id, user.id);
    setSessions((p) => p.filter((s) => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const startRename = (e: React.MouseEvent, s: Session) => {
    e.stopPropagation();
    setEditingSessionId(s.id);
    setEditTitle(s.title);
  };

  const commitRename = async (sessionId: string) => {
    if (!user || !editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      await api.renameSession(sessionId, user.id, editTitle.trim());
      setSessions((p) =>
        p.map((s) => (s.id === sessionId ? { ...s, title: editTitle.trim() } : s)),
      );
    } catch {
      toast.error("Failed to rename session");
    }
    setEditingSessionId(null);
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    const session = sessions.find((s) => s.id === activeId);
    const lines = messages.map(
      (m) => `[${m.role.toUpperCase()}] ${new Date(m.created_at).toLocaleString()}\n${m.content}`,
    );
    const text = `Chat Export: ${session?.title || "Conversation"}\n${"=".repeat(60)}\n\n${lines.join("\n\n---\n\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session?.title?.replace(/[^a-z0-9]/gi, "_") || "chat"}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chat exported!");
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

  const activeSession = sessions.find((s) => s.id === activeId);
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <PageShell>
      <section className="px-6 max-w-[1200px] mx-auto pb-20">
        <div className="flex gap-8 items-start">
          {/* Sidebar */}
          <aside
            className={`${sidebarOpen ? "block" : "hidden"} lg:block w-72 shrink-0 sticky top-32 space-y-3`}
          >
            <button
              onClick={() => newChat()}
              className="w-full flex items-center gap-2 bg-[#051A24] text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-[#0D212C] transition"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>

            {/* Scope selector */}
            <div className="bg-white rounded-2xl border border-[#051A24]/5 p-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-[#273C46] font-semibold">
                New Chat Scope
              </p>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full rounded-xl border border-[#051A24]/10 bg-[#f0f0ee] px-3 py-2 text-sm text-[#051A24] focus:outline-none focus:ring-2 focus:ring-[#1f5d4f]"
              >
                <option value="all">📂 All Documents</option>
                {documents
                  .filter((d: any) => d.status === "done")
                  .map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      📄 {doc.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#273C46]/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#051A24]/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#1f5d4f] placeholder:text-[#273C46]/40"
              />
            </div>

            {/* Session history */}
            <div className="bg-white rounded-2xl border border-[#051A24]/5 p-3 max-h-[50vh] overflow-y-auto">
              <p className="text-xs uppercase tracking-wide text-[#273C46] mb-2 px-1">History</p>
              {filteredSessions.length === 0 && (
                <p className="text-xs text-[#273C46]/60 px-1">
                  {searchQuery ? "No matches found" : "No conversations yet"}
                </p>
              )}
              <ul className="space-y-0.5">
                {filteredSessions.map((s) => (
                  <li key={s.id}>
                    {editingSessionId === s.id ? (
                      <div className="flex items-center gap-1 px-2 py-1">
                        <input
                          ref={editInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(s.id);
                            if (e.key === "Escape") setEditingSessionId(null);
                          }}
                          className="flex-1 text-sm rounded-lg border border-[#1f5d4f]/40 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1f5d4f]"
                        />
                        <button
                          onClick={() => commitRename(s.id)}
                          className="text-[#1f5d4f] hover:text-[#1f5d4f]/80"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="text-[#273C46]/60 hover:text-[#273C46]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => selectSession(s.id)}
                        className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-colors group ${activeId === s.id ? "bg-[#f0f0ee] text-[#051A24] font-medium" : "text-[#273C46] hover:bg-[#f0f0ee]"}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1">{s.title}</span>
                        <span className="hidden group-hover:flex items-center gap-0.5">
                          <button
                            onClick={(e) => startRename(e, s)}
                            className="p-0.5 rounded hover:text-[#051A24]"
                            title="Rename"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => removeSession(e, s.id)}
                            className="p-0.5 rounded hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main chat area */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mb-4 text-sm text-[#1f5d4f] font-medium"
            >
              {sidebarOpen ? "Close history" : "Show history"}
            </button>

            <div className="bg-white rounded-[28px] border border-[#051A24]/5 flex flex-col h-[76vh] min-h-[560px] overflow-hidden">
              {/* Header bar */}
              {activeId && activeSession && (
                <div className="px-5 py-3 border-b border-[#051A24]/10 bg-[#f0f0ee]/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {activeSession.document_name ? (
                      <span className="text-xs bg-[#1f5d4f]/10 text-[#1f5d4f] rounded-full px-2.5 py-0.5 font-medium shrink-0">
                        📄 {activeSession.document_name}
                      </span>
                    ) : (
                      <span className="text-xs bg-[#051A24]/10 text-[#051A24] rounded-full px-2.5 py-0.5 font-medium shrink-0">
                        📂 All Docs
                      </span>
                    )}
                    <span className="text-xs text-[#273C46] truncate">{activeSession.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeSession.document_id && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSummarize(activeSession.document_id!)}
                          title="Summarize document"
                          className="flex items-center gap-1.5 text-xs text-[#1f5d4f] hover:bg-[#1f5d4f]/10 shrink-0 px-2.5 py-1.5 rounded-lg border border-[#1f5d4f]/20 transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Summarize
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/quiz",
                              search: {
                                docId: activeSession.document_id,
                                docName: activeSession.document_name || "Document",
                              },
                            })
                          }
                          title="Generate quiz from document"
                          className="flex items-center gap-1.5 text-xs text-[#051A24] hover:bg-[#051A24]/5 shrink-0 px-2.5 py-1.5 rounded-lg border border-[#051A24]/10 transition cursor-pointer"
                        >
                          <Brain className="w-3.5 h-3.5" /> Take Quiz
                        </button>
                      </>
                    )}
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={exportChat}
                        title="Export conversation"
                        className="flex items-center gap-1.5 text-xs text-[#273C46] hover:text-[#051A24] shrink-0 px-2.5 py-1.5 rounded-lg hover:bg-[#051A24]/5 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Export
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Document Summary Panel */}
              {showSummaryPanel && activeSession?.document_id && (
                <div className="bg-[#1f5d4f]/5 border-b border-[#1f5d4f]/20 p-5 space-y-4 animate-fade-in-up shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#1f5d4f] animate-pulse" />
                      <h3 className="text-sm font-semibold text-[#051A24]">Document Summary</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSummaryPanel(false)}
                      className="text-[#273C46]/60 hover:text-[#273C46] p-1 hover:bg-[#1f5d4f]/10 rounded-lg transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingSummary ? (
                    <div className="flex items-center gap-3 py-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1f5d4f] animate-ping" />
                      <p className="text-xs text-[#273C46]/70">
                        Reading file chunks & summarizing...
                      </p>
                    </div>
                  ) : summary ? (
                    <div className="space-y-3 text-left">
                      <div className="bg-white rounded-xl p-3 border border-[#1f5d4f]/10">
                        <p className="text-xs font-semibold text-[#1f5d4f] uppercase tracking-wider mb-1">
                          TL;DR
                        </p>
                        <p className="text-sm text-[#051A24] leading-relaxed">
                          {summary.tldr || summary.summary}
                        </p>
                      </div>

                      {summary.key_points && summary.key_points.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#273C46]/80 uppercase tracking-wider mb-1 px-1">
                            Key Takeaways
                          </p>
                          <ul className="list-disc pl-5 text-xs text-[#051A24] space-y-1">
                            {summary.key_points.map((pt: string, idx: number) => (
                              <li key={idx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {summary.topics && summary.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {summary.topics.map((topic: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-[#1f5d4f]/10 text-[#1f5d4f] rounded-full px-2 py-0.5 font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Messages */}
              {!activeId && messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Sparkles className="w-12 h-12 text-[#1f5d4f] mb-4" />
                  <h2 className="text-2xl font-medium text-[#051A24]">Ask anything</h2>
                  <p className="text-sm text-[#273C46] mt-2 max-w-sm">
                    Start a new conversation or pick one from your history. Select a document scope
                    from the sidebar to chat with a specific file.
                  </p>
                </div>
              ) : (
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-3xl px-5 py-4 ${m.role === "user" ? "bg-[#051A24] text-white" : "bg-[#f0f0ee] text-[#051A24]"}`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                        <p
                          className={`text-[10px] mt-2 ${m.role === "user" ? "text-white/40" : "text-[#273C46]/40"}`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-[#f0f0ee] rounded-3xl px-5 py-4 flex items-center gap-3">
                        <div className="flex gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#1f5d4f] animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#1f5d4f] animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#1f5d4f] animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <p className="text-sm text-[#273C46]">Generating answer…</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
                className="border-t border-[#051A24]/10 p-4 flex items-center gap-3"
              >
                {/* Mic button */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                      : "bg-[#f0f0ee] text-[#273C46] hover:bg-[#1f5d4f]/10 hover:text-[#1f5d4f]"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening ? "Listening..." : "Ask anything across your indexed documents…"
                  }
                  disabled={sending}
                  className={`flex-1 bg-transparent outline-none text-[15px] placeholder:text-[#273C46]/50 disabled:opacity-50 ${isListening ? "placeholder:text-red-400 placeholder:animate-pulse" : ""}`}
                />
                {/* TTS toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setTtsEnabled(!ttsEnabled);
                    if (ttsEnabled) window.speechSynthesis?.cancel();
                    toast.success(ttsEnabled ? "Voice output off" : "Voice output on");
                  }}
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    ttsEnabled
                      ? "bg-[#1f5d4f] text-white"
                      : "bg-[#f0f0ee] text-[#273C46] hover:bg-[#1f5d4f]/10 hover:text-[#1f5d4f]"
                  }`}
                  title={ttsEnabled ? "Disable voice output" : "Enable voice output"}
                >
                  {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="bg-[#051A24] text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-[#0D212C] transition-all disabled:opacity-40 shrink-0"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
