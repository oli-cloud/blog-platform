# Phase 1 — System Architecture and Data/API Design

## 1. System Architecture

The platform is a two-tier web application with a React single-page application and a FastAPI REST API.

```text
Browser / React SPA
  -> React Router + Axios + TanStack Query
  -> REST API over HTTPS (/api/v1)

FastAPI
  -> API endpoints / request validation
  -> Services (authorization and business rules)
  -> Repositories (SQLAlchemy persistence)
  -> PostgreSQL

FastAPI media service
  -> Local filesystem in development or cloud object storage in production
```

### Separation of concerns

- **API endpoints** handle HTTP parsing, status codes, authentication dependencies, and responses only.
- **Schemas** define Pydantic request/response contracts and validation.
- **Services** own business workflows such as publishing, ownership checks, password reset, moderation, and refresh-token rotation.
- **Repositories** isolate SQLAlchemy queries and transactions.
- **Models** map normalized PostgreSQL tables.
- **Core** owns configuration, JWT/password security, and reusable dependencies.
- **Middleware** owns cross-cutting concerns such as request IDs, security headers, CORS, and rate limiting.
- **Frontend services** isolate API calls; hooks/features own server and local UI state.

## 2. Backend Module Responsibilities

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── db/
│   │   ├── session.py
│   │   └── base.py
│   ├── models/
│   ├── schemas/
│   ├── api/v1/endpoints/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   └── utils/
├── alembic/
├── tests/
├── uploads/
├── requirements.txt
├── alembic.ini
└── .env.example
```

## 3. Frontend Module Responsibilities

```text
frontend/
├── src/
│   ├── app/
│   ├── components/common/
│   ├── components/layout/
│   ├── components/blog/
│   ├── components/dashboard/
│   ├── features/{auth,posts,comments,likes,categories,users,admin}/
│   ├── hooks/
│   ├── services/
│   ├── routes/
│   ├── types/
│   ├── utils/
│   └── main.tsx
├── public/
├── package.json
└── vite.config.ts
```

## 4. Authentication and Authorization Model

- Passwords are hashed with Argon2; plaintext passwords are never persisted.
- Login returns short-lived JWT access tokens and an opaque refresh token.
- Refresh tokens are stored server-side with expiry, hash, and revocation state; refresh rotates and revokes the old token.
- A logout revokes the presented refresh-token family.
- Public authentication endpoints use strict validation and rate limiting.
- Password-reset tokens are random, single-use, time-limited, and stored only by hash.
- FastAPI dependencies supply the current user and role guards.
- Resource mutations verify both authentication and ownership or administrator privileges.
- The frontend mirrors route permissions, but the backend remains the authoritative security boundary.

### Roles

- `guest`: no account required
- `user`: registered account; own-resource management
- `admin`: full moderation, administration, and analytics access

## 5. Database Schema

Use PostgreSQL, UUID primary keys, UTC timestamps, soft deletion through `deleted_at`, and foreign-key indexes.

### `users`

| Column | Type / Constraints | Purpose |
|---|---|---|
| id | UUID, PK | Identity |
| email | VARCHAR(320), unique, indexed | Login and notifications |
| username | VARCHAR(30), unique, indexed | Public identity |
| display_name | VARCHAR(100) | Profile display |
| bio | TEXT, nullable | Profile biography |
| avatar_url | VARCHAR(2048), nullable | Profile image |
| password_hash | VARCHAR(255) | Argon2 hash |
| role | ENUM, default `user` | RBAC role |
| status | ENUM, default `active` | Active/suspended/deleted account |
| created_at | TIMESTAMPTZ, indexed | Creation time |
| updated_at | TIMESTAMPTZ | Update time |
| deleted_at | TIMESTAMPTZ, nullable, indexed | Soft deletion |

### `posts`

| Column | Type / Constraints | Purpose |
|---|---|---|
| id | UUID, PK | Identity |
| author_id | UUID, FK users.id, indexed | Author |
| title | VARCHAR(180), indexed | Article title |
| slug | VARCHAR(220), unique, indexed | Public URL |
| excerpt | VARCHAR(500) | Summary |
| content | TEXT | Markdown body |
| featured_image_url | VARCHAR(2048), nullable | Article image |
| status | ENUM, default `draft` | Draft/published/archived |
| published_at | TIMESTAMPTZ, nullable, indexed | Scheduled/publication time |
| created_at | TIMESTAMPTZ, indexed | Creation time |
| updated_at | TIMESTAMPTZ | Update time |
| deleted_at | TIMESTAMPTZ, nullable, indexed | Soft deletion |

Recommended indexes: `(status, published_at)`, `(author_id, status)`, and full-text indexes on title/content only if implemented in later migration phases.

### `categories`

| Column | Type / Constraints |
|---|---|
| id | UUID, PK |
| name | VARCHAR(80), unique |
| slug | VARCHAR(100), unique, indexed |
| description | VARCHAR(500), nullable |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ, nullable |

### `tags`

| Column | Type / Constraints |
|---|---|
| id | UUID, PK |
| name | VARCHAR(80), unique |
| slug | VARCHAR(100), unique, indexed |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ, nullable |

### `post_categories`

Composite primary key `(post_id, category_id)`. Both columns are UUID foreign keys; one post belongs to one primary category at present, while later design can retain this many-to-many mapping.

### `post_tags`

Composite primary key `(post_id, tag_id)`. Both columns are UUID foreign keys and cascade on post/tag deletion where appropriate.

### `comments`

| Column | Type / Constraints | Purpose |
|---|---|---|
| id | UUID, PK | Identity |
| post_id | UUID, FK posts.id, indexed | Parent post |
| author_id | UUID, FK users.id, indexed | Comment author |
| parent_id | UUID, FK comments.id, nullable, indexed | Threaded reply |
| body | TEXT | Comment content |
| status | ENUM, default `visible` | Visible/hidden/deleted |
| created_at | TIMESTAMPTZ, indexed | Creation time |
| updated_at | TIMESTAMPTZ | Update time |
| deleted_at | TIMESTAMPTZ, nullable | Soft deletion |

Recommended index: `(post_id, status, created_at)`.

### `likes`

Composite primary key `(user_id, post_id)`. Both UUID foreign keys and indexed individually through the composite and reverse key constraints. A user may create only one row per post.

### `media`

| Column | Type / Constraints | Purpose |
|---|---|---|
| id | UUID, PK | Identity |
| uploader_id | UUID, FK users.id, indexed | Owner/uploader |
| post_id | UUID, FK posts.id, nullable, indexed | Optional associated post |
| storage_provider | ENUM | `local` or `cloud` |
| storage_key | VARCHAR(2048), unique | Provider key or local path |
| public_url | VARCHAR(2048), unique | Accessible URL |
| original_filename | VARCHAR(255) | Safe original name |
| mime_type | VARCHAR(100) | Validated MIME type |
| byte_size | BIGINT | File size |
| width | INTEGER, nullable | Image width |
| height | INTEGER, nullable | Image height |
| created_at | TIMESTAMPTZ, indexed | Upload time |
| deleted_at | TIMESTAMPTZ, nullable | Soft deletion |

### `refresh_tokens`

| Column | Type / Constraints | Purpose |
|---|---|---|
| id | UUID, PK | Identity |
| user_id | UUID, FK users.id, indexed | Token owner |
| token_hash | CHAR(64), unique, indexed | SHA-256 digest |
| expires_at | TIMESTAMPTZ, indexed | Expiry |
| revoked_at | TIMESTAMPTZ, nullable, indexed | Rotation/revocation |
| replaced_by_id | UUID, FK refresh_tokens.id, nullable | Rotation lineage |
| created_at | TIMESTAMPTZ | Issue time |
| last_used_at | TIMESTAMPTZ, nullable | Rotation/audit data |

## 6. Relationships

- A user creates many posts; every post has one author.
- A user owns many comments; every comment belongs to one post and optionally one parent comment.
- A user has many likes, but the `(user_id, post_id)` unique pair permits at most one like per post.
- Posts and categories are many-to-many through `post_categories`.
- Posts and tags are many-to-many through `post_tags`.
- Media may be associated with one uploader and optionally one post.
- Refresh tokens belong to users and form a replaceable rotation chain.

## 7. Soft Deletion and Integrity Rules

- Normal queries exclude rows with `deleted_at` unless specifically intended for moderation.
- Post/category/tag delete operations should reject or archive associations when required for referential integrity.
- Unique constraints remain enforced for active and soft-deleted rows; the application uses slugs as immutable public identifiers and recreates slugs for reused names.
- Database cascades are limited to join records and user-owned data. Security-sensitive deletion is handled in services, with audit/logging where appropriate.
- All timestamp columns are timezone-aware UTC values.

## 8. REST API Design

All routes are versioned beneath `/api/v1`.

### Authentication

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| POST | `/auth/register` | Public | Create user |
| POST | `/auth/login` | Public | Return access/refresh tokens |
| POST | `/auth/refresh` | Public, refresh-token proof | Rotate refresh token and return new pair |
| POST | `/auth/logout` | Authenticated | Revoke refresh token/session |
| POST | `/auth/forgot-password` | Public | Request generic-response password reset |
| POST | `/auth/reset-password` | Public, reset-token proof | Set a new password |
| GET | `/auth/me` | Authenticated | Return current user |

### Posts

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| GET | `/posts` | Public/optional auth | Paginated filterable listing; drafts excluded to unauthorized callers |
| GET | `/posts/{slug}` | Public/optional auth | Return published post or authorized draft/archived post |
| POST | `/posts` | User | Create draft/post |
| PUT | `/posts/{id}` | Owner/admin | Replace editable fields and associations |
| DELETE | `/posts/{id}` | Owner/admin | Soft-delete post |
| PATCH | `/posts/{id}/publish` | Owner/admin | Validate then publish or schedule |
| PATCH | `/posts/{id}/unpublish` | Owner/admin | Return post to draft or archived state |

### Comments and likes

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| GET | `/posts/{id}/comments` | Public | Paginated visible threaded comments |
| POST | `/posts/{id}/comments` | User | Create comment/reply |
| PUT | `/comments/{id}` | Owner/admin | Edit comment body |
| DELETE | `/comments/{id}` | Owner/admin | Soft-hide/delete comment |
| POST | `/posts/{id}/like` | User | Idempotently add like |
| DELETE | `/posts/{id}/like` | User | Idempotently remove like |

### Taxonomy

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| GET | `/categories` | Public | List categories |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/{id}` | Admin | Update category |
| DELETE | `/categories/{id}` | Admin | Soft-delete unused category |
| GET | `/tags` | Public | List tags |
| POST | `/tags` | Admin | Create tag |
| PUT | `/tags/{id}` | Admin | Update tag |
| DELETE | `/tags/{id}` | Admin | Soft-delete unused tag |

### Media and users

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| POST | `/media/upload` | User | Multipart image validation and upload |
| DELETE | `/media/{id}` | Owner/admin | Delete uploaded media |
| GET | `/users/{id}` | Public | Public profile |
| PUT | `/users/me` | User | Update own profile |
| GET | `/users/me/posts` | User | List own posts in every status |

### Administration

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | Real aggregate counts/analytics from database |
| GET | `/admin/users` | Admin | Paginated user search/status list |
| GET | `/admin/posts` | Admin | Paginated all-status post moderation list |
| GET | `/admin/comments` | Admin | Paginated comment moderation queue |
| PATCH | `/admin/users/{id}/role` | Admin | Change role |
| PATCH | `/admin/users/{id}/status` | Admin | Suspend/reactivate/deactivate account |

## 9. Common API Contracts

- Pagination: `page` (default 1), `page_size` (default 20, bounded) and response metadata containing `items`, `total`, `page`, and `page_size`.
- Filtering/sorting: explicit query parameters; sort values are allowlisted.
- Errors: consistent JSON body with `detail`, machine-readable `code`, optional `field_errors`, and request ID.
- Validation: Pydantic 422 responses are normalized; route handlers do not leak database exceptions.
- Authentication: bearer access token in `Authorization`; refresh operations use opaque refresh-token credentials.
- CORS: allow listed frontend origins only from environment configuration.
- Rate limiting: apply per IP/account to login, registration, password-reset, media upload, and comment creation.
- API URLs and storage URLs use environment configuration rather than secrets in frontend code.

## 10. Security Controls

- SQLAlchemy parameterized queries and migrations.
- Zod/React Hook Form and Pydantic schema validation.
- Protected route guards and backend RBAC checks.
- MIME, extension, signature, dimension, and size validation for uploads.
- Unique generated storage names and no client-controlled storage paths.
- Restricted image transformations and safe Markdown rendering.
- Secret values through backend environment variables; `.env.example` contains empty/example values only.
- Security headers, rate limiting, short access-token lifetime, refresh-token rotation, and generic password-reset responses.

## 11. Testing Strategy for Later Phases

- Backend API, service, authorization, migration, authentication, upload, like/comment, and database constraint tests with isolated PostgreSQL or test database.
- Frontend Vitest and React Testing Library for forms, protected routes, loading/error/empty states, and key components.
- Integration tests against an actual running API and database before deployment.

## 12. Deployment Shape

Production consists of frontend build served by Nginx, FastAPI behind Nginx, PostgreSQL, and persistent media storage. Docker Compose initially coordinates local services; persistent database/media volumes are required. Alembic migrations run before application traffic, and environment-specific secrets remain outside source control.

## 13. Phase 1 Exit Criteria

- Directory structure exists for both applications.
- Core architecture and module responsibilities are documented.
- Database entities, keys, constraints, relationships, and indexes are defined.
- Public and administrative API contracts are documented.
- Authentication, authorization, validation, error, media, and rate-limit boundaries are established.

No application implementation is included in this phase; implementation begins in Phase 2 after review.
