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

__all__ = [
    "SentenceEditInfo",
    "SentenceUpdate",
    "SentenceUpdateResponse",
    "StoryCreateRequest",
    "StoryUpdateRequest",
    "StoryTogglePlayableRequest",
]