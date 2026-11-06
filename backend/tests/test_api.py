from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def register_user(email='api@example.com', username='apiuser'):
    response = client.post('/api/v1/auth/register', json={
        'email': email,
        'username': username,
        'password': 'secure-password-123',
        'display_name': 'API User',
    })
    assert response.status_code in (201, 409)
    login = client.post('/api/v1/auth/login', json={'email': email, 'password': 'secure-password-123'})
    assert login.status_code == 200
    return login.json()['access_token']


def auth_headers(token):
    return {'Authorization': f'Bearer {token}'}


def test_health():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_register_login_and_me():
    token = register_user()
    response = client.get('/api/v1/auth/me', headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()['email'] == 'api@example.com'


def test_post_crud_and_like():
    token = register_user('posts@example.com', 'postuser')
    headers = auth_headers(token)
    created = client.post('/api/v1/posts', headers=headers, json={'title': 'A verified article', 'content': '# Hello'})
    assert created.status_code == 201
    post_id = created.json()['id']

    liked = client.post(f'/api/v1/posts/{post_id}/like', headers=headers)
    assert liked.status_code == 204
    unliked = client.delete(f'/api/v1/posts/{post_id}/like', headers=headers)
    assert unliked.status_code == 204

    deleted = client.delete(f'/api/v1/posts/{post_id}', headers=headers)
    assert deleted.status_code == 204
