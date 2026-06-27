"""Supabase Storage-based data persistence layer.
Stores all app data as JSON files in Supabase Storage buckets.
No database tables required."""
import config
import httpx
import json
from typing import Optional

_supabase_url = config.SUPABASE_URL
_service_key = config.SUPABASE_SERVICE_ROLE_KEY


def _headers() -> dict:
    return {
        "apikey": _service_key,
        "Authorization": f"Bearer {_service_key}",
        "Content-Type": "application/json",
    }


def _request(method: str, path: str, **kwargs):
    url = f"{_supabase_url}{path}"
    h = _headers()
    if "headers" in kwargs:
        h.update(kwargs.pop("headers"))
    with httpx.Client() as client:
        resp = client.request(method, url, headers=h, timeout=30, **kwargs)
        return resp


def storage_list_buckets() -> list:
    r = _request("GET", "/storage/v1/bucket")
    if r.status_code >= 400:
        raise Exception(f"List buckets error {r.status_code}: {r.text}")
    return r.json()


def storage_create_bucket(name: str):
    r = _request("POST", "/storage/v1/bucket", json={"name": name, "public": False})
    if r.status_code >= 400:
        raise Exception(f"Create bucket error {r.status_code}: {r.text}")


def storage_upload(path: str, data: bytes):
    headers = {
        "apikey": _service_key,
        "Authorization": f"Bearer {_service_key}",
        "x-upsert": "true",
    }
    r = _request("POST", f"/storage/v1/object/data/{path}", headers=headers, content=data)
    if r.status_code >= 400:
        raise Exception(f"Storage upload error {r.status_code}: {r.text}")
    return r.json()


def storage_download(path: str) -> bytes:
    headers = {"apikey": _service_key, "Authorization": f"Bearer {_service_key}"}
    r = _request("GET", f"/storage/v1/object/data/{path}", headers=headers)
    if r.status_code == 404:
        return b""
    if r.status_code >= 400:
        # Supabase Storage may return HTTP 400 with a 404 body when object is missing
        try:
            body = r.json()
            if body.get("statusCode") == "404" or body.get("error") == "not_found" or "not found" in r.text.lower():
                return b""
        except Exception:
            pass
        raise Exception(f"Storage download error {r.status_code}: {r.text}")
    return r.content


def storage_delete(path: str):
    headers = {"apikey": _service_key, "Authorization": f"Bearer {_service_key}"}
    r = _request("DELETE", f"/storage/v1/object/data/{path}", headers=headers)
    if r.status_code >= 400 and r.status_code != 404:
        raise Exception(f"Storage delete error {r.status_code}: {r.text}")


def storage_list(prefix: str) -> list:
    r = _request("POST", f"/storage/v1/object/list/data", json={"prefix": prefix, "limit": 1000})
    if r.status_code >= 400:
        return []
    return r.json()


def _read_json(path: str):
    data = storage_download(path)
    if not data:
        return None
    return json.loads(data.decode())


def _write_json(path: str, obj):
    storage_upload(path, json.dumps(obj, default=str).encode())


def ensure_data_bucket():
    try:
        buckets = storage_list_buckets()
        bucket_names = [b.get("name") for b in buckets]
        if "data" not in bucket_names:
            storage_create_bucket("data")
            print("Created 'data' bucket")
        if "documents" not in bucket_names:
            storage_create_bucket("documents")
            print("Created 'documents' bucket")
    except Exception as e:
        print(f"Bucket check: {e}")


# ─── Document operations ───────────────────────────────────────────────

def get_documents(user_id: str) -> list:
    docs = _read_json(f"documents_{user_id}.json")
    return docs or []


def save_documents(user_id: str, docs: list):
    _write_json(f"documents_{user_id}.json", docs)


def add_document(user_id: str, doc: dict) -> dict:
    docs = get_documents(user_id)
    import uuid
    if "id" not in doc:
        doc["id"] = str(uuid.uuid4())
    docs.insert(0, doc)
    save_documents(user_id, docs)
    return doc


def update_document_status(user_id: str, doc_id: str, status: str):
    docs = get_documents(user_id)
    for d in docs:
        if d["id"] == doc_id:
            d["status"] = status
            break
    save_documents(user_id, docs)


def delete_document(user_id: str, doc_id: str):
    docs = get_documents(user_id)
    storage_path = None
    for d in docs:
        if d["id"] == doc_id:
            storage_path = d.get("storage_path")
            break
    docs = [d for d in docs if d["id"] != doc_id]
    save_documents(user_id, docs)
    try:
        storage_delete(f"chunks_{doc_id}.json")
    except Exception:
        pass
    try:
        storage_delete(f"summary_{doc_id}.json")
    except Exception:
        pass
    try:
        storage_delete(f"quiz_{doc_id}.json")
    except Exception:
        pass
    if storage_path:
        try:
            # Delete from documents bucket
            headers = {"apikey": _service_key, "Authorization": f"Bearer {_service_key}"}
            _request("DELETE", f"/storage/v1/object/documents/{storage_path}", headers=headers)
        except Exception as e:
            print(f"Error deleting raw doc {storage_path}: {e}")


# ─── Chat sessions ─────────────────────────────────────────────────────

def get_sessions(user_id: str) -> list:
    s = _read_json(f"sessions_{user_id}.json")
    return s or []


def save_sessions(user_id: str, sessions: list):
    _write_json(f"sessions_{user_id}.json", sessions)


def create_session(user_id: str, document_id: Optional[str] = None, document_name: Optional[str] = None) -> dict:
    import uuid
    from datetime import datetime
    title = f"Chat: {document_name}" if document_name else "New Chat"
    session = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "document_id": document_id,
        "document_name": document_name,
        "created_at": datetime.utcnow().isoformat(),
    }
    sessions = get_sessions(user_id)
    sessions.insert(0, session)
    save_sessions(user_id, sessions)
    return session


def delete_session(user_id: str, session_id: str):
    sessions = get_sessions(user_id)
    sessions = [s for s in sessions if s["id"] != session_id]
    save_sessions(user_id, sessions)
    # Delete messages
    storage_delete(f"messages_{session_id}.json")


def rename_session(user_id: str, session_id: str, title: str):
    sessions = get_sessions(user_id)
    for s in sessions:
        if s["id"] == session_id:
            if s.get("document_name"):
                s["title"] = f"{s.get('document_name')[:20]}: {title[:25]}"
            else:
                s["title"] = title
            break
    save_sessions(user_id, sessions)


# ─── Messages ──────────────────────────────────────────────────────────

def get_messages(session_id: str) -> list:
    msgs = _read_json(f"messages_{session_id}.json")
    return msgs or []


def save_messages(session_id: str, msgs: list):
    _write_json(f"messages_{session_id}.json", msgs)


def add_message(session_id: str, msg: dict) -> dict:
    import uuid
    from datetime import datetime
    if "id" not in msg:
        msg["id"] = str(uuid.uuid4())
    if "created_at" not in msg:
        msg["created_at"] = datetime.utcnow().isoformat()
    msgs = get_messages(session_id)
    msgs.append(msg)
    save_messages(session_id, msgs)
    return msg


# ─── Document chunks (for RAG) ─────────────────────────────────────────

def get_chunks(doc_id: str) -> list:
    c = _read_json(f"chunks_{doc_id}.json")
    return c or []


def save_chunks(doc_id: str, chunks: list):
    _write_json(f"chunks_{doc_id}.json", chunks)


def get_all_user_chunks(user_id: str) -> list:
    """Get all chunks for all documents owned by a user."""
    docs = get_documents(user_id)
    all_chunks = []
    for d in docs:
        if d.get("status") != "done":
            continue
        chunks = get_chunks(d["id"])
        for c in chunks:
            c["doc_id"] = d["id"]
            c["doc_name"] = d.get("name", "Unknown File")
            c["user_id"] = user_id
        all_chunks.extend(chunks)
    return all_chunks


# ─── Dashboard stats ───────────────────────────────────────────────────

def get_dashboard_stats(user_id: str) -> dict:
    docs = get_documents(user_id)
    sessions = get_sessions(user_id)
    total_messages = 0
    for s in sessions:
        msgs = get_messages(s["id"])
        total_messages += len(msgs)
    return {
        "documents": len(docs),
        "queries": total_messages,
        "sessions": len(sessions),
        "recent_activity": [{"id": d["id"], "name": d["name"], "status": d.get("status", ""),
                             "created_at": d.get("created_at", "")} for d in docs[:5]],
    }


# ─── AI Feature Storage ───────────────────────────────────────────────

def get_summary(doc_id: str) -> Optional[dict]:
    return _read_json(f"summary_{doc_id}.json")


def save_summary(doc_id: str, summary: dict):
    _write_json(f"summary_{doc_id}.json", summary)


def get_quiz(doc_id: str) -> Optional[dict]:
    return _read_json(f"quiz_{doc_id}.json")


def save_quiz(doc_id: str, quiz: dict):
    _write_json(f"quiz_{doc_id}.json", quiz)


def update_document_tags(user_id: str, doc_id: str, tags: list, category: str):
    docs = get_documents(user_id)
    for d in docs:
        if d["id"] == doc_id:
            d["tags"] = tags
            d["category"] = category
            break
    save_documents(user_id, docs)


def get_insights(user_id: str) -> Optional[dict]:
    return _read_json(f"insights_{user_id}.json")


def save_insights(user_id: str, insights: dict):
    _write_json(f"insights_{user_id}.json", insights)
