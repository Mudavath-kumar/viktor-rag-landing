import os
import tempfile
import traceback
from pathlib import Path
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

import config
import data_store as store
from db import init_db
from models import SignupRequest, LoginRequest, AuthResponse, ChatRequest, CreateSessionRequest
from rag import (
    process_document, generate_answer, extract_text, get_embed_model,
    generate_summary, generate_quiz, generate_tags, generate_insights,
)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fire DB init as background task — doesn't block server start
    import asyncio
    asyncio.create_task(init_db())
    # Pre-warm embedding model in threadpool so uploads return instantly
    asyncio.create_task(asyncio.to_thread(get_embed_model))

    # Ensure local upload directory
    store.ensure_upload_dir()

    print("[OK] Server started. DB init and model warming running in background.")
    yield
    print("Shutdown.")


app = FastAPI(title="Viktor RAG API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "2.0.0"}


# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    try:
        user = await store.create_user(req.email, req.password, req.name)
        token = store.create_token(user["id"])
        return AuthResponse(user=user, token=token)
    except ValueError as e:
        return AuthResponse(error=str(e))
    except Exception as e:
        traceback.print_exc()
        return AuthResponse(error=str(e))


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await store.get_user_by_email(req.email)
    if not user:
        return AuthResponse(error="Invalid email or password")
    if not store.verify_password(req.password, user["hashed_password"]):
        return AuthResponse(error="Invalid email or password")
    safe_user = {"id": user["id"], "email": user["email"], "name": user.get("name", "")}
    token = store.create_token(user["id"])
    return AuthResponse(user=safe_user, token=token)


# ─── Upload ───────────────────────────────────────────────────────────────────

async def background_process_file(doc_id: str, file_path: str, user_id: str):
    import asyncio
    print(f"[BG] Starting background_process_file for doc_id={doc_id}, file_path={file_path}")
    try:
        text = await asyncio.to_thread(extract_text, file_path)
        print(f"[BG] Extracted {len(text)} chars from {file_path}")
        if not text.strip():
            await store.update_document_status(user_id, doc_id, "error")
            return
        await process_document(doc_id, text, user_id)
    except Exception as e:
        print(f"[BG Error] {e}")
        traceback.print_exc()
        await store.update_document_status(user_id, doc_id, "error")


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

        # Save locally
        storage_path = store.save_upload_file(user_id, name, file_bytes)
        abs_path = store.get_upload_abs_path(storage_path)

        doc = await store.add_document(user_id, {
            "name": name, "size": size, "type": file_type,
            "storage_path": storage_path, "status": "processing",
        })

        # Process in background (embed + Qdrant upload)
        background_tasks.add_task(background_process_file, doc["id"], abs_path, user_id)

        return {"document": doc}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500, content={"error": str(e)},
            headers={"Access-Control-Allow-Origin": "*"},
        )


@app.get("/api/documents/{user_id}")
async def get_documents(user_id: str):
    return {"documents": await store.get_documents(user_id)}


@app.delete("/api/documents/{user_id}/{doc_id}")
async def delete_document(user_id: str, doc_id: str):
    await store.delete_document(user_id, doc_id)
    return {"success": True}


# ─── Chat ─────────────────────────────────────────────────────────────────────

@app.post("/api/chat/sessions")
async def create_session(req: CreateSessionRequest):
    session = await store.create_session(req.user_id, req.document_id, req.document_name)
    return {"session": session}


@app.get("/api/chat/sessions/{user_id}")
async def get_sessions(user_id: str):
    return {"sessions": await store.get_sessions(user_id)}


@app.post("/api/chat/send")
async def send_message(req: ChatRequest):
    await store.add_message(req.session_id, {"role": "user", "content": req.content})

    # Auto-title session on first message
    msgs = await store.get_messages(req.session_id)
    if len(msgs) == 1:
        title = req.content[:60] + ("..." if len(req.content) > 60 else "")
        sessions = await store.get_sessions(req.user_id)
        if sessions:
            await store.rename_session(req.user_id, req.session_id, title)

    answer = await generate_answer(req.user_id, req.content, req.session_id)
    msg = await store.add_message(req.session_id, {"role": "assistant", "content": answer})
    return {"message": msg}


@app.get("/api/chat/messages/{session_id}")
async def get_messages(session_id: str):
    return {"messages": await store.get_messages(session_id)}


@app.delete("/api/chat/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str = Query("")):
    await store.delete_session(user_id, session_id)
    return {"success": True}


@app.put("/api/chat/sessions/{session_id}/rename")
async def rename_session(session_id: str, user_id: str = Query(...), title: str = Query(...)):
    await store.rename_session(user_id, session_id, title)
    return {"success": True}


# ─── AI Features ──────────────────────────────────────────────────────────────

@app.post("/api/documents/{doc_id}/summarize")
async def summarize_document(doc_id: str, user_id: str = Query(...)):
    result = await generate_summary(doc_id, user_id)
    return result


@app.get("/api/documents/{doc_id}/summary")
async def get_summary(doc_id: str):
    cached = await store.get_summary(doc_id)
    if cached:
        return cached
    return {"summary": "", "key_points": [], "topics": [], "tldr": ""}


@app.post("/api/documents/{doc_id}/quiz")
async def create_quiz(doc_id: str, user_id: str = Query(...)):
    result = await generate_quiz(doc_id, user_id)
    return result


@app.get("/api/documents/{doc_id}/quiz")
async def get_quiz(doc_id: str):
    cached = await store.get_quiz(doc_id)
    if cached:
        return cached
    return {"doc_id": doc_id, "questions": []}


@app.post("/api/documents/{doc_id}/tags")
async def create_tags(doc_id: str, user_id: str = Query(...)):
    result = await generate_tags(doc_id, user_id)
    return result


@app.post("/api/insights/{user_id}")
async def create_insights(user_id: str):
    result = await generate_insights(user_id)
    return result


@app.get("/api/insights/{user_id}")
async def get_insights(user_id: str):
    cached = await store.get_insights(user_id)
    if cached:
        return cached
    return {"key_topics": [], "knowledge_gaps": [], "connections": [], "briefing": ""}


# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    return await store.get_dashboard_stats(user_id)


# ─── Static Frontend Serving ──────────────────────────────────────────────────

DIST_DIR = Path(__file__).resolve().parent.parent / "dist"


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = DIST_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    index = DIST_DIR / "index.html"
    if index.is_file():
        return FileResponse(index)
    return JSONResponse(
        status_code=404,
        content={"error": "Frontend not built. Run: npm run build"},
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
