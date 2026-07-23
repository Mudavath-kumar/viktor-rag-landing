from pydantic import BaseModel
from typing import Optional


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    user: Optional[dict] = None
    token: Optional[str] = None
    error: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    content: str


class CreateSessionRequest(BaseModel):
    user_id: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
