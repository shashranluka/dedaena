"""
Dedaena FastAPI Application
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import routes_dedaena, auth, admin, moderator  # ✅


# FastAPI App
app = FastAPI(
    title="Dedaena API",
    description="Georgian Learning Platform API",
    version="1.0.0",
    docs_url="/api/docs",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,       # credentials (cookies, auth headers) ნებადართულია
    allow_methods=["*"],          # ყველა HTTP მეთოდი ნებადართულია (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],          # ყველა header ნებადართულია
)


@app.post("/api/health")
def health_check():
    """Health check endpoint"""
    print("Health check requested")
    return {"status": "healthy"}


# ✅ Routes Registration
# Auth routes - ავტორიზაცია/რეგისტრაცია
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Admin routes - ადმინის პანელი
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# ✅ Moderator routes - მოდერაციის endpoint-ები
# ყველა route იქნება /api/moderator/* ფორმატით
app.include_router(moderator.router, prefix="/api/moderator", tags=["Moderator"])

# Dedaena routes - დედაენას მონაცემები (საჯარო)
app.include_router(routes_dedaena.router, prefix="/api/dedaena", tags=["Dedaena"])


# Database კავშირის პარამეტრები გარემოს ცვლადებიდან ან default მნიშვნელობებით
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")      # PostgreSQL სერვერის მისამართი
DB_NAME = os.getenv("POSTGRES_DB", "dedaena_db")       # მონაცემთა ბაზის სახელი
DB_USER = os.getenv("POSTGRES_USER", "postgres")       # მომხმარებლის სახელი
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")   # პაროლი


@app.get("/api/moderator")
def moderator_root():
    """Moderator root endpoint"""
    print("Moderator root endpoint requested")
    return {"message": "Moderator API", "version": "1.0.0"}


# Root endpoint
@app.get("/api")
def root():
    """Root endpoint"""
    print("Root endpoint requested")
    return {"message": "Dedaena API", "version": "1.0.0"}


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "healthy"}