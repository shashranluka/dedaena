"""
Schemas package
"""

from app.schemas.sentence import (
    SentenceEditInfo,
    SentenceUpdate,
    SentenceUpdateResponse
)

from app.schemas.story import (
    StoryCreateRequest,
    StoryUpdateRequest,
    StoryTogglePlayableRequest
)

from app.schemas.progress import (
    SaveProgressRequest
)

__all__ = [
    "SentenceEditInfo",
    "SentenceUpdate",
    "SentenceUpdateResponse",
    "StoryCreateRequest",
    "StoryUpdateRequest",
    "StoryTogglePlayableRequest",
    "SaveProgressRequest",
]