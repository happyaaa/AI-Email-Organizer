from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from services.email_service import EmailService
from services.auth import get_current_user

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

@router.post("/email/process")
async def process_email_action(
    data: Dict[Any, Any],
    current_user = Depends(get_current_user)
):
    try:
        action = data.get("action")
        email_id = data.get("emailId")
        
        email_service = EmailService(current_user.access_token)
        
        actions = {
            "classify": email_service.classify_email,
            "summarize": email_service.summarize_email,
            "archive": email_service.archive_email,
        }
        
        if action not in actions:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        result = await actions[action](email_id)
        return {"success": True, "result": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))