from fastapi import APIRouter, Request, HTTPException
from typing import Optional
import httpx
from pydantic import BaseModel
from urllib.parse import unquote
from cachetools import TTLCache

oid_token_cache = TTLCache(maxsize=1000, ttl=3600)

router = APIRouter()

GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"


class SearchRequest(BaseModel):
    query: str
    folder_id: Optional[str] = None
    top: Optional[int] = 10


class EmailRequest(BaseModel):
    to: str
    subject: str
    content: str


class ReplyRequest(BaseModel):
    message_id: str
    content: str


async def get_token_from_header(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]

        # Try to decode token and extract oid
        try:
            import jwt
            # Decode without verifying (you should verify in prod!)
            payload = jwt.decode(token, options={"verify_signature": False})
            oid = payload.get("oid")
            if oid:
                print("oid from token:", oid, flush=True)
                oid_token_cache[oid] = token  # Cache for fallback
        except Exception as e:
            print("Warning: Failed to decode token:", e)

        return token

    # Fallback for Copilot agent
    oid = request.headers.get("x-ms-client-object-id")
    if oid:
        print("oid from copilot:", oid, flush=True)
        cached_token = oid_token_cache.get(oid)
        if cached_token:
            return cached_token

    raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid token and no fallback available")


@router.get("/")
async def get_mail(request: Request, folder_id: str = None):
    token = await get_token_from_header(request)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    url = f"{GRAPH_API_ENDPOINT}/me/messages"
    if folder_id:
        url = f"{GRAPH_API_ENDPOINT}/me/mailFolders/{folder_id}/messages"

    async with httpx.AsyncClient() as client:
        graph_response = await client.get(url, headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(
            status_code=graph_response.status_code, detail="Failed to fetch mails")

    return graph_response.json()

@router.get("/test")
async def test(request: Request):
    # Print all request headers for debugging
    print("=== Incoming Headers ===")
    for key, value in request.headers.items():
        print(f"{key}: {value}")
    token = await get_token_from_header(request)

    # Return only the first 5 characters of the token
    return {"token_prefix": token[:5]}



@router.post("/search")
async def search_mail(request: Request, search_params: SearchRequest):
    token = await get_token_from_header(request)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    endpoint = f"{GRAPH_API_ENDPOINT}/me/messages"
    params = {
        "$search": f'"{search_params.query}"',
        "$top": search_params.top,
        "$select": "id,subject,from,receivedDateTime,bodyPreview,isRead,body"
    }

    if search_params.folder_id:
        endpoint = f"{GRAPH_API_ENDPOINT}/me/mailFolders/{search_params.folder_id}/messages"

    async with httpx.AsyncClient() as client:
        response = await client.get(endpoint, headers=headers, params=params)

    if response.status_code != 200:
        error_body = response.json()
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Graph API error: {error_body.get('error', {}).get('message', 'Unknown error')}"
        )

    return response.json()


@router.post("/reply/{message_id}")
async def reply_mail(request: Request, message_id: str, reply_data: ReplyRequest):
    token = await get_token_from_header(request)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    endpoint = f"{GRAPH_API_ENDPOINT}/me/messages/{message_id}/reply"
    data = {"comment": reply_data.content}

    async with httpx.AsyncClient() as client:
        response = await client.post(endpoint, headers=headers, json=data)

    if response.status_code != 202:
        raise HTTPException(status_code=response.status_code, detail="Failed to reply to email")

    return {"message": "Reply sent successfully"}


@router.post("/compose")
async def compose_mail(request: Request, email_data: EmailRequest):
    token = await get_token_from_header(request)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    message = {
        "subject": email_data.subject,
        "body": {"contentType": "text", "content": email_data.content},
        "toRecipients": [{"emailAddress": {"address": email_data.to}}]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{GRAPH_API_ENDPOINT}/me/sendMail", headers=headers, json={"message": message})

    if response.status_code != 202:
        try:
            error_data = response.json()
            error_message = error_data.get('error', {}).get('message', 'Unknown error')
        except Exception:
            error_message = f"Failed with status code: {response.status_code}"
        raise HTTPException(status_code=response.status_code, detail=error_message)

    return {"message": "Email sent successfully"}


@router.delete("/{message_id}")
async def delete_mail(message_id: str, request: Request):
    token = await get_token_from_header(request)
    decoded_message_id = unquote(message_id)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    url = f"{GRAPH_API_ENDPOINT}/me/messages/{decoded_message_id}"

    async with httpx.AsyncClient() as client:
        graph_response = await client.delete(url, headers=headers)

    if graph_response.status_code != 204:
        raise HTTPException(status_code=graph_response.status_code, detail="Failed to delete mail")

    return {"message": "Mail deleted successfully"}


@router.get("/folders")
async def get_mail_folders(request: Request):
    token = await get_token_from_header(request)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        graph_response = await client.get(f"{GRAPH_API_ENDPOINT}/me/mailFolders?$top=50", headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(status_code=graph_response.status_code, detail="Failed to fetch folders")

    return graph_response.json()
