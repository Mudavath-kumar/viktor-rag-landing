import os
import tempfile
import httpx
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

import data_store as store
from models import SignupRequest, LoginRequest, AuthResponse, ChatRequest, CreateSessionRequest
from rag import process_document, generate_answer, extract_text, generate_summary, generate_quiz, generate_tags, generate_insights


@asynccontextmanager
async def lifespan(app):
    store.ensure_data_bucket()
    print("Startup complete")
    yield

app = FastAPI(title="Viktor RAG API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def catch_all(request, exc):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )



# ─── Auth ───────────────────────────────────────────────────────────────────

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    r = httpx.post(
        f"{store._supabase_url}/auth/v1/admin/users",
        headers={"apikey": store._service_key, "Authorization": f"Bearer {store._service_key}",
                 "Content-Type": "application/json"},
        json={
            "email": req.email, "password": req.password,
            "email_confirm": True,
            "user_metadata": {"full_name": req.name},
        },
        timeout=30,
    )
    if r.status_code >= 400:
        return AuthResponse(error=r.json().get("msg", r.text))
    data = r.json()
    return AuthResponse(user={"id": data["id"], "email": data["email"]})


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    r = httpx.post(
        f"{store._supabase_url}/auth/v1/token?grant_type=password",
        headers={"apikey": store._service_key, "Content-Type": "application/json"},
        json={"email": req.email, "password": req.password},
        timeout=30,
    )
    if r.status_code >= 400:
        return AuthResponse(error=r.json().get("error_description", r.text))
    data = r.json()
    return AuthResponse(
        user={"id": data["user"]["id"], "email": data["user"]["email"]},
        session={"access_token": data["access_token"], "refresh_token": data["refresh_token"]},
    )


# ─── Upload ─────────────────────────────────────────────────────────────────

def background_process_file(doc_id: str, file_bytes: bytes, name: str, user_id: str):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=name) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        text = extract_text(tmp_path)
        os.unlink(tmp_path)
        process_document(doc_id, text, user_id)
    except Exception as e:
        traceback.print_exc()
        store.update_document_status(user_id, doc_id, "error")


@app.post("/api/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    user_id: str = Form(...),
    name: str = Form(...),
    size: str = Form(...),
    file_type: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        file_bytes = await file.read()
        file_path = f"{user_id}/{int(__import__('time').time() * 1000)}-{name}"

        supabase_url = store._supabase_url
        headers = {"apikey": store._service_key, "Authorization": f"Bearer {store._service_key}"}

        # Upload to Supabase Storage
        with httpx.Client() as client:
            r = client.post(
                f"{supabase_url}/storage/v1/object/documents/{file_path}",
                headers=headers, content=file_bytes, timeout=60,
            )
            if r.status_code >= 400:
                return JSONResponse(status_code=500, content={"error": f"Storage: {r.text}"},
                                    headers={"Access-Control-Allow-Origin": "*"})

        doc = store.add_document(user_id, {
            "name": name, "size": size, "type": file_type,
            "storage_path": file_path, "status": "processing",
            "created_at": __import__("datetime").datetime.utcnow().isoformat(),
        })

        # Extract text and process in the background
        background_tasks.add_task(background_process_file, doc["id"], file_bytes, name, user_id)

        return {"document": doc}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)},
                            headers={"Access-Control-Allow-Origin": "*"})


@app.get("/api/documents/{user_id}")
async def get_documents(user_id: str):
    return {"documents": store.get_documents(user_id)}


@app.delete("/api/documents/{user_id}/{doc_id}")
async def delete_document(user_id: str, doc_id: str):
    store.delete_document(user_id, doc_id)
    return {"success": True}


# ─── Chat ───────────────────────────────────────────────────────────────────

@app.post("/api/chat/sessions")
async def create_session(req: CreateSessionRequest):
    session = store.create_session(req.user_id, req.document_id, req.document_name)
    return {"session": session}


@app.get("/api/chat/sessions/{user_id}")
async def get_sessions(user_id: str):
    return {"sessions": store.get_sessions(user_id)}


@app.post("/api/chat/send")
async def send_message(req: ChatRequest):
    store.add_message(req.session_id, {
        "role": "user", "content": req.content,
    })

    msgs = store.get_messages(req.session_id)
    if len(msgs) == 1:
        title = req.content[:60] + ("..." if len(req.content) > 60 else "")
        store.rename_session(req.user_id, req.session_id, title)

    answer = generate_answer(req.user_id, req.content, req.session_id)

    msg = store.add_message(req.session_id, {
        "role": "assistant", "content": answer,
    })
    return {"message": msg}


@app.get("/api/chat/messages/{session_id}")
async def get_messages(session_id: str):
    return {"messages": store.get_messages(session_id)}


@app.delete("/api/chat/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str = ""):
    store.delete_session(user_id, session_id)
    return {"success": True}


@app.put("/api/chat/sessions/{session_id}/rename")
async def rename_session(session_id: str, user_id: str, title: str):
    store.rename_session(user_id, session_id, title)
    return {"success": True}


# ─── AI Features ────────────────────────────────────────────────────────────

@app.post("/api/documents/{doc_id}/summarize")
async def summarize_document(doc_id: str, user_id: str):
    result = generate_summary(doc_id, user_id)
    return result


@app.get("/api/documents/{doc_id}/summary")
async def get_summary(doc_id: str):
    cached = store.get_summary(doc_id)
    if cached:
        return cached
    return {"summary": "", "key_points": [], "topics": [], "tldr": ""}


@app.post("/api/documents/{doc_id}/quiz")
async def create_quiz(doc_id: str, user_id: str):
    result = generate_quiz(doc_id, user_id)
    return result


@app.get("/api/documents/{doc_id}/quiz")
async def get_quiz(doc_id: str):
    cached = store.get_quiz(doc_id)
    if cached:
        return cached
    return {"doc_id": doc_id, "questions": []}


@app.post("/api/documents/{doc_id}/tags")
async def create_tags(doc_id: str, user_id: str):
    result = generate_tags(doc_id, user_id)
    return result


@app.post("/api/insights/{user_id}")
async def create_insights(user_id: str):
    result = generate_insights(user_id)
    return result


@app.get("/api/insights/{user_id}")
async def get_insights(user_id: str):
    cached = store.get_insights(user_id)
    if cached:
        return cached
    return {"key_topics": [], "knowledge_gaps": [], "connections": [], "briefing": ""}


# ─── Dashboard ──────────────────────────────────────────────────────────────

@app.get("/api/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    return store.get_dashboard_stats(user_id)


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
