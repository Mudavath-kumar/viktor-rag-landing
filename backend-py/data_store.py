"""
Data store layer — wraps SQLAlchemy async operations against the existing Neon Postgres schema.
Files are stored locally under config.UPLOAD_DIR.
"""
import os
import uuid
import hashlib
import hmac
import base64
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy import select, delete, update, func, text
from sqlalchemy.ext.asyncio import AsyncSession

import config
from db import (
    AsyncSessionLocal,
    User, KnowledgeBase, Document, ChatSession, ChatMessage,
    Summary, Quiz, Insights
)


# ─── Upload directory ─────────────────────────────────────────────────────────

def ensure_upload_dir():
    Path(config.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    print(f"Upload directory ready: {config.UPLOAD_DIR}")


def save_upload_file(user_id: str, filename: str, file_bytes: bytes) -> str:
    """Save bytes to disk, return relative path."""
    user_dir = Path(config.UPLOAD_DIR) / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    ts = int(datetime.utcnow().timestamp() * 1000)
    safe_name = filename.replace(" ", "_")
    rel_path = f"{user_id}/{ts}-{safe_name}"
    abs_path = Path(config.UPLOAD_DIR) / rel_path
    abs_path.write_bytes(file_bytes)
    return rel_path


def get_upload_abs_path(storage_path: str) -> str:
    return str(Path(config.UPLOAD_DIR) / storage_path)


def delete_upload_file(storage_path: str):
    try:
        abs_path = Path(config.UPLOAD_DIR) / storage_path
        if abs_path.exists():
            abs_path.unlink()
    except Exception as e:
        print(f"Error deleting upload file {storage_path}: {e}")


# ─── Password hashing ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{h}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        salt, h = hashed.split(":", 1)
        return hmac.compare_digest(
            hashlib.sha256((salt + password).encode()).hexdigest(), h
        )
    except Exception:
        return False


# ─── Simple token (base64-encoded JSON) ──────────────────────────────────────

def create_token(user_id: str) -> str:
    payload = json.dumps({"user_id": user_id}).encode()
    return base64.b64encode(payload).decode()


def decode_token(token: str) -> Optional[str]:
    try:
        payload = json.loads(base64.b64decode(token).decode())
        return payload.get("user_id")
    except Exception:
        return None


# ─── Users ────────────────────────────────────────────────────────────────────

async def create_user(email: str, password: str, name: str) -> dict:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            raise ValueError("User with this email already exists")
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=name,
            hashed_password=hash_password(password),
            role="user",
            is_active=True,
        )
        db.add(user)
        # Also create a default knowledge base for this user
        await db.flush()  # Get the user.id
        kb = KnowledgeBase(
            id=str(uuid.uuid4()),
            name="My Knowledge Base",
            description="Default workspace",
            owner_id=user.id,
            is_default=True,
        )
        db.add(kb)
        await db.commit()
        await db.refresh(user)
        return {"id": user.id, "email": user.email, "name": user.full_name or ""}


async def get_user_by_email(email: str) -> Optional[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return {
            "id": user.id, "email": user.email, "name": user.full_name or "",
            "hashed_password": user.hashed_password,
        }


async def get_user_by_id(user_id: str) -> Optional[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return {"id": user.id, "email": user.email, "name": user.full_name or ""}


# ─── Default KB helper ────────────────────────────────────────────────────────

async def get_default_kb_id(user_id: str) -> str:
    """Get or create the default knowledge base for a user."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(KnowledgeBase).where(KnowledgeBase.owner_id == user_id).limit(1)
        )
        kb = result.scalar_one_or_none()
        if kb:
            return kb.id
        # Create a default KB if none exists
        new_kb = KnowledgeBase(
            id=str(uuid.uuid4()),
            name="My Knowledge Base",
            description="Default workspace",
            owner_id=user_id,
            is_default=True,
        )
        db.add(new_kb)
        await db.commit()
        await db.refresh(new_kb)
        return new_kb.id


# ─── Documents ────────────────────────────────────────────────────────────────

async def add_document(user_id: str, doc: dict) -> dict:
    kb_id = await get_default_kb_id(user_id)
    async with AsyncSessionLocal() as db:
        fname = doc.get("name", "document")
        # Parse size_bytes from human-readable size string
        size_str = doc.get("size", "0")
        try:
            if "MB" in size_str:
                size_bytes = int(float(size_str.replace(" MB", "")) * 1024 * 1024)
            elif "KB" in size_str:
                size_bytes = int(float(size_str.replace(" KB", "")) * 1024)
            else:
                size_bytes = int(size_str)
        except Exception:
            size_bytes = 0

        document = Document(
            id=str(uuid.uuid4()),
            kb_id=kb_id,
            owner_id=user_id,
            filename=fname,
            original_filename=fname,
            storage_path=doc.get("storage_path", ""),
            file_type=doc.get("type", "").lower(),
            checksum="",
            size_bytes=size_bytes,
            status=doc.get("status", "processing"),
            doc_metadata={},
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)
        return _doc_to_dict(document)


async def get_documents(user_id: str) -> list:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Document).where(Document.owner_id == user_id)
            .order_by(Document.created_at.desc())
        )
        return [_doc_to_dict(d) for d in result.scalars().all()]


async def get_document(doc_id: str) -> Optional[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == doc_id))
        d = result.scalar_one_or_none()
        return _doc_to_dict(d) if d else None


async def update_document_status(user_id: str, doc_id: str, status: str):
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Document).where(Document.id == doc_id, Document.owner_id == user_id)
            .values(status=status, updated_at=datetime.utcnow())
        )
        await db.commit()


async def update_document_tags(user_id: str, doc_id: str, tags: list, category: str):
    """Store tags/category in document metadata JSON field."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Document).where(Document.id == doc_id, Document.owner_id == user_id)
        )
        doc = result.scalar_one_or_none()
        if doc:
            meta = dict(doc.doc_metadata or {})
            meta["tags"] = tags
            meta["category"] = category
            await db.execute(
                update(Document).where(Document.id == doc_id)
                .values(doc_metadata=meta, updated_at=datetime.utcnow())
            )
            await db.commit()


async def delete_document(user_id: str, doc_id: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Document).where(Document.id == doc_id, Document.owner_id == user_id)
        )
        doc = result.scalar_one_or_none()
        storage_path = doc.storage_path if doc else None
        await db.execute(
            delete(Document).where(Document.id == doc_id, Document.owner_id == user_id)
        )
        await db.commit()
        if storage_path:
            delete_upload_file(storage_path)


def _doc_to_dict(d: Document) -> dict:
    meta = d.doc_metadata or {}
    return {
        "id": d.id,
        "user_id": d.owner_id,
        "name": d.original_filename or d.filename,
        "size": f"{d.size_bytes / 1024 / 1024:.1f} MB" if d.size_bytes else "0 MB",
        "type": d.file_type.upper() if d.file_type else "FILE",
        "storage_path": d.storage_path,
        "status": d.status,
        "tags": meta.get("tags", []),
        "category": meta.get("category"),
        "created_at": d.created_at.isoformat() if d.created_at else "",
    }


# ─── Chat Sessions ────────────────────────────────────────────────────────────

async def create_session(user_id: str, document_id: Optional[str] = None, document_name: Optional[str] = None) -> dict:
    async with AsyncSessionLocal() as db:
        title = f"Chat: {document_name}" if document_name else "New Chat"
        session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title,
            document_id=document_id,
            document_name=document_name,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return _session_to_dict(session)


async def get_sessions(user_id: str) -> list:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ChatSession).where(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
        )
        return [_session_to_dict(s) for s in result.scalars().all()]


async def delete_session(user_id: str, session_id: str):
    async with AsyncSessionLocal() as db:
        await db.execute(
            delete(ChatSession).where(
                ChatSession.id == session_id, ChatSession.user_id == user_id
            )
        )
        await db.commit()


async def rename_session(user_id: str, session_id: str, title: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        s = result.scalar_one_or_none()
        if s:
            new_title = title[:100]
            await db.execute(
                update(ChatSession).where(ChatSession.id == session_id)
                .values(title=new_title)
            )
            await db.commit()


def _session_to_dict(s: ChatSession) -> dict:
    return {
        "id": s.id,
        "user_id": s.user_id,
        "title": s.title,
        "document_id": s.document_id,
        "document_name": s.document_name,
        "created_at": s.created_at.isoformat() if s.created_at else "",
    }


# ─── Messages ─────────────────────────────────────────────────────────────────

async def add_message(session_id: str, msg: dict) -> dict:
    # Look up user_id from session
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
        session = result.scalar_one_or_none()
        user_id = session.user_id if session else str(uuid.uuid4())

        message = ChatMessage(
            id=str(uuid.uuid4()),
            conversation_id=session_id,
            user_id=user_id,
            role=msg.get("role", "user"),
            content=msg.get("content", ""),
            msg_metadata={},
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        return _msg_to_dict(message)


async def get_messages(session_id: str) -> list:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ChatMessage).where(ChatMessage.conversation_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        return [_msg_to_dict(m) for m in result.scalars().all()]


def _msg_to_dict(m: ChatMessage) -> dict:
    return {
        "id": m.id,
        "session_id": m.conversation_id,
        "role": m.role,
        "content": m.content,
        "created_at": m.created_at.isoformat() if m.created_at else "",
    }


# ─── Dashboard ────────────────────────────────────────────────────────────────

async def get_dashboard_stats(user_id: str) -> dict:
    async with AsyncSessionLocal() as db:
        doc_count = (await db.execute(
            select(func.count(Document.id)).where(Document.owner_id == user_id)
        )).scalar_one()

        session_count = (await db.execute(
            select(func.count(ChatSession.id)).where(ChatSession.user_id == user_id)
        )).scalar_one()

        msg_count = (await db.execute(
            select(func.count(ChatMessage.id)).join(
                ChatSession, ChatMessage.conversation_id == ChatSession.id
            ).where(ChatSession.user_id == user_id)
        )).scalar_one()

        recent_docs = (await db.execute(
            select(Document).where(Document.owner_id == user_id)
            .order_by(Document.created_at.desc()).limit(5)
        )).scalars().all()

        return {
            "documents": doc_count,
            "queries": msg_count,
            "sessions": session_count,
            "recent_activity": [
                {
                    "id": d.id, "name": d.original_filename or d.filename,
                    "status": d.status,
                    "created_at": d.created_at.isoformat() if d.created_at else "",
                }
                for d in recent_docs
            ],
        }


# ─── Summaries ────────────────────────────────────────────────────────────────

async def get_summary(doc_id: str) -> Optional[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Summary).where(Summary.doc_id == doc_id))
        s = result.scalar_one_or_none()
        if not s:
            return None
        return {
            "doc_id": s.doc_id, "summary": s.summary,
            "key_points": s.key_points, "topics": s.topics, "tldr": s.tldr,
        }


async def save_summary(doc_id: str, data: dict):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Summary).where(Summary.doc_id == doc_id))
        existing = result.scalar_one_or_none()
        if existing:
            await db.execute(
                update(Summary).where(Summary.doc_id == doc_id)
                .values(
                    summary=data.get("summary", ""),
                    key_points=data.get("key_points", []),
                    topics=data.get("topics", []),
                    tldr=data.get("tldr", ""),
                )
            )
        else:
            db.add(Summary(
                id=str(uuid.uuid4()),
                doc_id=doc_id,
                summary=data.get("summary", ""),
                key_points=data.get("key_points", []),
                topics=data.get("topics", []),
                tldr=data.get("tldr", ""),
            ))
        await db.commit()


# ─── Quizzes ──────────────────────────────────────────────────────────────────

async def get_quiz(doc_id: str) -> Optional[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Quiz).where(Quiz.doc_id == doc_id))
        q = result.scalar_one_or_none()
        if not q:
            return None
        return {"doc_id": q.doc_id, "questions": q.questions}


async def save_quiz(doc_id: str, data: dict):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Quiz).where(Quiz.doc_id == doc_id))
        existing = result.scalar_one_or_none()
        if existing:
            await db.execute(
                update(Quiz).where(Quiz.doc_id == doc_id)
                .values(questions=data.get("questions", []))
            )
        else:
            db.add(Quiz(
                id=str(uuid.uuid4()),
                doc_id=doc_id,
                questions=data.get("questions", []),
            ))
        await db.commit()


# ─── Insights ─────────────────────────────────────────────────────────────────

async def get_insights(user_id: str) -> Optional[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Insights).where(Insights.user_id == user_id))
        ins = result.scalar_one_or_none()
        if not ins:
            return None
        return {
            "key_topics": ins.key_topics,
            "knowledge_gaps": ins.knowledge_gaps,
            "connections": ins.connections,
            "briefing": ins.briefing,
        }


async def save_insights(user_id: str, data: dict):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Insights).where(Insights.user_id == user_id))
        existing = result.scalar_one_or_none()
        if existing:
            await db.execute(
                update(Insights).where(Insights.user_id == user_id)
                .values(
                    key_topics=data.get("key_topics", []),
                    knowledge_gaps=data.get("knowledge_gaps", []),
                    connections=data.get("connections", []),
                    briefing=data.get("briefing", ""),
                )
            )
        else:
            db.add(Insights(
                id=str(uuid.uuid4()),
                user_id=user_id,
                key_topics=data.get("key_topics", []),
                knowledge_gaps=data.get("knowledge_gaps", []),
                connections=data.get("connections", []),
                briefing=data.get("briefing", ""),
            ))
        await db.commit()
