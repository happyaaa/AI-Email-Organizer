from fastapi import APIRouter, Request, HTTPException
import httpx  # Use httpx for async HTTP requests
from urllib.parse import unquote

router = APIRouter()

GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0/me/messages"


@router.get("/")
async def get_mail(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=401, detail="Unauthorized: No token found")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient() as client:
        graph_response = await client.get(GRAPH_API_ENDPOINT, headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(
            status_code=graph_response.status_code, detail="Failed to fetch mails")

    mails = graph_response.json()

    return mails

@router.delete("/{message_id}")
async def delete_mail(message_id: str, request: Request):
    print("here", flush=True)
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized: No token found")

    decoded_message_id = unquote(message_id)
    print(f"Deleting message with id: {decoded_message_id}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }

    url = f"https://graph.microsoft.com/v1.0/me/messages/{decoded_message_id}"

    async with httpx.AsyncClient() as client:
        graph_response = await client.delete(url, headers=headers)
    print(f"Graph response: {graph_response}", flush=True)

    if graph_response.status_code != 204:
        raise HTTPException(status_code=graph_response.status_code, detail="Failed to delete mail")

    return {"message": "Mail deleted successfully"}