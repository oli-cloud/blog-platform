from fastapi import APIRouter
from app.api.v1.endpoints import auth, posts
from app.api.v1.endpoints.comments import router as comments_router
from app.api.v1.endpoints.taxonomy import categories_router, tags_router
from app.api.v1.endpoints import users
from app.api.v1.endpoints import admin
from app.api.v1.endpoints import media

router = APIRouter()
router.include_router(auth.router, prefix='/auth', tags=['authentication'])
router.include_router(posts.router, prefix='/posts', tags=['posts'])
router.include_router(comments_router, tags=['comments'])
router.include_router(categories_router, prefix='/categories', tags=['categories'])
router.include_router(tags_router, prefix='/tags', tags=['tags'])
router.include_router(users.router, prefix='/users', tags=['users'])
router.include_router(admin.router, prefix='/admin', tags=['administration'])
router.include_router(media.router, prefix='/media', tags=['media'])
