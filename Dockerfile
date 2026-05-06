# syntax=docker/dockerfile:1.7

############################
# Builder
############################
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1 \
    PATH="/root/.local/bin:$PATH"

# Build-time deps only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

WORKDIR /app

# Copy only dependency files first for better cache
COPY requirements.txt ./

# Create a virtual environment and install deps
RUN uv venv /opt/venv && \
    . /opt/venv/bin/activate && \
    uv pip install --python /opt/venv/bin/python --no-cache-dir -r requirements.txt

############################
# Runtime
############################
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000

# Runtime shared libraries for cv2 / onnx / image handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY . .

# Railway listens on $PORT
EXPOSE 8000

# Run as non-root
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]