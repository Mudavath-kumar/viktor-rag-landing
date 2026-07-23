import os
from dotenv import load_dotenv

load_dotenv()

# ─── Database (Neon Postgres) ─────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "")

# ─── Qdrant Cloud ─────────────────────────────────────────────────────────────
QDRANT_HOST = os.getenv("QDRANT_HOST", "http://localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "viktor_documents_v2")
VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", "384"))

# ─── Embedding Model ──────────────────────────────────────────────────────────
# all-MiniLM-L6-v2: fast 384-dim model, small download (~90MB), works offline
EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")

# ─── xAI / Grok ──────────────────────────────────────────────────────────────
XAI_API_KEY = os.getenv("XAI_API_KEY", "")
XAI_MODEL = os.getenv("XAI_MODEL", "grok-2-latest")
XAI_TEMPERATURE = float(os.getenv("XAI_TEMPERATURE", "0.1"))
XAI_MAX_TOKENS = int(os.getenv("XAI_MAX_TOKENS", "1200"))

# ─── File Storage ─────────────────────────────────────────────────────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "250"))

# ─── Auth / Security ──────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-random-secret-key")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))

# ─── Legacy (not used) ────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
