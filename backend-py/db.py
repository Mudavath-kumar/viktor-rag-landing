"""
Async SQLAlchemy database layer — maps to the existing Neon Postgres schema.
We DO NOT create or alter tables here; we only map to what already exists.
"""
import uuid
from datetime import datetime
from typing import AsyncGenerator

import sqlalchemy
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, JSON, Integer, Float
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, TIMESTAMP
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

import config

# ─── Engine & Session ─────────────────────────────────────────────────────────

engine = create_async_engine(
    config.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Base ─────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─── Models — mapped to existing tables ───────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    last_login_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    knowledge_bases: Mapped[list["KnowledgeBase"]] = relationship("KnowledgeBase", back_populates="owner", cascade="all, delete")
    chat_sessions: Mapped[list["ChatSession"]] = relationship("ChatSession", back_populates="user", cascade="all, delete")


class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    owner_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    owner: Mapped["User"] = relationship("User", back_populates="knowledge_bases")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="knowledge_base", cascade="all, delete")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    kb_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), ForeignKey("knowledge_bases.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False, default="")
    file_type: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    mime_type: Mapped[str] = mapped_column(String(100), nullable=True)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="processing")
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    page_count: Mapped[int] = mapped_column(Integer, nullable=True)
    doc_metadata: Mapped[dict] = mapped_column(JSONB, name="metadata", nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    processed_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    knowledge_base: Mapped["KnowledgeBase"] = relationship("KnowledgeBase", back_populates="documents")


class ChatSession(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False, default="New Chat")
    document_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), nullable=True)
    document_name: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="chat_sessions")
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", 
        back_populates="session", 
        cascade="all, delete", 
        order_by="ChatMessage.created_at",
        primaryjoin="ChatSession.id == ChatMessage.conversation_id",
        foreign_keys="[ChatMessage.conversation_id]"
    )


class ChatMessage(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=True)
    citations: Mapped[dict] = mapped_column(JSONB, nullable=True)
    msg_metadata: Mapped[dict] = mapped_column(JSONB, name="metadata", nullable=False, default=dict)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages",
                                                   primaryjoin="ChatMessage.conversation_id == ChatSession.id",
                                                   foreign_keys="[ChatMessage.conversation_id]")


class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    key_points: Mapped[list] = mapped_column(JSON, default=list)
    topics: Mapped[list] = mapped_column(JSON, default=list)
    tldr: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    questions: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Insights(Base):
    __tablename__ = "insights"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    key_topics: Mapped[list] = mapped_column(JSON, default=list)
    knowledge_gaps: Mapped[list] = mapped_column(JSON, default=list)
    connections: Mapped[list] = mapped_column(JSON, default=list)
    briefing: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ─── Init — only creates tables that don't exist yet ──────────────────────────

import asyncio


async def init_db():
    """
    Create ALL tables if they don't exist yet, and ensure schema migration.
    Safe to run on both fresh and existing Neon databases (uses checkfirst=True).
    """
    all_tables = [
        User.__table__,
        KnowledgeBase.__table__,
        Document.__table__,
        ChatSession.__table__,
        ChatMessage.__table__,
        Summary.__table__,
        Quiz.__table__,
        Insights.__table__,
    ]

    async def _create():
        async with engine.begin() as conn:
            for tbl in all_tables:
                await conn.run_sync(
                    lambda c, t=tbl: Base.metadata.create_all(c, tables=[t], checkfirst=True)
                )
            # Ensure columns exist on conversations table
            await conn.execute(sqlalchemy.text(
                "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS document_id UUID;"
            ))
            await conn.execute(sqlalchemy.text(
                "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS document_name VARCHAR(500);"
            ))

    try:
        await asyncio.wait_for(_create(), timeout=30.0)
        print("[OK] All DB tables ready.")
    except asyncio.TimeoutError:
        print("[WARN] DB init timed out — will continue anyway.")
    except Exception as e:
        print(f"[WARN] DB init: {e}")

