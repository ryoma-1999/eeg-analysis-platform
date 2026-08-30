from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.routers import eeg


app = FastAPI(
    title="EEG Analysis API",
    version="0.1.0",
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)


# -------------------------
# CORS
# -------------------------

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Router
# -------------------------

app.include_router(
    eeg.router,
    prefix="/api/eeg",
    tags=["EEG"],
)


# -------------------------
# Basic API
# -------------------------

@app.get("/")
def root():
    return {
        "message": "EEG Analysis API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }