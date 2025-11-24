from pydantic import BaseModel
from datetime import datetime

class WordData(BaseModel):
    normalized_word: str
    original_word: str
    part_of_speech: str | None = None

class AddWordToTourRequest(BaseModel):
    word_data: WordData
    position: int
    table_name: str
    added_by: str
    added_at: datetime

class TokenData(BaseModel):
    pass  # Assuming there are other attributes for TokenData not shown in the code block