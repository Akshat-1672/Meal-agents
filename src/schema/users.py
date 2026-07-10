# --- Pydantic Models ---
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class Meal(BaseModel):
    id: int | str
    type: str
    start: str
    end: str
    customName: str = ""


class UserProfile(BaseModel):
    id: str
    name: str
    preferences: list[str] = []
    allergies: list[str] = []
    days: list[str] = []  # List of day names: ["Monday", "Tuesday", etc.]
    meals: list[Meal] = []  # List of meal objects
    special_instructions: str = ""
    
    # Backward compatibility property for code that expects schedule
    @property
    def schedule(self) -> Dict[str, Any]:
        return {"days": self.days, "meals": [meal.model_dump() for meal in self.meals]}


class Session(BaseModel):
    app_name: str
    user_id: str
    id: str
    state: Dict[str, Any]
    create_time: datetime
    update_time: datetime


class ResumeRequest(BaseModel):
    choice: int | str  # 1, 2, or 3