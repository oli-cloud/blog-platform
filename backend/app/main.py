from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.api.v1.router import router as api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models import *  # noqa: F401,F403

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(api_router, prefix='/api/v1')
app.mount('/uploads', StaticFiles(directory=settings.upload_dir), name='uploads')


@app.exception_handler(Exception)
async def secure_exception_handler(request: Request, exc: Exception):
    if settings.debug:
        return JSONResponse(status_code=500, content={'detail': str(exc), 'code': 'INTERNAL_ERROR'})
    return JSONResponse(status_code=500, content={'detail': 'An internal error occurred', 'code': 'INTERNAL_ERROR'})


@app.get('/health')
def health():
    return {'status': 'ok'}
