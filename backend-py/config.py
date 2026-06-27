import os
from urllib.parse import unquote
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Decoded DB connection params
_db_url = DATABASE_URL or ""
DB_USER = DB_PASSWORD = DB_HOST = DB_PORT = DB_NAME = ""
if _db_url.startswith("postgresql://"):
    try:
        rest = _db_url[len("postgresql://"):]
        if "@" in rest:
            user_pass, host_port_db = rest.split("@", 1)
            if ":" in user_pass:
                user, pass_encoded = user_pass.split(":", 1)
                DB_USER = user
                DB_PASSWORD = unquote(pass_encoded)
            else:
                DB_USER = user_pass
            
            if "/" in host_port_db:
                host_port, DB_NAME = host_port_db.split("/", 1)
            else:
                host_port = host_port_db
            
            if ":" in host_port:
                DB_HOST, DB_PORT = host_port.split(":", 1)
            else:
                DB_HOST = host_port
                DB_PORT = "5432"
    except Exception as e:
        print(f"Error parsing DATABASE_URL: {e}")
