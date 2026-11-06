import io
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import Media, User

router = APIRouter()
settings = get_settings()
ALLOWED_MIME = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}

@router.post('/upload')
def upload_media(file: UploadFile = File(...), post_id: uuid.UUID | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail='Only JPEG, PNG, WebP, and GIF images are allowed')
    content = file.file.read(settings.max_upload_bytes + 1)
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail='Image exceeds the maximum allowed size')
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        image = Image.open(io.BytesIO(content))
        width, height = image.size
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail='Invalid image file')

    key = f'{uuid.uuid4().hex}{Path(file.filename or "upload").suffix.lower()}'
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / key).write_bytes(content)
    public_url = f'/uploads/{key}'
    media = Media(uploader_id=user.id, post_id=post_id, storage_provider='local', storage_key=key,
                  public_url=public_url, original_filename=Path(file.filename or 'upload').name,
                  mime_type=file.content_type, byte_size=len(content), width=width, height=height)
    db.add(media)
    db.commit()
    db.refresh(media)
    return {'id': media.id, 'url': public_url, 'width': width, 'height': height}

@router.delete('/{media_id}', status_code=204)
def delete_media(media_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    media = db.get(Media, media_id)
    if media is None:
        raise HTTPException(status_code=404, detail='Media not found')
    if media.uploader_id != user.id and user.role.value != 'admin':
        raise HTTPException(status_code=403, detail='You cannot delete this media')
    path = Path(settings.upload_dir) / media.storage_key
    if path.exists():
        path.unlink()
    db.delete(media)
    db.commit()
    return None
