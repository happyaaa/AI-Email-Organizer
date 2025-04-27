from fastapi import APIRouter, Request, HTTPException, Body
from typing import Optional
import httpx
from pydantic import BaseModel

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

@router.get("/")
async def get_mail(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized: No token found")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        graph_response = await client.get(f"{GRAPH_API_ENDPOINT}/me/messages", headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(status_code=graph_response.status_code, detail="Failed to fetch mails")

    mails = graph_response.json()

    return mails

@router.post("/search")
async def search_mail(request: Request, search_params: SearchRequest):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized")

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
                error_body = await response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Graph API error: {error_body.get('error', {}).get('message', 'Unknown error')}"
                )

            return response.json()
            
    except Exception as e:
        print(f"Search error: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reply/{message_id}")
async def reply_mail(request: Request, message_id: str, reply_data: ReplyRequest):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    endpoint = f"{GRAPH_API_ENDPOINT}/me/messages/{message_id}/reply"
    data = {
        "comment": reply_data.content
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(endpoint, headers=headers, json=data)

    if response.status_code != 202:
        raise HTTPException(status_code=response.status_code, detail="Failed to reply to email")

    return {"message": "Reply sent successfully"}

@router.post("/compose")
async def compose_mail(request: Request, email_data: EmailRequest):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        message = {
            "subject": email_data.subject,
            "body": {
                "contentType": "text",
                "content": email_data.content
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": email_data.to
                    }
                }
            ]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GRAPH_API_ENDPOINT}/me/sendMail",
                headers=headers,
                json={"message": message}
            )

            if response.status_code != 202:
                try:
                    error_data = response.json()  # Remove await here
                    error_message = error_data.get('error', {}).get('message', 'Unknown error')
                except Exception:
                    error_message = f"Failed with status code: {response.status_code}"
                
                print(f"Graph API error: {error_message}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_message
                )

            return {"message": "Email sent successfully"}

    except Exception as e:
        print(f"Compose error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
