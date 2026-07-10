# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# Added --no-cache-dir to keep image small
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared utils first (for logger and other shared utilities)
COPY utils/ ./utils/

# Copy the rest of the code
COPY . .

RUN mkdir -p /app/src/db/data && \
    chmod 777 /app/src/db/data

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable to ensure output is flushed immediately
ENV PYTHONUNBUFFERED=1

# Run server.py when the container launches
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]