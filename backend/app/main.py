"""
Dedaena FastAPI Application
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import routes_dedaena, auth, admin, moderator  # ✅
from dotenv import load_dotenv

# ✅ .env ფაილის ჩატვირთვა
load_dotenv()

# FastAPI App
app = FastAPI(
    title="Dedaena API",
    description="Georgian Learning Platform API",
    version="1.0.0",
    docs_url=None,
)

# CORS Middleware
origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.post("/api/health")
# def health_check():
#     """Health check endpoint"""
#     print("Health check requested")
#     return {"status": "healthy"}

@app.get("/docs")
def custom_swagger_ui():
    """Custom Swagger UI endpoint"""
    print("Swagger UI requested")
    return {"message": "Swagger UI is disabled in this deployment."}

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


# ✅ Database კავშირის პარამეტრები .env-დან
DB_HOST = os.getenv("POSTGRES_HOST")
DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD")


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