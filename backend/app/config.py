from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    anthropic_api_key: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: list[str] = ["http://localhost:3000"]
    # En production Railway, mettre l'URL publique du frontend
    # ex: CORS_ORIGINS=["https://finwise-frontend.up.railway.app"]

    class Config:
        env_file = ".env"


settings = Settings()
