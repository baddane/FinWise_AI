# Vercel serverless entry point — imports the FastAPI ASGI app.
# Vercel adds the project root (backend/) to sys.path automatically,
# so the `app` package is importable from here.
from app.main import app  # noqa: F401
