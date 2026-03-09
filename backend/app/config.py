from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = ""
    gemini_api_key: str = ""
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    # Plain string to prevent pydantic-settings from auto-JSON-decoding it.
    # Accepts: "*", "https://a.com", or "https://a.com,https://b.com"
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    def get_cors_origins(self) -> list[str]:
        v = self.cors_origins.strip()
        if not v or v == "*":
            return ["*"]
        return [o.strip() for o in v.split(",") if o.strip()]


settings = Settings()
