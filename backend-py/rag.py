import config
from groq import Groq
from typing import List, Optional, Any
import numpy as np
import data_store as store

# Lazy-loaded singletons — loaded once on first use
_model: Any = None
_groq_client: Optional[Groq] = None


def get_model() -> Any:
    """Load sentence-transformers model locally (downloads ~80 MB on first run)."""
    global _model
    if _model is None:
        print("Loading embedding model (first run may take a moment)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("Embedding model loaded.")
    return _model


def get_groq() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = config.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in the environment variables. Please check your backend .env file.")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def chunk_text(text: str, max_chars: int = 800) -> List[str]:
    chunks, paragraphs = [], text.split("\n\n")
    current = ""
    for p in paragraphs:
        if len(current) + len(p) > max_chars and current:
            chunks.append(current.strip())
            current = p
        else:
            current = (current + "\n\n" + p) if current else p
    if current.strip():
        chunks.append(current.strip())
    return chunks if chunks else [text[:max_chars]]


def extract_text(file_path: str) -> str:
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
    if ext == "txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    if ext == "pdf":
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if ext == "docx":
        import zipfile
        import xml.etree.ElementTree as ET
        try:
            with zipfile.ZipFile(file_path) as docx:
                xml_content = docx.read('word/document.xml')
                root = ET.fromstring(xml_content)
                texts = []
                for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                    p_text = "".join(node.text for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
                    if p_text:
                        texts.append(p_text)
                return "\n".join(texts)
        except Exception as e:
            print(f"Error extracting DOCX text: {e}")
            return ""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read(50000)


def process_document(doc_id: str, text: str, user_id: str):
    model = get_model()
    chunks = chunk_text(text)

    # Generate embeddings locally — no API call, completely free
    embeddings = model.encode(chunks, convert_to_numpy=True)

    chunk_data = []
    for i, chunk in enumerate(chunks):
        chunk_data.append({
            "content": chunk,
            "embedding": embeddings[i].tolist(),
            "index": i,
        })

    store.save_chunks(doc_id, chunk_data)
    store.update_document_status(user_id, doc_id, "done")
    print(f"Processed doc {doc_id}: {len(chunks)} chunks")


def search_chunks(user_id: str, query: str, document_id: Optional[str] = None, limit: int = 5) -> List[dict]:
    model = get_model()
    query_emb = model.encode([query], convert_to_numpy=True)[0]

    if document_id:
        chunks = store.get_chunks(document_id)
        doc_name = "Unknown File"
        try:
            docs = store.get_documents(user_id)
            for d in docs:
                if d["id"] == document_id:
                    doc_name = d.get("name", "Unknown File")
                    break
        except Exception:
            pass
        for c in chunks:
            c["doc_id"] = document_id
            c["doc_name"] = doc_name
    else:
        chunks = store.get_all_user_chunks(user_id)

    scored = []
    for c in chunks:
        if "embedding" not in c:
            continue
        emb = np.array(c["embedding"])
        score = float(
            np.dot(query_emb, emb)
            / (np.linalg.norm(query_emb) * np.linalg.norm(emb) + 1e-10)
        )
        scored.append({
            "content": c["content"],
            "score": score,
            "doc_name": c.get("doc_name", "Unknown File")
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def generate_answer(user_id: str, query: str, session_id: str) -> str:
    groq = get_groq()

    # Find if session is restricted to a document
    document_id = None
    try:
        sessions = store.get_sessions(user_id)
        for s in sessions:
            if s["id"] == session_id:
                document_id = s.get("document_id")
                break
    except Exception as e:
        print(f"Error checking session scope: {e}")

    chunks = search_chunks(user_id, query, document_id=document_id)

    if not chunks:
        return "No relevant documents found. Upload some documents first and try again."

    context = "\n\n---\n\n".join(
        f"[Source {i+1} from Document: {c['doc_name']}] {c['content']}" for i, c in enumerate(chunks)
    )

    completion = groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a precise RAG assistant. Answer comprehensively based on the provided context. "
                    "If the context lacks information, say so."
                ),
            },
            {"role": "user", "content": f"Context:\n\n{context}\n\nQuestion: {query}"},
        ],
        max_tokens=1000,
    )

    answer = completion.choices[0].message.content or "Sorry, couldn't generate an answer."

    # Append unique document names as sources
    unique_docs = []
    for c in chunks:
        doc = c.get("doc_name", "Unknown File")
        if doc not in unique_docs:
            unique_docs.append(doc)

    if unique_docs:
        answer += "\n\n**Sources:** " + ", ".join(f"`{d}`" for d in unique_docs)

    return answer


# ─── AI Feature Functions ──────────────────────────────────────────────

def generate_summary(doc_id: str, user_id: str) -> dict:
    """Generate a structured AI summary for a document."""
    groq = get_groq()
    chunks = store.get_chunks(doc_id)
    if not chunks:
        return {"summary": "No content found.", "key_points": [], "topics": [], "tldr": "No content."}

    # Take up to first 15 chunks to stay within context limits
    text = "\n\n".join(c["content"] for c in chunks[:15])

    completion = groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a document analysis AI. Given document content, produce a JSON object with:\n"
                    '- "summary": a 3-5 sentence overview\n'
                    '- "key_points": array of 4-6 key takeaways (strings)\n'
                    '- "topics": array of 3-5 main topics covered (strings)\n'
                    '- "tldr": a single sentence TL;DR\n'
                    "Return ONLY valid JSON, no markdown, no code fences."
                ),
            },
            {"role": "user", "content": f"Document content:\n\n{text}"},
        ],
        max_tokens=800,
    )

    raw = completion.choices[0].message.content or "{}"
    # Strip markdown fences if present
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    import json as _json
    try:
        result = _json.loads(raw)
    except Exception:
        result = {"summary": raw, "key_points": [], "topics": [], "tldr": raw[:200]}

    summary_data = {
        "doc_id": doc_id,
        "summary": result.get("summary", ""),
        "key_points": result.get("key_points", []),
        "topics": result.get("topics", []),
        "tldr": result.get("tldr", ""),
    }
    store.save_summary(doc_id, summary_data)

    # Also auto-generate tags when summarizing
    try:
        tags_result = generate_tags(doc_id, user_id)
        summary_data["tags"] = tags_result.get("tags", [])
        summary_data["category"] = tags_result.get("category", "")
    except Exception as e:
        print(f"Auto-tag error: {e}")

    return summary_data


def generate_quiz(doc_id: str, user_id: str) -> dict:
    """Generate quiz questions from a document."""
    groq = get_groq()
    chunks = store.get_chunks(doc_id)
    if not chunks:
        return {"doc_id": doc_id, "questions": []}

    text = "\n\n".join(c["content"] for c in chunks[:12])

    completion = groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a quiz generator AI. Given document content, create exactly 5 multiple-choice questions.\n"
                    "Return a JSON object with a single key \"questions\" containing an array of objects, each with:\n"
                    '- "question": the question text\n'
                    '- "options": array of exactly 4 answer strings\n'
                    '- "correct": index (0-3) of the correct answer\n'
                    '- "explanation": brief explanation of why the answer is correct\n'
                    "Return ONLY valid JSON, no markdown, no code fences."
                ),
            },
            {"role": "user", "content": f"Create quiz from this document:\n\n{text}"},
        ],
        max_tokens=1500,
    )

    raw = completion.choices[0].message.content or "{}"
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    import json as _json
    try:
        result = _json.loads(raw)
    except Exception:
        result = {"questions": []}

    quiz_data = {
        "doc_id": doc_id,
        "questions": result.get("questions", []),
    }
    store.save_quiz(doc_id, quiz_data)
    return quiz_data


def generate_tags(doc_id: str, user_id: str) -> dict:
    """Auto-classify and tag a document."""
    groq = get_groq()
    chunks = store.get_chunks(doc_id)
    if not chunks:
        return {"doc_id": doc_id, "tags": [], "category": "Uncategorized"}

    text = "\n\n".join(c["content"] for c in chunks[:8])

    completion = groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a document classifier AI. Analyze the content and return a JSON object with:\n"
                    '- "tags": array of 3-6 descriptive tags (e.g., "Machine Learning", "Finance", "Legal", "Tutorial")\n'
                    '- "category": a single primary category (e.g., "Technology", "Business", "Science", "Education", "Legal")\n'
                    "Return ONLY valid JSON, no markdown, no code fences."
                ),
            },
            {"role": "user", "content": f"Classify this document:\n\n{text[:3000]}"},
        ],
        max_tokens=300,
    )

    raw = completion.choices[0].message.content or "{}"
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    import json as _json
    try:
        result = _json.loads(raw)
    except Exception:
        result = {"tags": ["Document"], "category": "General"}

    tags = result.get("tags", ["Document"])
    category = result.get("category", "General")

    store.update_document_tags(user_id, doc_id, tags, category)
    return {"doc_id": doc_id, "tags": tags, "category": category}


def generate_insights(user_id: str) -> dict:
    """Generate AI insights across all user documents."""
    groq = get_groq()
    docs = store.get_documents(user_id)
    if not docs:
        return {
            "key_topics": [],
            "knowledge_gaps": [],
            "connections": [],
            "briefing": "Upload some documents to generate insights.",
        }

    # Collect summaries of all docs
    doc_summaries = []
    for d in docs[:20]:  # Limit to 20 docs
        summary = store.get_summary(d["id"])
        if summary:
            doc_summaries.append(f"Document '{d['name']}': {summary.get('tldr', '')}")
        else:
            chunks = store.get_chunks(d["id"])
            if chunks:
                preview = chunks[0]["content"][:200]
                doc_summaries.append(f"Document '{d['name']}': {preview}")

    if not doc_summaries:
        return {
            "key_topics": [],
            "knowledge_gaps": [],
            "connections": [],
            "briefing": "No document content available for analysis.",
        }

    combined = "\n".join(doc_summaries)

    completion = groq.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a knowledge base analyst. Given summaries of multiple documents, produce a JSON object with:\n"
                    '- "key_topics": array of 5-8 main topics across all documents\n'
                    '- "knowledge_gaps": array of 2-4 areas mentioned but not deeply covered\n'
                    '- "connections": array of 2-4 objects, each with "docs" (array of doc names) and "theme" (shared topic)\n'
                    '- "briefing": a 3-4 sentence natural language summary of the entire knowledge base\n'
                    "Return ONLY valid JSON, no markdown, no code fences."
                ),
            },
            {"role": "user", "content": f"Analyze this knowledge base:\n\n{combined}"},
        ],
        max_tokens=1000,
    )

    raw = completion.choices[0].message.content or "{}"
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    import json as _json
    try:
        result = _json.loads(raw)
    except Exception:
        result = {
            "key_topics": [],
            "knowledge_gaps": [],
            "connections": [],
            "briefing": raw[:500],
        }

    insights = {
        "key_topics": result.get("key_topics", []),
        "knowledge_gaps": result.get("knowledge_gaps", []),
        "connections": result.get("connections", []),
        "briefing": result.get("briefing", ""),
    }
    store.save_insights(user_id, insights)
    return insights

