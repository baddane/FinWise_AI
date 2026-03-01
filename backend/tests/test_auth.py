import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_register_user():
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "testpassword123", "full_name": "Test User"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


def test_register_duplicate_email():
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "anotherpassword"},
    )
    assert response.status_code == 400


def test_login():
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "test@example.com", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password():
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "testpassword123"},
    )
    response = client.post(
        "/api/auth/login",
        data={"username": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
