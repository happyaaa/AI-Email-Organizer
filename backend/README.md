# AI Email Organizer Backend

This is the FastAPI backend for the AI Email Organizer application.

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file:

```bash
cp .env.example .env
```

Then edit the `.env` file with your actual configuration values.


## Running the Server

To run the development server:

create the .env file using params from the google doc

```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

- `main.py`: Main FastAPI application
- `models.py`: SQLAlchemy models
- `schemas.py`: Pydantic models for request/response validation
- `database.py`: Database configuration
- `requirements.txt`: Python dependencies
