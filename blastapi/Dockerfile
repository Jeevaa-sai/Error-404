FROM python:3.12-slim

# Build context is the REPO ROOT (see dockerContext in render.yaml), so that
# the single top-level requirements.txt is reachable — Docker cannot COPY
# from outside its build context.
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY blastapi/api api
COPY blastapi/physics physics

# Render/Railway/Fly inject $PORT; default to 8000 for local docker run.
ENV PORT=8000
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
