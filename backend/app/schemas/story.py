from pydantic import BaseModel
from typing import Optional


class StoryCreateRequest(BaseModel):
    title: str
    story: str
    story_type: str = "სხვა"
    source: Optional[str] = None


class StoryUpdateRequest(BaseModel):
    title: Optional[str] = None
    story: Optional[str] = None
    story_type: Optional[str] = None
    source: Optional[str] = None


class StoryTogglePlayableRequest(BaseModel):
    is_playable: bool
