from fastapi import APIRouter, Request, HTTPException
import httpx  # Use httpx for async HTTP requests
from urllib.parse import unquote

router = APIRouter()

GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0/me"


@router.get("/")
async def get_mail(request: Request, folder_id: str = None):
    # print(f"Getting mail for folder_id: {folder_id}", flush=True)
    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=401, detail="Unauthorized: No token found")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    # Decide which URL to use
    if folder_id:
        url = f"{GRAPH_API_ENDPOINT}/mailFolders/{folder_id}/messages"
    else:
        url = f"{GRAPH_API_ENDPOINT}/messages"

    async with httpx.AsyncClient() as client:
        graph_response = await client.get(url, headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(
            status_code=graph_response.status_code, detail="Failed to fetch mails")

    mails = graph_response.json()

    return mails


@router.delete("/{message_id}")
async def delete_mail(message_id: str, request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=401, detail="Unauthorized: No token found")

    decoded_message_id = unquote(message_id)

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    url = f"{GRAPH_API_ENDPOINT}/messages/{decoded_message_id}"

    async with httpx.AsyncClient() as client:
        graph_response = await client.delete(url, headers=headers)
    print(f"Graph response: {graph_response}", flush=True)

    if graph_response.status_code != 204:
        raise HTTPException(
            status_code=graph_response.status_code, detail="Failed to delete mail")

    return {"message": "Mail deleted successfully"}


@router.get("/folders")
async def get_mail_folders(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=401, detail="Unauthorized: No token found")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        graph_response = await client.get(f"{GRAPH_API_ENDPOINT}/mailFolders?$top=50", headers=headers)
    print(f"Graph response: {graph_response}", flush=True)
    if graph_response.status_code != 200:
        raise HTTPException(
            status_code=graph_response.status_code, detail="Failed to fetch folders")

    folders = graph_response.json()
    return folders
