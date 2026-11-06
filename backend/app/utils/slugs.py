import re
import uuid


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-')[:220] or uuid.uuid4().hex


def unique_slug(value: str, exists) -> str:
    base = slugify(value)
    candidate = base
    while exists(candidate):
        candidate = f'{base}-{uuid.uuid4().hex[:8]}'
    return candidate
