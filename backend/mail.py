from fastapi import APIRouter, Request, HTTPException
import httpx  # Use httpx for async HTTP requests

router = APIRouter()

GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0/me/messages"

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
        graph_response = await client.get(GRAPH_API_ENDPOINT, headers=headers)

    if graph_response.status_code != 200:
        raise HTTPException(status_code=graph_response.status_code, detail="Failed to fetch mails")

    mails = graph_response.json()

    return mails
