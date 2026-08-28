from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.services.guest_lock import GuestWriteMiddleware
from app.services.rate_limit import RateLimitMiddleware
from app.services.security_headers import SecurityHeadersMiddleware
from app.version import APP_VERSION

app = FastAPI(
    title="CiteAlpha GCI API",
    description="Guidance Credibility Index — management promises vs delivery",
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GuestWriteMiddleware)

app.include_router(router)
