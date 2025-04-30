from fastapi import APIRouter, Request, HTTPException
from typing import Optional
import httpx
from pydantic import BaseModel
from urllib.parse import unquote

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


def get_token_from_header(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid Authorization header")
    return auth_header[len("Bearer "):]


@router.get("/")
async def get_mail(request: Request, folder_id: str = None):
    token = get_token_from_header(request)
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
    token = get_token_from_header(request)

    # Return only the first 5 characters of the token
    return {"token_prefix": token[:5]}



@router.post("/search")
async def search_mail(request: Request, search_params: SearchRequest):
    token = get_token_from_header(request)
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
    token = get_token_from_header(request)
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
    token = get_token_from_header(request)
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
    token = get_token_from_header(request)
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
    token = get_token_from_header(request)
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        graph_response = await client.get(f"{GRAPH_API_ENDPOINT}/me/mailFolders?$top=50", headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(status_code=graph_response.status_code, detail="Failed to fetch folders")

    return graph_response.json()
