from pydantic import BaseModel
from typing import List


class SaveProgressRequest(BaseModel):
    dedaena_table: str
    found_word_ids: List[int] = []
    found_sentence_ids: List[int] = []
    found_proverb_ids: List[int] = []
