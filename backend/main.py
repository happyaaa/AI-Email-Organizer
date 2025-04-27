from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from auth import router as auth_router
from mail import router as mail_router
# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Email Organizer API",
    description="Backend API for AI Email Organizer application",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the auth router
app.include_router(auth_router, prefix="/api/auth")
app.include_router(mail_router, prefix="/api/mail")

@app.get("/")
async def root():
    return {"message": "Welcome to AI Email Organizer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
