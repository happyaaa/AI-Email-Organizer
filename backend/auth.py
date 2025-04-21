from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from msal import ConfidentialClientApplication
import os
from dotenv import load_dotenv

load_dotenv()

# Create a router instead of FastAPI app
router = APIRouter(prefix="/auth", tags=["auth"])

# Microsoft Graph API configuration
CLIENT_ID = os.getenv("APPLICATION_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
AUTHORITY = "https://login.microsoftonline.com/common"
REDIRECT_URI = "http://localhost:3000/auth/callback"
SCOPES = ["Mail.Read", "Mail.ReadWrite", "User.Read"]

msal_app = ConfidentialClientApplication(
    CLIENT_ID,
    authority=AUTHORITY,
    client_credential=CLIENT_SECRET
)


@router.get("/login")
async def login():
    auth_url = msal_app.get_authorization_request_url(
        SCOPES,
        redirect_uri=REDIRECT_URI
    )
    return {"url": auth_url}


@router.get("/callback")
async def auth_callback(code: str):
    try:
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"access_token": result["access_token"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
