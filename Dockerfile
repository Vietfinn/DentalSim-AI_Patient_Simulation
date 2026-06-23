FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /code

# Copy requirements from backend and install python dependencies
COPY ./backend/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy backend codebase
COPY ./backend /code

# Copy data and assets folders to root so path resolution works (/assets and /data)
COPY ./data /data
COPY ./assets /assets

# Grant full read/write permissions for Hugging Face non-root user (1000)
RUN chmod -R 777 /code /assets /data

# Expose default Hugging Face Space port
EXPOSE 7860

# Start Uvicorn ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
