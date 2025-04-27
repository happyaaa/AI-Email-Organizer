from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, Response
from msal import ConfidentialClientApplication
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Microsoft Graph API configuration
CLIENT_ID = os.getenv("APPLICATION_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
AUTHORITY = "https://login.microsoftonline.com/common"
REDIRECT_URI = "http://localhost:8000/api/auth/callback"
SCOPES = ["Mail.Read", "Mail.ReadWrite", "Mail.Send", "User.Read"]

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
async def auth_callback(code: str, response: Response):
    try:
        result = msal_app.acquire_token_by_authorization_code(
            code,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        token = result["access_token"]

        # Create redirect response first
        redirect_response = RedirectResponse(url="http://localhost:3000/mail")

        # Set the token as a cookie (secure, HTTP-only)
        redirect_response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/",
        )

        return redirect_response

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
