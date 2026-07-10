FROM python:3.11-slim

WORKDIR /app

# Install FastAPI, Uvicorn, and Rich for logging
RUN pip install fastapi uvicorn rich

# Copy shared utils from root directory (for logger)
COPY utils/ ./utils/

# Copy the dashdoor app code
COPY dashdoor/ ./

# Run the server on port 8001 (to avoid conflict with 8000)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]