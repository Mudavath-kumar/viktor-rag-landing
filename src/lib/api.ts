const API = import.meta.env.VITE_API_URL || "https://viktor-rag-landing-fmtd.onrender.com/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (options?.method && options.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  upload: async (userId: string, file: File) => {
    const form = new FormData();
    form.append("user_id", userId);
    form.append("name", file.name);
    form.append("size", `${(file.size / 1024 / 1024).toFixed(1)} MB`);
    form.append("file_type", file.name.split(".").pop()?.toUpperCase() || "FILE");
    form.append("file", file);
    const res = await fetch(`${API}/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  getDocuments: (userId: string) => request<{ documents: any[] }>(`/documents/${userId}`),

  createSession: (userId: string, documentId?: string, documentName?: string) =>
    request<{ session: any }>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        document_id: documentId,
        document_name: documentName,
      }),
    }),

  getSessions: (userId: string) => request<{ sessions: any[] }>(`/chat/sessions/${userId}`),

  sendMessage: (sessionId: string, userId: string, content: string) =>
    request<{ message: any }>("/chat/send", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, user_id: userId, content }),
    }),

  getMessages: (sessionId: string) => request<{ messages: any[] }>(`/chat/messages/${sessionId}`),

  deleteSession: (sessionId: string, userId: string) =>
    request<{ success: boolean }>(
      `/chat/sessions/${sessionId}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    ),

  renameSession: (sessionId: string, userId: string, title: string) =>
    request<{ success: boolean }>(
      `/chat/sessions/${sessionId}/rename?user_id=${encodeURIComponent(userId)}&title=${encodeURIComponent(title)}`,
      { method: "PUT" },
    ),

  deleteDocument: (userId: string, docId: string) =>
    request<{ success: boolean }>(`/documents/${userId}/${docId}`, { method: "DELETE" }),

  getDashboard: (userId: string) =>
    request<{ documents: number; queries: number; sessions: number; recent_activity: any[] }>(
      `/dashboard/${userId}`,
    ),

  // ─── AI Features ───────────────────────────────────────────────────

  summarize: (userId: string, docId: string) =>
    request<{
      doc_id: string;
      summary: string;
      key_points: string[];
      topics: string[];
      tldr: string;
      tags?: string[];
      category?: string;
    }>(`/documents/${docId}/summarize?user_id=${encodeURIComponent(userId)}`, { method: "POST" }),

  getSummary: (docId: string) =>
    request<{ summary: string; key_points: string[]; topics: string[]; tldr: string }>(
      `/documents/${docId}/summary`,
    ),

  generateQuiz: (userId: string, docId: string) =>
    request<{ doc_id: string; questions: any[] }>(
      `/documents/${docId}/quiz?user_id=${encodeURIComponent(userId)}`,
      { method: "POST" },
    ),

  getQuiz: (docId: string) =>
    request<{ doc_id: string; questions: any[] }>(`/documents/${docId}/quiz`),

  generateTags: (userId: string, docId: string) =>
    request<{ doc_id: string; tags: string[]; category: string }>(
      `/documents/${docId}/tags?user_id=${encodeURIComponent(userId)}`,
      { method: "POST" },
    ),

  generateInsights: (userId: string) =>
    request<{
      key_topics: string[];
      knowledge_gaps: string[];
      connections: any[];
      briefing: string;
    }>(`/insights/${userId}`, { method: "POST" }),

  getInsights: (userId: string) =>
    request<{
      key_topics: string[];
      knowledge_gaps: string[];
      connections: any[];
      briefing: string;
    }>(`/insights/${userId}`),
};
