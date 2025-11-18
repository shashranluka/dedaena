"""
წინადადებების სქემები (Pydantic Models)
"""

from pydantic import BaseModel
from typing import Optional

class SentenceEditInfo(BaseModel):
    """წინადადების რედაქტირების ინფორმაცია"""
    position: int
    letter: str
    table_name: str
    edited_by: str
    edited_at: str


class SentenceUpdate(BaseModel):
    """წინადადების განახლების მოთხოვნა"""
    content: str
    info: SentenceEditInfo


class SentenceUpdateResponse(BaseModel):
    """წინადადების განახლების პასუხი"""
    success: bool
    message: str
    sentence_id: int  # ✅ int-ად შეცვლილია (იყო str)
    updated_content: str
    position: int
    letter: str
    
    class Config:
        from_attributes = True