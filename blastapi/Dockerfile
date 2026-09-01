FROM python:3.12-slim

WORKDIR /app
COPY api/requirements.txt api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

COPY api api
COPY physics physics

# Render/Railway/Fly inject $PORT; default to 8000 for local docker run.
ENV PORT=8000
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
